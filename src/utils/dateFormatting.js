/**
 * Friendly date formatting utility for Tab Napper
 * Provides human-readable date/time strings for the FidgetControl component
 */

/**
 * Get friendly date string based on action, day anchor, and time moment
 * @param {string} action - The action state (Remind Me, Follow Up, Review, DELETE NOW)
 * @param {string} dayAnchor - The day anchor (Today, Tomorrow, Monday, etc.)
 * @param {string} timeMoment - The time moment (Morning, Afternoon, etc.)
 * @returns {string} - Human-readable date/time string
 */
export function getFriendlyDateTime(action, dayAnchor, timeMoment) {
  const now = new Date();
  const targetDate = calculateTargetDate(dayAnchor, now);
  const timeString = formatTimeMoment(timeMoment, targetDate, now);
  
  // Special handling for DELETE NOW
  if (action === 'DELETE NOW') {
    return 'This item will be deleted immediately';
  }
  
  const dateString = formatDateAnchor(dayAnchor, targetDate, now);
  
  if (timeString) {
    return `${action}: ${dateString} ${timeString}`;
  }
  
  return `${action}: ${dateString}`;
}

/**
 * Calculate the target date based on day anchor
 * @param {string} dayAnchor - The day anchor string
 * @param {Date} now - Current date
 * @returns {Date} - Target date
 */
function calculateTargetDate(dayAnchor, now) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  switch (dayAnchor) {
    case 'Today':
      return today;
      
    case 'Tomorrow':
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
      
    case 'Monday':
    case 'Tuesday':
    case 'Wednesday':
    case 'Thursday':
    case 'Friday':
    case 'Saturday':
    case 'Sunday':
      return getNextWeekday(dayAnchor, today);
      
    case 'Next Month':
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
      
    case 'Custom':
      return today; // Default to today for custom
      
    default:
      // Handle "Next Week (Day)" format
      if (dayAnchor.startsWith('Next Week (') && dayAnchor.endsWith(')')) {
        const day = dayAnchor.slice(11, -1); // Extract day from "Next Week (Mon)"
        const fullDay = expandDayName(day);
        return getNextWeekday(fullDay, today, true); // true = force next week
      }
      return today;
  }
}

/**
 * Get the next occurrence of a specific weekday
 * @param {string} dayName - Full day name (Monday, Tuesday, etc.)
 * @param {Date} fromDate - Starting date
 * @param {boolean} forceNextWeek - Force it to be next week even if today matches
 * @returns {Date} - Next occurrence of that weekday
 */
function getNextWeekday(dayName, fromDate, forceNextWeek = false) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDayIndex = days.indexOf(dayName);
  
  if (targetDayIndex === -1) return fromDate;
  
  const currentDayIndex = fromDate.getDay();
  let daysToAdd = targetDayIndex - currentDayIndex;
  
  // If it's the same day and we don't want to force next week, return today
  if (daysToAdd === 0 && !forceNextWeek) {
    return fromDate;
  }
  
  // If the day has passed this week or we're forcing next week, go to next week
  if (daysToAdd <= 0 || forceNextWeek) {
    daysToAdd += 7;
  }
  
  const targetDate = new Date(fromDate);
  targetDate.setDate(targetDate.getDate() + daysToAdd);
  return targetDate;
}

/**
 * Expand abbreviated day names to full names
 * @param {string} abbrev - Abbreviated day (Mon, Tue, etc.)
 * @returns {string} - Full day name
 */
function expandDayName(abbrev) {
  const mapping = {
    'Mon': 'Monday',
    'Tue': 'Tuesday', 
    'Wed': 'Wednesday',
    'Thu': 'Thursday',
    'Fri': 'Friday',
    'Sat': 'Saturday',
    'Sun': 'Sunday'
  };
  return mapping[abbrev] || abbrev;
}

/**
 * Format the date anchor into readable text
 * @param {string} dayAnchor - The day anchor string
 * @param {Date} targetDate - The calculated target date
 * @param {Date} now - Current date
 * @returns {string} - Formatted date string
 */
function formatDateAnchor(dayAnchor, targetDate, now) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'today';
  } else if (diffDays === 1) {
    return 'tomorrow';
  } else if (diffDays <= 7) {
    return targetDate.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return targetDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

/**
 * Format the time moment into readable text
 * @param {string} timeMoment - The time moment string
 * @param {Date} targetDate - The target date
 * @param {Date} now - Current date
 * @returns {string} - Formatted time string
 */
function formatTimeMoment(timeMoment, targetDate, now) {
  switch (timeMoment) {
    case 'Morning':
      return 'in the morning';
      
    case 'Afternoon':
      return 'in the afternoon';
      
    case 'Evening':
      return 'in the evening';
      
    case 'Anytime':
      return 'anytime';
      
    case 'Specific Time':
      return 'at a specific time';
      
    default:
      // Handle "X Hours Away" format
      if (timeMoment.includes('Hour') && timeMoment.includes('Away')) {
        const hours = parseInt(timeMoment.match(/(\d+)/)?.[1] || '1');
        if (hours === 1) {
          return 'in 1 hour';
        }
        return `in ${hours} hours`;
      }
      return '';
  }
}

/**
 * Check if a time moment has passed for today
 * @param {string} timeMoment - The time moment to check
 * @param {Date} now - Current date/time
 * @returns {boolean} - Whether this time has passed
 */
export function hasTimePassed(timeMoment, now = new Date()) {
  const currentHour = now.getHours();
  
  switch (timeMoment) {
    case 'Morning':
      return currentHour >= 12; // Morning ends at noon
      
    case 'Afternoon':
      return currentHour >= 18; // Afternoon ends at 6 PM
      
    case 'Evening':
      return currentHour >= 22; // Evening ends at 10 PM
      
    case 'Anytime':
    case 'Specific Time':
      return false; // These never pass
      
    default:
      // Handle "X Hours Away" format
      if (timeMoment.includes('Hour') && timeMoment.includes('Away')) {
        const hours = parseInt(timeMoment.match(/(\d+)/)?.[1] || '1');
        const targetTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
        return targetTime.getTime() <= now.getTime();
      }
      return false;
  }
}

/**
 * Get the next available time moment (skipping past ones for today)
 * @param {string} currentMoment - Current time moment
 * @param {boolean} isToday - Whether the selected date is today
 * @param {Date} now - Current date/time
 * @returns {string} - Next available time moment
 */
export function getNextAvailableTimeMoment(currentMoment, isToday, now = new Date()) {
  const allMoments = [
    'Morning',
    'Afternoon', 
    'Evening',
    'Anytime',
    ...Array.from({ length: 24 }, (_, i) => `${i + 1} Hour${i === 0 ? '' : 's'} Away`)
  ];
  
  if (!isToday) {
    // If not today, all moments are available
    const currentIndex = allMoments.indexOf(currentMoment);
    const nextIndex = (currentIndex + 1) % allMoments.length;
    return allMoments[nextIndex];
  }
  
  // For today, skip past moments
  const availableMoments = allMoments.filter(moment => !hasTimePassed(moment, now));
  
  if (availableMoments.length === 0) {
    // If all moments have passed, start with Morning (for tomorrow logic)
    return 'Morning';
  }
  
  const currentIndex = availableMoments.indexOf(currentMoment);
  if (currentIndex === -1) {
    // Current moment has passed, return first available
    return availableMoments[0];
  }
  
  const nextIndex = (currentIndex + 1) % availableMoments.length;
  return availableMoments[nextIndex];
}