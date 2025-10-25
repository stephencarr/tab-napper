/**
 * Storage utilities for Tab Napper
 * Implements hybrid storage model: sync for critical data, local for bulk data
 *
 * IMPORTANT: Storage Key Naming Convention
 * =========================================
 * All storage keys use the "triageHub_" prefix for historical reasons.
 * This naming is PRESERVED for backward compatibility - changing these keys
 * would break existing user data. The app is now called "Tab Napper" but
 * internal storage keys remain as "triageHub_*".
 *
 * DO NOT CHANGE storage key names without implementing a data migration!
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
    console.warn(`[Tab Napper] Unknown storage key: ${key}, defaulting to local storage`);
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
      console.warn(`[Tab Napper] Chrome storage not available for key: ${key}`);
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
        console.error(`[Tab Napper] Error decrypting ${key}:`, error);
        return null;
      }
    } else {
      // Local storage data is not encrypted (performance + size reasons)
      return data;
    }
  } catch (error) {
    console.error(`[Tab Napper] Error loading state for ${key}:`, error);
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
      console.warn(`[Tab Napper] Chrome storage not available for saving key: ${key}`);
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
        console.error(`[Tab Napper] Error encrypting ${key}:`, error);
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
    'triageHub_trash',
    'triageHub_notes'
  ];
  
  for (const key of bulkDataKeys) {
    const existingData = await loadAppState(key);
    if (existingData === null) {
      // Initialize with empty array
      await saveAppState(key, []);
      console.log(`[Tab Napper] Initialized ${key} with empty array`);
    }
  }
}

/**
 * Deduplicate array by ID
 * Keeps the first occurrence of each unique ID
 */
function deduplicateById(items) {
  if (!Array.isArray(items)) return items;
  
  const seen = new Set();
  const duplicates = [];
  const result = items.filter(item => {
    if (!item || !item.id) return true; // Keep items without IDs
    if (seen.has(item.id)) {
      duplicates.push({ id: item.id, title: item.title });
      return false;
    }
    seen.add(item.id);
    return true;
  });
  
  if (duplicates.length > 0) {
    console.warn('[Storage] Removed duplicates:', duplicates);
  }
  
  return result;
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
  
  // Deduplicate arrays (especially trash which can accumulate duplicates)
  const deduplicatedInbox = deduplicateById(inbox || []);
  const deduplicatedStashed = deduplicateById(stashedTabs || []);
  const deduplicatedTrash = deduplicateById(trash || []);
  
  // If we removed duplicates, save the cleaned data back to storage
  if (deduplicatedInbox.length !== (inbox || []).length) {
    console.log('[Storage] Deduplicating inbox:', (inbox || []).length, '→', deduplicatedInbox.length);
    await saveAppState('triageHub_inbox', deduplicatedInbox);
  }
  if (deduplicatedStashed.length !== (stashedTabs || []).length) {
    console.log('[Storage] Deduplicating stashed:', (stashedTabs || []).length, '→', deduplicatedStashed.length);
    await saveAppState('triageHub_stashedTabs', deduplicatedStashed);
  }
  if (deduplicatedTrash.length !== (trash || []).length) {
    console.log('[Storage] Deduplicating trash:', (trash || []).length, '→', deduplicatedTrash.length);
    await saveAppState('triageHub_trash', deduplicatedTrash);
  }
  
  return {
    // Sync storage data (small, critical)
    quickAccessCards: quickAccessCards || [],
    userPreferences: userPreferences || {
      theme: 'light',
      analogFidgetSensitivity: 'medium'
    },
    
    // Local storage data (bulk, now deduplicated)
    inbox: deduplicatedInbox,
    stashedTabs: deduplicatedStashed,
    trash: deduplicatedTrash
  };
}

export {
  loadAppState,
  saveAppState,
  initializeBulkData,
  loadAllAppData,
  getStorageType
};