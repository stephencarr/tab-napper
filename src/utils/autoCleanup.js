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

  try {
    // Load all data upfront
    const [inbox, trash] = await Promise.all([
      loadAppState('triageHub_inbox') || [],
      loadAppState('triageHub_trash') || []
    ]);

    // Partition inbox into items to keep and items to move to trash
    const { inboxToKeep, inboxToTrash } = inbox.reduce(
      (acc, item) => {
        if (shouldCleanFromInbox(item, now)) {
          acc.inboxToTrash.push({
            ...item,
            trashedAt: now,
            trashedReason: 'auto-cleanup-inbox-aged'
          });
        } else {
          acc.inboxToKeep.push(item);
        }
        return acc;
      },
      { inboxToKeep: [], inboxToTrash: [] }
    );

    // Filter trash to find items to keep
    const trashToKeep = trash.filter(item => !shouldDeleteFromTrash(item, now));

    const inboxMovedCount = inboxToTrash.length;
    const trashDeletedCount = trash.length - trashToKeep.length;

    // Only perform writes if there are changes
    if (inboxMovedCount > 0 || trashDeletedCount > 0) {
      const newTrash = [...trashToKeep, ...inboxToTrash];

      // IMPORTANT: Save trash first. If this succeeds and inbox save fails,
      // items are duplicated but not lost.
      await saveAppState('triageHub_trash', newTrash);
      
      if (inboxMovedCount > 0) {
        await saveAppState('triageHub_inbox', inboxToKeep);
        console.log(`[AutoCleanup] Moved ${inboxMovedCount} items from inbox to trash`);
      }
      
      if (trashDeletedCount > 0) {
        console.log(`[AutoCleanup] Permanently deleted ${trashDeletedCount} items from trash`);
      }
    }

    const stats = {
      inboxMovedToTrash: inboxMovedCount,
      trashDeleted: trashDeletedCount
    };

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
 * @param {number} [now=Date.now()] - The current timestamp to compare against
 * @returns {boolean}
 */
export function shouldCleanFromInbox(item, now = Date.now()) {
  // Items without timestamps are treated as very old (age = now)
  const itemAge = now - (item.timestamp || item.lastAccessed || 0);
  return itemAge > ONE_WEEK_MS;
}

/**
 * Check if an item should be permanently deleted from trash
 * @param {Object} item - The item to check
 * @param {number} [now=Date.now()] - The current timestamp to compare against
 * @returns {boolean}
 */
export function shouldDeleteFromTrash(item, now = Date.now()) {
  const trashedTime = item.trashedAt || item.timestamp || 0;
  const trashAge = now - trashedTime;
  return trashAge > ONE_MONTH_MS;
}

/**
 * Get cleanup statistics without performing cleanup
 * @returns {Promise<Object>} Preview of what would be cleaned
 */
export async function getCleanupPreview() {
  const now = Date.now();
  const inbox = await loadAppState('triageHub_inbox') || [];
  const trash = await loadAppState('triageHub_trash') || [];
  
  const inboxOldCount = inbox.filter(item => shouldCleanFromInbox(item, now)).length;
  const trashOldCount = trash.filter(item => shouldDeleteFromTrash(item, now)).length;
  
  return {
    inboxItemsToMove: inboxOldCount,
    trashItemsToDelete: trashOldCount,
    totalActions: inboxOldCount + trashOldCount
  };
}
