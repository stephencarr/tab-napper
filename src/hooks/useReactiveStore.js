/**
 * Hook for accessing reactive store data
 * Guarantees fresh data by reading directly from the global store
 * instead of relying on async React state updates
 */

import { useState, useEffect } from 'react';
import { subscribeToStateChanges, getCurrentAppState } from '../utils/reactiveStore.js';

/**
 * Hook that subscribes to reactive store and returns fresh data
 * Forces re-render immediately when store updates
 * 
 * @returns {Object|null} - Current app state from the global store
 */
export function useReactiveStore() {
  // Use a counter to force re-renders when store changes
  const [, forceUpdate] = useState(0);
  
  useEffect(() => {
    console.log('[useReactiveStore] Setting up subscription');
    
    // Subscribe to store changes and force re-render
    const unsubscribe = subscribeToStateChanges((newState) => {
      console.log('[useReactiveStore] Store changed, forcing re-render', {
        inbox: newState?.inbox?.length,
        stashedTabs: newState?.stashedTabs?.length,
        trash: newState?.trash?.length
      });
      forceUpdate(prev => prev + 1);
    });
    
    return () => {
      console.log('[useReactiveStore] Cleaning up subscription');
      unsubscribe();
    };
  }, []);
  
  // Always return the current state from the global store
  // This guarantees we get fresh data, not stale React state
  const currentState = getCurrentAppState();
  console.log('[useReactiveStore] Returning current state', {
    inbox: currentState?.inbox?.length,
    stashedTabs: currentState?.stashedTabs?.length,
    trash: currentState?.trash?.length
  });
  return currentState;
}
