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
import { STORAGE_KEYS } from './storageKeys.js';

// Storage key mapping - determines which keys go to sync vs local storage
const SYNC_STORAGE_KEYS = new Set([
  'triageHub_encryptionKey',     // E2EE key
  STORAGE_KEYS.QUICK_ACCESS_CARDS,  // Quick Access Cards (small, critical)
  'triageHub_userPreferences',   // User settings
]);

const LOCAL_STORAGE_KEYS = new Set([
  STORAGE_KEYS.INBOX,              // Inbox (bulk data)
  STORAGE_KEYS.SCHEDULED,          // Scheduled items (bulk data)
  STORAGE_KEYS.ARCHIVE,            // Archive (bulk data)
  STORAGE_KEYS.LEGACY_STASHED,     // Legacy key (for migration)
  STORAGE_KEYS.TRASH,              // Trash (bulk data)
  STORAGE_KEYS.COMPLETED,          // Completed items (bulk data)
  'triageHub_notes',               // Notes (bulk data)
  'tabNapper_lastCleanup',         // Last auto-cleanup timestamp (performance optimization)
  'tabNapper_hasPinnedTab',        // Auto-pin flag (prevents duplicate pinning)
  'tabNapper_pinnedTabId',         // ID of pinned Tab Napper tab
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
    STORAGE_KEYS.INBOX,
    STORAGE_KEYS.SCHEDULED,
    STORAGE_KEYS.ARCHIVE,
    STORAGE_KEYS.TRASH,
    STORAGE_KEYS.COMPLETED,
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
  // Run migrations first
  const { runStorageMigrations } = await import('./storageKeys.js');
  await runStorageMigrations();
  
  // Initialize bulk data if needed
  await initializeBulkData();
  
  // Load all data using centralized keys
  const [
    quickAccessCards,
    userPreferences,
    inbox,
    scheduled,
    archive,
    trash,
    completed
  ] = await Promise.all([
    loadAppState(STORAGE_KEYS.QUICK_ACCESS_CARDS),
    loadAppState('triageHub_userPreferences'),
    loadAppState(STORAGE_KEYS.INBOX),
    loadAppState(STORAGE_KEYS.SCHEDULED),
    loadAppState(STORAGE_KEYS.ARCHIVE),
    loadAppState(STORAGE_KEYS.TRASH),
    loadAppState(STORAGE_KEYS.COMPLETED)
  ]);
  
  // Deduplicate arrays
  const originalInboxLength = Array.isArray(inbox) ? inbox.length : undefined;
  const originalScheduledLength = Array.isArray(scheduled) ? scheduled.length : undefined;
  const originalArchiveLength = Array.isArray(archive) ? archive.length : undefined;
  const originalTrashLength = Array.isArray(trash) ? trash.length : undefined;
  const deduplicatedInbox = deduplicateById(inbox || []);
  const deduplicatedScheduled = deduplicateById(scheduled || []);
  const deduplicatedArchive = deduplicateById(archive || []);
  const deduplicatedTrash = deduplicateById(trash || []);
  
  // If we removed duplicates, save the cleaned data back to storage
  if (deduplicatedInbox.length !== originalInboxLength) {
    console.log('[Storage] Deduplicating inbox:', originalInboxLength, '→', deduplicatedInbox.length);
    await saveAppState(STORAGE_KEYS.INBOX, deduplicatedInbox);
  }
  if (deduplicatedScheduled.length !== originalScheduledLength) {
    console.log('[Storage] Deduplicating scheduled:', originalScheduledLength, '→', deduplicatedScheduled.length);
    await saveAppState(STORAGE_KEYS.SCHEDULED, deduplicatedScheduled);
  }
  if (deduplicatedArchive.length !== originalArchiveLength) {
    console.log('[Storage] Deduplicating archive:', originalArchiveLength, '→', deduplicatedArchive.length);
    await saveAppState(STORAGE_KEYS.ARCHIVE, deduplicatedArchive);
  }
  if (deduplicatedTrash.length !== originalTrashLength) {
    console.log('[Storage] Deduplicating trash:', originalTrashLength, '→', deduplicatedTrash.length);
    await saveAppState(STORAGE_KEYS.TRASH, deduplicatedTrash);
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
    scheduled: deduplicatedScheduled,
    archive: deduplicatedArchive,
    trash: deduplicatedTrash,
    completed: completed || []
  };
}

/**
 * Move an item to Archive (mark as done/completed)
 * @param {Object} item - The item to archive
 * @param {string} sourceList - Where the item came from ('inbox' or 'scheduled')
 * @returns {Promise<Object>} The archived item with metadata
 */
async function moveToArchive(item, sourceList = 'scheduled') {
  if (!item || !item.id) {
    throw new Error('Invalid item: missing ID');
  }
  
  if (!['inbox', 'scheduled'].includes(sourceList)) {
    throw new Error(`Invalid sourceList: ${sourceList}. Must be 'inbox' or 'scheduled'`);
  }

  console.log(`[Storage] Moving item to archive: ${item.title || item.id} from ${sourceList}`);

  // Create archived item with metadata
  const archivedItem = {
    ...item,
    archivedAt: Date.now(),
    archivedFrom: sourceList,
    completedAt: Date.now(),
    originalTimestamp: item.timestamp || item.capturedAt || Date.now()
  };

  // Get current data
  const sourceKey = sourceList === 'inbox' ? STORAGE_KEYS.INBOX : STORAGE_KEYS.SCHEDULED;
  const [sourceData, archiveData] = await Promise.all([
    loadAppState(sourceKey),
    loadAppState(STORAGE_KEYS.ARCHIVE)
  ]);

  // Remove from source list
  const updatedSource = (sourceData || []).filter(i => i.id !== item.id);
  
  // Add to archive
  const updatedArchive = [archivedItem, ...(archiveData || [])];

  // Save both lists
  await Promise.all([
    saveAppState(sourceKey, updatedSource),
    saveAppState(STORAGE_KEYS.ARCHIVE, updatedArchive)
  ]);

  console.log(`[Storage] ✓ Item archived successfully`);
  
  // Notify reactive store
  notifyStorageChange(sourceKey);
  notifyStorageChange(STORAGE_KEYS.ARCHIVE);

  return archivedItem;
}

/**
 * Unarchive an item back to Inbox or Scheduled
 * @param {Object} item - The archived item to restore
 * @param {string} destination - Where to restore ('inbox' or 'scheduled')
 * @returns {Promise<Object>} The restored item with metadata removed
 */
async function unarchiveItem(item, destination = 'inbox') {
  if (!item || !item.id) {
    throw new Error('Invalid item: missing ID');
  }

  console.log(`[Storage] Unarchiving item: ${item.title || item.id} to ${destination}`);

  // Create restored item (remove archive metadata)
  const { archivedAt, archivedFrom, completedAt, ...restoredItem } = item;

  // Get current data
  const destKey = destination === 'inbox' ? STORAGE_KEYS.INBOX : STORAGE_KEYS.SCHEDULED;
  const [archiveData, destData] = await Promise.all([
    loadAppState(STORAGE_KEYS.ARCHIVE),
    loadAppState(destKey)
  ]);

  // Remove from archive
  const updatedArchive = (archiveData || []).filter(i => i.id !== item.id);
  
  // Add to destination
  const updatedDest = [restoredItem, ...(destData || [])];

  // Save both lists
  await Promise.all([
    saveAppState(STORAGE_KEYS.ARCHIVE, updatedArchive),
    saveAppState(destKey, updatedDest)
  ]);

  console.log(`[Storage] ✓ Item unarchived successfully`);
  
  // Notify reactive store
  notifyStorageChange(STORAGE_KEYS.ARCHIVE);
  notifyStorageChange(destKey);

  return restoredItem;
}

export {
  loadAppState,
  saveAppState,
  initializeBulkData,
  loadAllAppData,
  moveToArchive,
  unarchiveItem,
  STORAGE_KEYS
};