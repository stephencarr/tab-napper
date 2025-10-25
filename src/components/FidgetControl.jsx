import React, { useState, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
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
  const [whenState, setWhenState] = useState('In 1 hour');
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  
  // Action cycle states
  const actionCycle = ['Remind Me', 'Follow Up', 'Review', 'DELETE NOW'];
  
  // Smart contextual "when" options that always make logical sense
  const getSmartWhenOptions = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const options = [];
    
    // Always available quick options
    options.push('In 30 minutes', 'In 1 hour', 'In 2 hours', 'In 3 hours');
    
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
    
    // Always available future options
    options.push('Tomorrow', 'This weekend', 'Next week', 'Next month');
    
    return options;
  }, []);

  // Cycle to next action state
  const cycleAction = useCallback(() => {
    // If we're in DELETE NOW state, handle confirmation logic
    if (actionState === 'DELETE NOW') {
      if (deleteConfirmation) {
        // Second click on DELETE NOW = actual deletion
        if (onAction) {
          onAction('delete', item);
        }
        setDeleteConfirmation(false);
      } else {
        // First click on DELETE NOW = enable confirmation mode
        setDeleteConfirmation(true);
        // Auto-reset confirmation after 3 seconds to prevent accidental deletion
        setTimeout(() => {
          setDeleteConfirmation(false);
        }, 3000);
      }
      return;
    }

    // Normal cycling through actions
    const currentIndex = actionCycle.indexOf(actionState);
    const nextIndex = (currentIndex + 1) % actionCycle.length;
    setActionState(actionCycle[nextIndex]);
    
    // Reset delete confirmation when cycling away from DELETE NOW
    setDeleteConfirmation(false);
  }, [actionState, deleteConfirmation, onAction, item, actionCycle]);

  // Cycle to next when state
  const cycleWhen = useCallback(() => {
    const whenOptions = getSmartWhenOptions();
    const currentIndex = whenOptions.indexOf(whenState);
    const nextIndex = (currentIndex + 1) % whenOptions.length;
    setWhenState(whenOptions[nextIndex]);
  }, [whenState, getSmartWhenOptions]);

  // Handle execute action
  const handleExecute = useCallback(() => {
    if (actionState === 'DELETE NOW' && !deleteConfirmation) {
      // If DELETE NOW but not confirmed, start confirmation process
      cycleAction();
      return;
    }

    // For all other actions, execute immediately
    if (onAction) {
      const actionData = {
        action: actionState.toLowerCase().replace(' ', '_'),
        when: whenState,
        timestamp: Date.now()
      };
      onAction(actionData.action, item, actionData);
    }
  }, [actionState, whenState, deleteConfirmation, onAction, item, cycleAction]);

  // Generate friendly preview text
  const getPreviewText = useCallback(() => {
    const action = actionState.toLowerCase();
    
    if (actionState === 'DELETE NOW') {
      if (deleteConfirmation) {
        return 'Click again to confirm deletion';
      }
      return 'Click to delete this item';
    }
    
    return `${action}: ${whenState.toLowerCase()}`;
  }, [actionState, whenState, deleteConfirmation]);

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
              actionState === 'DELETE NOW' 
                ? deleteConfirmation
                  ? "border-red-600 bg-red-600 text-white hover:bg-red-700 z-10"
                  : "border-red-500 bg-red-500 text-white hover:bg-red-600"
                : "border-calm-300 dark:border-calm-600 bg-white dark:bg-calm-800 text-calm-700 dark:text-calm-300 hover:bg-calm-50 dark:hover:bg-calm-750"
            )}
            title="Click to cycle through actions"
          >
            {actionState === 'DELETE NOW' && deleteConfirmation ? '⚠ CONFIRM' : actionState}
          </button>
          
          {/* When Pill */}
          <button
            onClick={actionState === 'DELETE NOW' && deleteConfirmation ? undefined : cycleWhen}
            className={cn(
              "relative -ml-px inline-flex items-center px-3 py-1.5 text-xs font-medium border transition-colors",
              actionState === 'DELETE NOW' && deleteConfirmation
                ? "border-calm-300 dark:border-calm-600 bg-calm-100 dark:bg-calm-700 text-calm-400 dark:text-calm-500 cursor-not-allowed"
                : "border-calm-300 dark:border-calm-600 bg-white dark:bg-calm-800 text-calm-700 dark:text-calm-300 hover:bg-calm-50 dark:hover:bg-calm-750"
            )}
            title={actionState === 'DELETE NOW' && deleteConfirmation ? 'Cancel delete first' : 'Click to cycle through timing options'}
            disabled={actionState === 'DELETE NOW' && deleteConfirmation}
          >
            {whenState}
          </button>

          {/* Execute Button */}
          <button
            onClick={handleExecute}
            className={cn(
              "relative -ml-px inline-flex items-center justify-center w-8 py-1.5 rounded-r-md border transition-colors",
              actionState === 'DELETE NOW' && deleteConfirmation
                ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                : "border-calm-300 dark:border-calm-600 bg-emerald-500 dark:bg-emerald-600 text-white hover:bg-emerald-600 dark:hover:bg-emerald-700"
            )}
            title={actionState === 'DELETE NOW' && deleteConfirmation ? 'Confirm deletion' : 'Execute action'}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Cancel button for delete confirmation */}
        {actionState === 'DELETE NOW' && deleteConfirmation && (
          <button
            onClick={() => {
              setDeleteConfirmation(false);
              setActionState('Remind Me');
            }}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-calm-300 dark:border-calm-600 bg-white dark:bg-calm-800 text-calm-700 dark:text-calm-300 hover:bg-calm-50 dark:hover:bg-calm-750 transition-colors"
            title="Cancel delete"
          >
            ✕
          </button>
        )}
      </div>

      {/* Preview Text */}
      <div className="text-xs text-right text-calm-500 dark:text-calm-400">
        {getPreviewText()}
      </div>
    </div>
  );
}

export default FidgetControl;