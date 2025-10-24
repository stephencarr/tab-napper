/**
 * Reactive storage hook for Tab Napper
 * Provides real-time updates when storage data changes
 */

import { useState, useEffect, useCallback } from 'react';
import { loadAppState } from './storage.js';
import { debugLog, debugError } from './debug.js';

// Global event emitter for storage changes
class StorageEventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
  }

  off(key, callback) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).delete(callback);
    }
  }

  emit(key, data) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[Tab Napper] Error in storage listener:', error);
        }
      });
    }
  }

  // Emit to all listeners that care about any storage change
  emitAll(changedKey, data) {
    this.emit(changedKey, data);
    this.emit('*', { key: changedKey, data });
  }
}

// Global storage event emitter instance
const storageEmitter = new StorageEventEmitter();

/**
 * Hook for reactive storage data
 * Automatically updates when storage changes
 */
export function useReactiveStorage(key, defaultValue = null) {
  const [data, setData] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await loadAppState(key);
      setData(result || defaultValue);
      // Only log if there's actually data or in development
      if (result && result.length > 0) {
        debugLog('Storage', `Loaded reactive data for ${key}`, `${result.length} items`);
      }
    } catch (err) {
      debugError('Storage', `Error loading reactive data for ${key}:`, err);
      setError(err.message);
      setData(defaultValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, defaultValue]);

  // Set up reactive listener
  useEffect(() => {
    // Load initial data
    loadData();

    let updateTimeout;
    
    // Listen for changes to this specific key
    const handleStorageChange = (newData) => {
      // Clear any pending update to debounce rapid changes
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      // Debounce updates to prevent flickering
      updateTimeout = setTimeout(() => {
        // Only log significant changes, not empty updates
        if (newData && newData.length > 0) {
          debugLog('Storage', `Reactive update for ${key}`, `${newData.length} items`);
        }
        setData(newData || defaultValue);
      }, 50); // 50ms debounce
    };

    storageEmitter.on(key, handleStorageChange);

    // Cleanup listener on unmount
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      storageEmitter.off(key, handleStorageChange);
    };
  }, [key, defaultValue, loadData]);

  // Refresh function to manually trigger reload
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return { data, isLoading, error, refresh };
}

/**
 * Hook for listening to all storage changes
 */
export function useStorageListener(callback) {
  useEffect(() => {
    storageEmitter.on('*', callback);
    return () => storageEmitter.off('*', callback);
  }, [callback]);
}

/**
 * Trigger storage change event (call this after updating storage)
 */
export function notifyStorageChange(key, newData) {
  // Only log for non-empty data changes
  if (newData && newData.length > 0) {
    debugLog('Storage', `Storage change notification: ${key}`, `${newData.length} items`);
  }
  storageEmitter.emitAll(key, newData);
}

/**
 * Set up Chrome storage listeners for external changes
 */
export function setupStorageListeners() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    // Listen for chrome.storage changes from other sources
    chrome.storage.onChanged.addListener((changes, areaName) => {
      // Filter for all app-related changes
      const relevantChanges = Object.keys(changes).filter(key => 
        key.startsWith('triageHub_') || key.startsWith('tabNapper_')
      );
      
      if (relevantChanges.length > 0) {
        debugLog('Storage', `Chrome storage changed in ${areaName}: ${relevantChanges.join(', ')}`);
      }
      
      // Emit changes for all app-related keys
      Object.keys(changes).forEach(key => {
        if (key.startsWith('triageHub_') || key.startsWith('tabNapper_')) {
          const newValue = changes[key].newValue;
          storageEmitter.emitAll(key, newValue);
        }
      });
    });
    
    debugLog('Storage', 'Chrome storage listeners set up for all app keys');
  } else {
    debugLog('Storage', 'Chrome storage API not available');
  }
}

/**
 * Initialize the reactive storage system
 */
export function initializeReactiveStorage() {
  debugLog('Storage', 'Setting up reactive storage system...');
  setupStorageListeners();
  debugLog('Storage', 'Reactive storage system ready');
}

export default useReactiveStorage;