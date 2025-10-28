import React, { useState, useCallback, useEffect } from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn.js';

/**
 * FidgetControl - ADHD-Friendly Fidget Control Logic and UI Component
 * 
 * A tactile, low-friction interface for scheduling and managing stashed items.
 * Features button group design with action/timing pills and execute button.
 */
function FidgetControl({ item, onAction, className }) {
  // Control states - simplified to just action and when
  const [actionState, setActionState] = useState('Remind Me');
  const [whenState, setWhenState] = useState('In 5 minutes');
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Action cycle states (removed DELETE NOW)
  const actionCycle = ['Remind Me', 'Follow Up', 'Review'];
  
  // Auto-reset delete confirmation after 3 seconds
  useEffect(() => {
    if (!deleteConfirmation) return;
    
    const timeoutId = setTimeout(() => {
      setDeleteConfirmation(false);
    }, 3000);
    
    // Cleanup timeout on unmount or when deleteConfirmation becomes false
    return () => clearTimeout(timeoutId);
  }, [deleteConfirmation]);
  
  // Smart contextual "when" options - completely overhauled for context-sensitivity
  const getSmartWhenOptions = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentDate = now.getDate();
    const currentMonth = now.getMonth();
    const options = [];
    
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // PHASE 1: TODAY - Fine-grained hour-based options
    // Only show hour options that make sense for remaining hours in the day
    const hoursLeftToday = 23 - currentHour;
    
    // Always show very short intervals
    options.push('In 5 minutes', 'In 10 minutes', 'In 30 minutes');
    
    // Add hour options based on how much of the day is left
    if (hoursLeftToday >= 1) options.push('In 1 hour');
    if (hoursLeftToday >= 2) options.push('In 2 hours');
    if (hoursLeftToday >= 3) options.push('In 3 hours');
    if (hoursLeftToday >= 4) options.push('In 4 hours');
    
    // Context-aware same-day options
    if (currentHour < 12) {
      // Morning: offer afternoon
      options.push('This afternoon'); // 2 PM
    }
    if (currentHour < 17) {
      // Before evening: offer evening
      options.push('This evening'); // 6 PM
    }
    if (currentHour < 20) {
      // Before night: offer tonight
      options.push('Tonight'); // 9 PM
    }
    
    // PHASE 2: TOMORROW - Time-specific options for next day
    options.push('Tomorrow morning'); // 9 AM
    options.push('Tomorrow afternoon'); // 2 PM
    options.push('Tomorrow evening'); // 6 PM
    
    // PHASE 3: THIS WEEK - Weekday names (starting from day after tomorrow)
    // Show upcoming weekdays for the rest of this week
    const daysUntilSunday = (7 - currentDay) % 7; // Days left in this week
    
    for (let i = 2; i <= 7; i++) { // Start from 2 (day after tomorrow)
      const dayIndex = (currentDay + i) % 7;
      const dayName = weekdays[dayIndex];
      
      // Only add if it's within this week (before next Sunday)
      if (i <= daysUntilSunday) {
        options.push(dayName); // All weekdays default to 9 AM
      } else {
        // Next week - stop adding weekdays
        break;
      }
    }
    
    // PHASE 3: NEXT WEEK - Less granular
    // Only show "Next week" if we're not already at the end of this week
    if (currentDay < 5) { // Monday to Thursday
      options.push('Next week'); // Next Monday 9 AM
    } else if (currentDay === 5 || currentDay === 6) { // Friday or Saturday
      options.push('Next Monday'); // Specific day name for clarity
    }
    
    // PHASE 4: TWO WEEKS - Even less granular
    const twoWeeksFromNow = new Date(now);
    twoWeeksFromNow.setDate(currentDate + 14);
    
    // Only show "2 weeks" if we're in the first half of the month
    if (currentDate <= 15) {
      options.push('In 2 weeks');
    }
    
    // PHASE 5: MONTH - Least granular
    options.push('Next month');
    
    return options;
  }, []);

  // Cycle to next action state
  const cycleAction = useCallback(() => {
    const currentIndex = actionCycle.indexOf(actionState);
    const nextIndex = (currentIndex + 1) % actionCycle.length;
    setActionState(actionCycle[nextIndex]);
  }, [actionState, actionCycle]);

  // Cycle to next when state
  const cycleWhen = useCallback(() => {
    const whenOptions = getSmartWhenOptions();
    const currentIndex = whenOptions.indexOf(whenState);
    const nextIndex = (currentIndex + 1) % whenOptions.length;
    setWhenState(whenOptions[nextIndex]);
  }, [whenState, getSmartWhenOptions]);

  // Handle delete button click
  const handleDelete = useCallback(() => {
    if (deleteConfirmation) {
      // Second click - execute deletion
      if (onAction) {
        onAction('delete', item);
      }
      setDeleteConfirmation(false);
    } else {
      // First click - enable confirmation mode
      setDeleteConfirmation(true);
    }
  }, [deleteConfirmation, onAction, item]);

  // Handle execute action
  const handleExecute = useCallback(() => {
    if (onAction) {
      const actionData = {
        action: actionState.toLowerCase().replaceAll(' ', '_'),
        when: whenState,
        timestamp: Date.now()
      };
      onAction(actionData.action, item, actionData);
      
      // Show confirmation
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    }
  }, [actionState, whenState, onAction, item]);

  // Generate friendly preview text
  const getPreviewText = useCallback(() => {
    const action = actionState.toLowerCase();
    return `${action}: ${whenState.toLowerCase()}`;
  }, [actionState, whenState]);

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      {/* Confirmation message */}
      {showConfirmation && (
        <div className="text-xs text-green-600 dark:text-green-400 font-medium animate-fade-in">
          ✓ Moved to Stash
        </div>
      )}
      
      {/* Action Group: Button Group Pattern */}
      <div className="flex items-center justify-end space-x-2">
        {/* Fidget Pills Button Group - Fixed width to prevent jumping */}
        <div className="inline-flex rounded-md shadow-sm" role="group">
          {/* Action Pill - Fixed width */}
          <button
            onClick={cycleAction}
            className={cn(
              "relative inline-flex items-center justify-center w-24 px-3 py-1.5 text-xs font-medium rounded-l-md border transition-colors",
              "border-calm-300 dark:border-calm-600 bg-white dark:bg-calm-800 text-calm-700 dark:text-calm-300 hover:bg-calm-50 dark:hover:bg-calm-750"
            )}
            title="Click to cycle through actions"
          >
            {actionState}
          </button>
          
          {/* When Pill - Fixed width */}
          <button
            onClick={cycleWhen}
            className={cn(
              "relative -ml-px inline-flex items-center justify-center w-40 px-3 py-1.5 text-xs font-medium border transition-colors",
              "border-calm-300 dark:border-calm-600 bg-white dark:bg-calm-800 text-calm-700 dark:text-calm-300 hover:bg-calm-50 dark:hover:bg-calm-750"
            )}
            title="Click to cycle through timing options"
          >
            {whenState}
          </button>

          {/* Execute Button */}
          <button
            onClick={handleExecute}
            className={cn(
              "relative -ml-px inline-flex items-center justify-center w-8 py-1.5 rounded-r-md border transition-colors",
              "border-calm-300 dark:border-calm-600 bg-emerald-500 dark:bg-emerald-600 text-white hover:bg-emerald-600 dark:hover:bg-emerald-700"
            )}
            title="Execute action"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className={cn(
            "inline-flex items-center justify-center h-8 w-8 rounded-md border transition-colors",
            deleteConfirmation
              ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
              : "border-calm-300 dark:border-calm-600 bg-white dark:bg-calm-800 text-calm-500 dark:text-calm-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700"
          )}
          title={deleteConfirmation ? "Click again to confirm deletion" : "Delete item"}
        >
          {deleteConfirmation ? (
            <span className="text-[10px] font-bold">✓</span>
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Preview Text */}
      <div className="text-xs text-right text-calm-500 dark:text-calm-400">
        {deleteConfirmation ? 'Click again to confirm deletion' : getPreviewText()}
      </div>
    </div>
  );
}

export default FidgetControl;