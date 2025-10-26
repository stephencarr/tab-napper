/**
 * Schedule utility - Handles reminder/scheduling logic and Chrome alarms
 */

/**
 * Calculate the timestamp for a given "when" string
 * @param {string} whenText - Human-readable time text (e.g., "In 1 hour", "Tomorrow morning")
 * @returns {number} - Unix timestamp in milliseconds
 */
export function calculateScheduledTime(whenText) {
  const now = new Date();
  const result = new Date(now);

  switch (whenText) {
    case 'In 30 minutes':
      result.setMinutes(result.getMinutes() + 30);
      break;
    case 'In 1 hour':
      result.setHours(result.getHours() + 1);
      break;
    case 'In 2 hours':
      result.setHours(result.getHours() + 2);
      break;
    case 'In 3 hours':
      result.setHours(result.getHours() + 3);
      break;
    case 'This afternoon':
      // Set to 2 PM today
      result.setHours(14, 0, 0, 0);
      // If we're already past 2 PM, add a day
      if (result <= now) {
        result.setDate(result.getDate() + 1);
      }
      break;
    case 'This evening':
      // Set to 6 PM today
      result.setHours(18, 0, 0, 0);
      // If we're already past 6 PM, add a day
      if (result <= now) {
        result.setDate(result.getDate() + 1);
      }
      break;
    case 'Tomorrow morning':
      // Set to 9 AM tomorrow
      result.setDate(result.getDate() + 1);
      result.setHours(9, 0, 0, 0);
      break;
    case 'Tomorrow afternoon':
      // Set to 2 PM tomorrow
      result.setDate(result.getDate() + 1);
      result.setHours(14, 0, 0, 0);
      break;
    case 'Tomorrow':
      // Set to same time tomorrow
      result.setDate(result.getDate() + 1);
      break;
    case 'This weekend':
      // Set to Saturday 10 AM
      // Calculates days until Saturday (where Sunday=0, Saturday=6); the `|| 7` ensures that if today is Saturday, it schedules for next Saturday.
      const daysUntilSaturday = (6 - result.getDay() + 7) % 7 || 7;
      result.setDate(result.getDate() + daysUntilSaturday);
      result.setHours(10, 0, 0, 0);
      break;
    case 'Next week':
      // Set to Monday 9 AM next week
      const day = result.getDay();
      const daysToAdd = (1 - day + 7) % 7;
      result.setDate(result.getDate() + daysToAdd);
      if (daysToAdd === 0) { // If it's Monday, go to next week's Monday
        result.setDate(result.getDate() + 7);
      }
      result.setHours(9, 0, 0, 0);
      break;
    case 'Next month':
      // Set to the 1st of next month at 9 AM
      result.setMonth(result.getMonth() + 1);
      result.setDate(1);
      result.setHours(9, 0, 0, 0);
      break;
    default:
      // Default to 1 hour from now if unrecognized
      result.setHours(result.getHours() + 1);
  }

  return result.getTime();
}

/**
 * Create a unique alarm name for an item
 * Format: tabNapper::{action}::{itemId}
 * Using :: separator avoids conflicts with underscores in action names
 * @param {Object} item - The item to schedule
 * @param {string} action - The action type (remind_me, follow_up, review)
 * @returns {string} - Unique alarm name
 */
export function createAlarmName(item, action) {
  return `tabNapper::${action}::${item.id}`;
}

/**
 * Set a Chrome alarm for a scheduled item
 * @param {Object} item - The item to schedule
 * @param {string} action - The action type (remind_me, follow_up, review)
 * @param {number} scheduledTime - Unix timestamp in milliseconds when the alarm should fire
 * @returns {Promise<void>}
 */
export async function setScheduledAlarm(item, action, scheduledTime) {
  if (typeof chrome === 'undefined' || !chrome.alarms) {
    console.warn('[Schedule] Chrome alarms API not available');
    return;
  }

  const alarmName = createAlarmName(item, action);
  
  // Chrome alarms require a minimum delay of 0.1 minutes (6 seconds)
  // Values below this threshold are not guaranteed to work reliably
  // See: https://developer.chrome.com/docs/extensions/reference/api/alarms/#method-create
  const now = Date.now();
  const delayMinutes = Math.max(0.1, (scheduledTime - now) / 60000);

  try {
    await chrome.alarms.create(alarmName, {
      delayInMinutes: delayMinutes
    });
    console.log(`[Schedule] ✅ Alarm set successfully:`);
    console.log(`  - Name: ${alarmName}`);
    console.log(`  - Item: ${item.title}`);
    console.log(`  - Scheduled for: ${new Date(scheduledTime).toLocaleString()}`);
    console.log(`  - Delay: ${delayMinutes.toFixed(2)} minutes`);
    
    // Verify the alarm was created
    chrome.alarms.get(alarmName, (alarm) => {
      if (alarm) {
        console.log(`  - ✅ Verified: Alarm will fire at ${new Date(alarm.scheduledTime).toLocaleString()}`);
      } else {
        console.error(`  - ❌ Failed to verify alarm creation`);
      }
    });
  } catch (error) {
    console.error('[Schedule] ❌ Error setting alarm:', error);
  }
}

