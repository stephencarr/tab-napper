import React, { useState, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn.js';

/**
 * FidgetControl - ADHD-Friendly Fidget Control Logic and UI Component
 * 
 * A tactile, low-friction interface for scheduling and managing stashed items.
 * Features two intuitive "pills" that cycle through logical, contextual states.
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
    <div className={cn("flex flex-col space-y-3", className)}>
      {/* Zone 2: Action Block - The Fidget Pills with strict uniformity */}
      <div className="flex items-center space-x-2">
        {/* Action Pill with inline cancel - uniform height py-2 */}
        <div className="flex items-center space-x-1">
          <button
            onClick={cycleAction}
            className={cn(
              "py-2 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 select-none text-center min-w-[90px]",
              actionState === 'DELETE NOW' 
                ? deleteConfirmation
                  ? "bg-red-600 text-white shadow-lg ring-2 ring-red-300 animate-pulse"
                  : "bg-red-500 text-white hover:bg-red-600"
                : "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-900/80"
            )}
            title="Click to cycle through actions"
          >
            {actionState === 'DELETE NOW' && deleteConfirmation ? 'CONFIRM DELETE' : actionState}
          </button>
          
          {/* Inline Cancel button - matching height */}
          {actionState === 'DELETE NOW' && deleteConfirmation && (
            <button
              onClick={() => {
                setDeleteConfirmation(false);
                setActionState('Remind Me');
              }}
              className="w-8 h-8 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white transition-all duration-200 text-xs flex items-center justify-center"
              title="Cancel delete"
            >
              ✕
            </button>
          )}
        </div>

        {/* When Pill - uniform height py-2 */}
        <button
          onClick={actionState === 'DELETE NOW' && deleteConfirmation ? undefined : cycleWhen}
          className={cn(
            "py-2 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 select-none text-center min-w-[120px]",
            "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-200 dark:hover:bg-purple-900/80",
            actionState === 'DELETE NOW' && deleteConfirmation && "opacity-50 cursor-not-allowed"
          )}
          title={actionState === 'DELETE NOW' && deleteConfirmation ? 'Cancel delete first' : 'Click to cycle through timing options'}
          disabled={actionState === 'DELETE NOW' && deleteConfirmation}
        >
          {whenState}
        </button>

        {/* Execute Button - uniform height */}
        <button
          onClick={handleExecute}
          className="w-8 h-8 rounded-lg bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-200 dark:hover:bg-green-900/80 transition-all duration-200 flex items-center justify-center"
          title={actionState === 'DELETE NOW' && deleteConfirmation ? 'Confirm deletion' : 'Execute action'}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Zone 3: Commitment - Date and Time Preview (subtle & confirmatory) */}
      <div className="text-xs text-gray-500 dark:text-calm-400 leading-relaxed">
        {getPreviewText()}
      </div>
    </div>
  );
}

export default FidgetControl;