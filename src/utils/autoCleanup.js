/**
 * Auto-cleanup utility for Inbox and Trash
 * - Moves inbox items older than 1 week to trash
 * - Permanently deletes trash items older than 1 month
 */

import { loadAppState, saveAppState } from './storage.js';

// Time constants
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Run auto-cleanup on inbox and trash
 * @returns {Promise<Object>} Cleanup statistics
 */
export async function runAutoCleanup() {
  console.log('[AutoCleanup] Starting automatic cleanup...');
  
  const now = Date.now();
  let stats = {
    inboxMovedToTrash: 0,
    trashDeleted: 0
  };

  try {
    // Step 1: Clean up inbox (move old items to trash)
    const inbox = await loadAppState('triageHub_inbox') || [];
    
    const inboxToKeep = [];
    const inboxToTrash = [];
    
    inbox.forEach(item => {
      // Items without timestamps are treated as very old (age = now)
      const itemAge = now - (item.timestamp || item.lastAccessed || 0);
      
      if (itemAge > ONE_WEEK_MS) {
        // Item is older than 1 week, move to trash
        inboxToTrash.push({
          ...item,
          trashedAt: now,
          trashedReason: 'auto-cleanup-inbox-aged'
        });
      } else {
        // Keep in inbox
        inboxToKeep.push(item);
      }
    });
    
    // Save cleaned inbox
    if (inboxToTrash.length > 0) {
      await saveAppState('triageHub_inbox', inboxToKeep);
      
      // Add to trash
      const currentTrash = await loadAppState('triageHub_trash') || [];
      await saveAppState('triageHub_trash', [...currentTrash, ...inboxToTrash]);
      
      stats.inboxMovedToTrash = inboxToTrash.length;
      console.log(`[AutoCleanup] Moved ${inboxToTrash.length} items from inbox to trash`);
    }
    
    // Step 2: Clean up trash (permanently delete old items)
    const trash = await loadAppState('triageHub_trash') || [];
    
    const trashToKeep = [];
    const trashToDelete = [];
    
    trash.forEach(item => {
      const trashedTime = item.trashedAt || item.timestamp || 0;
      const trashAge = now - trashedTime;
      
      if (trashAge > ONE_MONTH_MS) {
        // Item has been in trash for over 1 month, delete permanently
        trashToDelete.push(item);
      } else {
        // Keep in trash
        trashToKeep.push(item);
      }
    });
    
    // Save cleaned trash
    if (trashToDelete.length > 0) {
      await saveAppState('triageHub_trash', trashToKeep);
      
      stats.trashDeleted = trashToDelete.length;
      console.log(`[AutoCleanup] Permanently deleted ${trashToDelete.length} items from trash`);
    }
    
    console.log('[AutoCleanup] Cleanup complete:', stats);
    return stats;
    
  } catch (error) {
    console.error('[AutoCleanup] Error during cleanup:', error);
    throw error;
  }
}

/**
 * Check if an item should be auto-cleaned from inbox
 * @param {Object} item - The item to check
 * @returns {boolean}
 */
export function shouldCleanFromInbox(item) {
  const now = Date.now();
  // Items without timestamps are treated as very old (age = now)
  const itemAge = now - (item.timestamp || item.lastAccessed || 0);
  return itemAge > ONE_WEEK_MS;
}

/**
 * Check if an item should be permanently deleted from trash
 * @param {Object} item - The item to check
 * @returns {boolean}
 */
export function shouldDeleteFromTrash(item) {
  const now = Date.now();
  const trashedTime = item.trashedAt || item.timestamp || 0;
  const trashAge = now - trashedTime;
  return trashAge > ONE_MONTH_MS;
}

/**
 * Get cleanup statistics without performing cleanup
 * @returns {Promise<Object>} Preview of what would be cleaned
 */
export async function getCleanupPreview() {
  const inbox = await loadAppState('triageHub_inbox') || [];
  const trash = await loadAppState('triageHub_trash') || [];
  
  const inboxOldCount = inbox.filter(item => shouldCleanFromInbox(item)).length;
  const trashOldCount = trash.filter(item => shouldDeleteFromTrash(item)).length;
  
  return {
    inboxItemsToMove: inboxOldCount,
    trashItemsToDelete: trashOldCount,
    totalActions: inboxOldCount + trashOldCount
  };
}