/**
 * Clear a scheduled alarm for an item
 * @param {Object} item - The item whose alarm should be cleared
 * @param {string} action - The action type (remind_me, follow_up, review)
 * @returns {Promise<boolean>} - True if alarm was cleared
 */
export async function clearScheduledAlarm(item, action) {
  if (typeof chrome === 'undefined' || !chrome.alarms) {
    console.warn('[Schedule] Chrome alarms API not available');
    return false;
  }

  const alarmName = createAlarmName(item, action);
  
  try {
    const wasCleared = await chrome.alarms.clear(alarmName);
    if (wasCleared) {
      console.log(`[Schedule] Alarm cleared: ${alarmName}`);
    }
    return wasCleared;
  } catch (error) {
    console.error('[Schedule] Error clearing alarm:', error);
    return false;
  }
}

/**
 * Clear all alarms for an item (in case it has scheduled actions)
 * @param {Object} item - The item whose alarms should be cleared
 * @returns {Promise<void>}
 */
export async function clearAllAlarmsForItem(item) {
  if (typeof chrome === 'undefined' || !chrome.alarms) {
    console.warn('[Schedule] Chrome alarms API not available');
    return;
  }

  // Possible action types that could have alarms
  const possibleActions = ['remind_me', 'follow_up', 'review'];
  
  try {
    for (const action of possibleActions) {
      const alarmName = createAlarmName(item, action);
      const wasCleared = await chrome.alarms.clear(alarmName);
      if (wasCleared) {
        console.log(`[Schedule] Alarm cleared: ${alarmName}`);
      }
    }
  } catch (error) {
    console.error('[Schedule] Error clearing alarms for item:', error);
  }
}

/**
 * Get a human-friendly description of the scheduled time
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Human-friendly description
 */
export function getScheduledTimeDescription(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = timestamp - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMinutes < 60) {
    return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  } else if (diffHours < 24) {
    return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  } else if (diffDays < 7) {
    return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else {
    return `on ${date.toLocaleDateString()}`;
  }
}

/**
 * Get a detailed human-friendly description of when an item is scheduled
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Human-friendly description with date and time
 */
export function getDetailedScheduledTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const isPastDue = timestamp < now.getTime();
  
  // Format time
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  // If past due, show how long ago
  if (isPastDue) {
    const MS_PER_MINUTE = 60000;
    const MS_PER_HOUR = 3600000;
    const MS_PER_DAY = 86400000;

    const diffMs = now.getTime() - timestamp;
    const diffMinutes = Math.floor(diffMs / MS_PER_MINUTE);
    const diffHours = Math.floor(diffMs / MS_PER_HOUR);

    // Calculate days based on calendar dates, not 24-hour periods
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfReminderDate = new Date(timestamp);
    startOfReminderDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((startOfToday.getTime() - startOfReminderDate.getTime()) / MS_PER_DAY);
    
    if (diffMinutes < 1) {
      return 'Past due (Just now)';
    } else if (diffMinutes < 60) {
      return `Past due (${diffMinutes}m ago)`;
    } else if (diffHours < 24) {
      return `Past due (${diffHours}h ago)`;
    } else if (diffDays === 1) {
      return `Past due (Yesterday at ${timeStr})`;
    } else if (diffDays < 7) {
      return `Past due (${diffDays}d ago)`;
    } else {
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
      return `Past due (${dateStr})`;
    }
  }
  
  // Check if it's today
  const isToday = date.toDateString() === now.toDateString();
  
  // Check if it's tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  if (isToday) {
    return `Today at ${timeStr}`;
  } else if (isTomorrow) {
    return `Tomorrow at ${timeStr}`;
  } else {
    // Check if within this week
    const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 7 && diffDays > 0) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      return `${dayName} at ${timeStr}`;
    } else {
      // Use full date
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
      return `${dateStr} at ${timeStr}`;
    }
  }
}
