/**
 * Storage utilities for Tab Napper
 * Implements hybrid storage model: sync for critical data, local for bulk data
 */

import { encryptString, decryptString } from './encryption.js';
import { notifyStorageChange } from './reactiveStorage.js';

// Storage key mapping - determines which keys go to sync vs local storage
const SYNC_STORAGE_KEYS = new Set([
  'triageHub_encryptionKey',     // E2EE key
  'triageHub_quickAccessCards',  // Quick Access Cards (small, critical)
  'triageHub_userPreferences',   // User settings
]);

const LOCAL_STORAGE_KEYS = new Set([
  'triageHub_inbox',           // _Triage_Inbox (bulk data)
  'triageHub_stashedTabs',     // StashedTabs (bulk data)
  'triageHub_trash',           // Trash (bulk data)
  'triageHub_notes',           // Notes (bulk data)
  'triageHub_suggestionMetadata', // Smart suggestion metadata (pinned items, cooldowns)
]);

/**
 * Determine if a key should be stored in sync or local storage
 */
function getStorageType(key) {
  if (SYNC_STORAGE_KEYS.has(key)) {
    return 'sync';
  } else if (LOCAL_STORAGE_KEYS.has(key)) {
    return 'local';
  } else {
    // Default to local storage for unknown keys to avoid sync limits
    console.warn(`[Triage Hub] Unknown storage key: ${key}, defaulting to local storage`);
    return 'local';
  }
}

/**
 * Load application state for a given key
 * Automatically routes to appropriate storage and handles decryption if needed
 */
async function loadAppState(key) {
  try {
    // Check if Chrome storage is available
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.warn(`[Triage Hub] Chrome storage not available for key: ${key}`);
      return null;
    }
    
    const storageType = getStorageType(key);
    const storage = storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;
    
    const result = await storage.get([key]);
    const data = result[key];
    
    if (!data) {
      return null; // No data found
    }
    
    // Encryption is only applied to sensitive data in sync storage
    if (storageType === 'sync' && key !== 'triageHub_encryptionKey') {
      try {
        // Decrypt the data
        const decryptedJson = await decryptString(data);
        return JSON.parse(decryptedJson);
      } catch (error) {
        console.error(`[Triage Hub] Error decrypting ${key}:`, error);
        return null;
      }
    } else {
      // Local storage data is not encrypted (performance + size reasons)
      return data;
    }
  } catch (error) {
    console.error(`[Triage Hub] Error loading state for ${key}:`, error);
    return null;
  }
}

/**
 * Save application state for a given key
 * Automatically routes to appropriate storage and handles encryption if needed
 */
async function saveAppState(key, data) {
  try {
    // Check if Chrome storage is available
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.warn(`[Triage Hub] Chrome storage not available for saving key: ${key}`);
      return false;
    }
    
    const storageType = getStorageType(key);
    const storage = storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;
    
    let dataToStore = data;
    
    // Encryption is only applied to sensitive data in sync storage
    if (storageType === 'sync' && key !== 'triageHub_encryptionKey') {
      try {
        // Encrypt the data
        const jsonString = JSON.stringify(data);
        dataToStore = await encryptString(jsonString);
      } catch (error) {
        console.error(`[Triage Hub] Error encrypting ${key}:`, error);
        throw error;
      }
    }
    
    await storage.set({ [key]: dataToStore });
    console.log(`[Tab Napper] Saved ${key} to ${storageType} storage`);
    
    // Notify reactive storage listeners of the change
    notifyStorageChange(key, data);
  } catch (error) {
    console.error(`[Tab Napper] Error saving state for ${key}:`, error);
    throw error;
  }
}

/**
 * Initialize the bulk data structure in local storage
 */
async function initializeBulkData() {
  const bulkDataKeys = [
    'triageHub_inbox',
    'triageHub_stashedTabs', 
    'triageHub_trash'
  ];
  
  for (const key of bulkDataKeys) {
    const existingData = await loadAppState(key);
    if (existingData === null) {
      // Initialize with empty array
      await saveAppState(key, []);
      console.log(`[Triage Hub] Initialized ${key} with empty array`);
    }
  }
}

/**
 * Load all application data into a single state object
 */
async function loadAllAppData() {
  // Initialize bulk data if needed
  await initializeBulkData();
  
  // Load all data
  const [
    quickAccessCards,
    userPreferences,
    inbox,
    stashedTabs,
    trash
  ] = await Promise.all([
    loadAppState('triageHub_quickAccessCards'),
    loadAppState('triageHub_userPreferences'),
    loadAppState('triageHub_inbox'),
    loadAppState('triageHub_stashedTabs'),
    loadAppState('triageHub_trash')
  ]);
  
  return {
    // Sync storage data (small, critical)
    quickAccessCards: quickAccessCards || [],
    userPreferences: userPreferences || {
      theme: 'light',
      analogFidgetSensitivity: 'medium'
    },
    
    // Local storage data (bulk)
    inbox: inbox || [],
    stashedTabs: stashedTabs || [],
    trash: trash || []
  };
}

export {
  loadAppState,
  saveAppState,
  initializeBulkData,
  loadAllAppData,
  getStorageType
};