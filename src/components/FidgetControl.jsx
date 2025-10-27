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
  
  // Smart contextual "when" options that always make logical sense
  const getSmartWhenOptions = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const options = [];
    
    // Always available quick options - now including very short intervals
    options.push('In 5 minutes', 'In 10 minutes', 'In 30 minutes', 'In 1 hour', 'In 2 hours', 'In 3 hours');
    
    // Context-aware options based on time of day
    if (currentHour < 12) {
      // Morning: offer afternoon and evening
      options.push('This afternoon', 'This evening');
    } else if (currentHour < 17) {
      // Afternoon: offer evening and tomorrow
      options.push('This evening', 'Tomorrow morning');
    } else {
      // Evening: offer tomorrow options
      options.push('Tomorrow morning', 'Tomorrow afternoon');
    }
    
    // Add weekday options for granular weekly planning
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daysToAdd = [];
    
    // Add next 3 weekdays (skipping today)
    for (let i = 1; i <= 3; i++) {
      const dayIndex = (currentDay + i) % 7;
      const dayName = weekdays[dayIndex];
      daysToAdd.push(dayName);
    }
    
    options.push(...daysToAdd);
    
    // Always available future options
    options.push('Tomorrow', 'This weekend', 'Next week', 'Next month');
    
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
    }
  }, [actionState, whenState, onAction, item]);

  // Generate friendly preview text
  const getPreviewText = useCallback(() => {
    const action = actionState.toLowerCase();
    return `${action}: ${whenState.toLowerCase()}`;
  }, [actionState, whenState]);

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      {/* Action Group: Button Group Pattern */}
      <div className="flex items-center justify-end space-x-2">
        {/* Fidget Pills Button Group */}
        <div className="inline-flex rounded-md shadow-sm" role="group">
          {/* Action Pill */}
          <button
            onClick={cycleAction}
            className={cn(
              "relative inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-l-md border transition-colors",
              "border-calm-300 dark:border-calm-600 bg-white dark:bg-calm-800 text-calm-700 dark:text-calm-300 hover:bg-calm-50 dark:hover:bg-calm-750"
            )}
            title="Click to cycle through actions"
          >
            {actionState}
          </button>
          
          {/* When Pill */}
          <button
            onClick={cycleWhen}
            className={cn(
              "relative -ml-px inline-flex items-center px-3 py-1.5 text-xs font-medium border transition-colors",
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