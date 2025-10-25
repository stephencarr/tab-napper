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
      const daysUntilSaturday = (6 - result.getDay() + 7) % 7 || 7;
      result.setDate(result.getDate() + daysUntilSaturday);
      result.setHours(10, 0, 0, 0);
      break;
    case 'Next week':
      // Set to Monday 9 AM next week
      const daysUntilNextMonday = ((1 - result.getDay() + 7) % 7) + 7;
      result.setDate(result.getDate() + daysUntilNextMonday);
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
 * @param {Object} item - The item to schedule
 * @param {string} action - The action type (remind_me, follow_up, review)
 * @returns {string} - Unique alarm name
 */
export function createAlarmName(item, action) {
  return `tabNapper_${action}_${item.id}`;
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
  
  // Chrome alarms use minutes from now, not absolute timestamps
  const now = Date.now();
  const delayMinutes = Math.max(0.1, (scheduledTime - now) / 60000); // Minimum 0.1 minutes

  try {
    await chrome.alarms.create(alarmName, {
      delayInMinutes: delayMinutes
    });
    console.log(`[Schedule] Alarm set: ${alarmName} for ${new Date(scheduledTime).toLocaleString()}`);
  } catch (error) {
    console.error('[Schedule] Error setting alarm:', error);
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
  
  // Check if it's today
  const isToday = date.toDateString() === now.toDateString();
  
  // Check if it's tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  // Format time
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
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
