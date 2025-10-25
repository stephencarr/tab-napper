/**
 * Reactive store for Chrome storage that keeps React state in sync
 * Handles automatic state updates when ANY app-related storage changes externally
 * 
 * This includes:
 * - Main data: inbox, stashed tabs, trash, notes
 * - UI data: quick access cards, user preferences  
 * - Meta data: smart suggestions metadata, encryption keys
 * - Dev data: mock history, test data
 * - Any triageHub_* or tabNapper_* prefixed keys
 */

import { loadAllAppData } from './storage.js';
import { debugLog, debugSuccess } from './debug.js';

// Global store state and listeners
let globalAppState = null;
let stateChangeListeners = new Set();

/**
 * Subscribe to app state changes
 * @param {Function} listener - Function to call when state changes
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToStateChanges(listener) {
  stateChangeListeners.add(listener);
  
  // Return unsubscribe function
  return () => {
    stateChangeListeners.delete(listener);
  };
}

/**
 * Notify all listeners of state changes
 * @param {Object} newState - New app state
 */
function notifyStateChange(newState) {
  globalAppState = newState;
  stateChangeListeners.forEach(listener => {
    try {
      listener(newState);
    } catch (error) {
      console.error('[Reactive Store] Error in state change listener:', error);
    }
  });
}

/**
 * Initialize the reactive store
 * Sets up Chrome storage listeners and loads initial state
 */
export async function initializeReactiveStore() {
  try {
    debugLog('ReactiveStore', 'Initializing reactive store...');
    
    // Load initial state
    const initialState = await loadAllAppData();
    globalAppState = initialState;
    debugSuccess('ReactiveStore', 'Initial state loaded');
    
    // Set up Chrome storage change listener
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        handleStorageChanges(changes, namespace);
      });
      debugSuccess('ReactiveStore', 'Chrome storage listeners registered');
    } else {
      console.warn('[Reactive Store] Chrome storage API not available - running in non-extension mode');
    }
    
    return initialState;
  } catch (error) {
    console.error('[Reactive Store] Failed to initialize:', error);
    throw error;
  }
}

/**
 * Handle Chrome storage changes and update React state
 * @param {Object} changes - Chrome storage changes object
 * @param {string} namespace - Storage namespace ('sync' or 'local')
 */
async function handleStorageChanges(changes, namespace) {
  try {
    debugLog('ReactiveStore', `Storage changes detected in ${namespace}:`, Object.keys(changes));

    // All app-related storage keys that should trigger state updates
    const appDataKeys = [
      // Main data keys
      'triageHub_inbox',
      'triageHub_stashedTabs',
      'triageHub_trash',
      'triageHub_notes',
      'triageHub_suggestionMetadata',

      // UI and preference keys
      'triageHub_quickAccessCards',
      'triageHub_userPreferences',
      'triageHub_encryptionKey',

      // Mock data and dev keys
      'tabNapper_mockHistory',

      // Any other triageHub_ prefixed keys
    ];

    // Check for any app-related changes (including wildcard for triageHub_ prefix)
    const relevantChanges = Object.keys(changes).filter(key =>
      appDataKeys.includes(key) || key.startsWith('triageHub_') || key.startsWith('tabNapper_')
    );

    if (relevantChanges.length > 0) {
      debugLog('ReactiveStore', 'Relevant app data changes detected:', relevantChanges);

      // PERFORMANCE: Only update changed keys instead of reloading everything
      // This reduces storage I/O from 5 reads to 1-2 reads per change
      if (!globalAppState) {
        // If no state exists yet, load all data
        const newState = await loadAllAppData();
        debugSuccess('ReactiveStore', 'Initial state loaded');
        notifyStateChange(newState);
        return;
      }

      // Clone current state and update only changed keys
      const updatedState = { ...globalAppState };
      let hasChanges = false;

      // Map storage keys to state property names
      const keyMapping = {
        'triageHub_inbox': 'inbox',
        'triageHub_stashedTabs': 'stashedTabs',
        'triageHub_trash': 'trash',
        'triageHub_notes': 'notes',
        'triageHub_quickAccessCards': 'quickAccessCards',
        'triageHub_userPreferences': 'userPreferences',
      };

      for (const storageKey of relevantChanges) {
        const stateKey = keyMapping[storageKey];
        if (stateKey) {
          // Use the new value from changes (already available, no need to read!)
          const newValue = changes[storageKey].newValue;
          // Use ?? instead of || to properly handle empty arrays/objects
          updatedState[stateKey] = newValue ?? (stateKey === 'userPreferences'
            ? { theme: 'light', analogFidgetSensitivity: 'medium' }
            : []);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        debugSuccess('ReactiveStore', 'State updated with granular changes:', relevantChanges);
        notifyStateChange(updatedState);
      }
    } else {
      debugLog('ReactiveStore', 'No relevant changes detected, skipping state refresh');
    }
  } catch (error) {
    console.error('[Reactive Store] Error handling storage changes:', error);
  }
}

/**
 * Get current app state
 * @returns {Object|null} - Current app state or null if not initialized
 */
export function getCurrentAppState() {
  return globalAppState;
}

/**
 * Manually refresh state from storage
 * Useful for forcing a refresh when needed
 */
export async function refreshStateFromStorage() {
  try {
    const newState = await loadAllAppData();
    notifyStateChange(newState);
    return newState;
  } catch (error) {
    console.error('[Reactive Store] Error refreshing state:', error);
    throw error;
  }
}

/**
 * Get the count of active state change listeners
 * Useful for debugging
 */
export function getListenerCount() {
  return stateChangeListeners.size;
}