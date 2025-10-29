/**
 * Auto-cleanup utility for Inbox and Trash
 * - Moves inbox items older than 1 week to trash
 * - Permanently deletes trash items older than 1 month
 */

import { loadAppState, saveAppState } from './storage.js';

// Time constants
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Check if cleanup should run (throttle to once per hour)
 * @returns {Promise<boolean>}
 */
async function shouldRunCleanup() {
  const lastCleanup = await loadAppState('tabNapper_lastCleanup') || 0;
  const now = Date.now();
  return (now - lastCleanup) > ONE_HOUR_MS;
}

/**
 * Record that cleanup was run
 */
async function recordCleanupRun() {
  await saveAppState('tabNapper_lastCleanup', Date.now());
}

/**
 * Run auto-cleanup on inbox and trash (throttled to once per hour)
 * @param {boolean} force - Force cleanup even if throttled
 * @returns {Promise<Object>} Cleanup statistics
 */
export async function runAutoCleanup(force = false) {
  // Throttle: only run once per hour unless forced
  if (!force && !(await shouldRunCleanup())) {
    console.log('[AutoCleanup] Skipping - last run was less than 1 hour ago');
    return { inboxMovedToTrash: 0, trashDeleted: 0, skipped: true };
  }
  
  console.log('[AutoCleanup] Starting automatic cleanup...');
  const now = Date.now();

  try {
    // Load all data upfront in parallel
    const [inboxData, trashData] = await Promise.all([
      loadAppState('triageHub_inbox'),
      loadAppState('triageHub_trash')
    ]);
    
    // Apply fallbacks after promise resolution
    const inbox = inboxData || [];
    const trash = trashData || [];

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

      // CRITICAL: Save trash FIRST to prevent data loss
      // If trash save succeeds but inbox save fails:
      //   → Items are duplicated (inbox + trash) = SAFE, no data loss
      // If trash save fails:
      //   → Nothing happens, inbox unchanged = SAFE
      // 
      // DO NOT save inbox first! If inbox succeeds but trash fails:
      //   → Items removed from inbox, never added to trash = DATA LOSS!
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

    // Record successful cleanup run
    await recordCleanupRun();

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
  const itemTimestamp = item.timestamp || item.lastAccessed || 0;
  
  // Log warning if item has no timestamp (likely corrupted data)
  if (itemTimestamp === 0) {
    console.warn('[AutoCleanup] Item without timestamp will be cleaned:', {
      title: item.title,
      url: item.url,
      id: item.id
    });
  }
  
  const itemAge = now - itemTimestamp;
  return itemAge > ONE_WEEK_MS;
}

/**
 * Check if an item should be permanently deleted from trash
 * @param {Object} item - The item to check
 * @param {number} [now=Date.now()] - The current timestamp to compare against
 * @returns {boolean}
 */
export function shouldDeleteFromTrash(item, now = Date.now()) {
  // Check trashedAt (auto-cleanup), deletedAt (manual delete), or timestamp (fallback)
  const trashedTime = item.trashedAt || item.deletedAt || item.timestamp || 0;
  const trashAge = now - trashedTime;
  return trashAge > ONE_MONTH_MS;
}

/**
 * Get cleanup statistics without performing cleanup
 * @returns {Promise<Object>} Preview of what would be cleaned
 */
export async function getCleanupPreview() {
  const now = Date.now();
  const inbox = (await loadAppState('triageHub_inbox')) || [];
  const trash = (await loadAppState('triageHub_trash')) || [];
  
  const inboxOldCount = inbox.filter(item => shouldCleanFromInbox(item, now)).length;
  const trashOldCount = trash.filter(item => shouldDeleteFromTrash(item, now)).length;
  
  return {
    inboxItemsToMove: inboxOldCount,
    trashItemsToDelete: trashOldCount,
    totalActions: inboxOldCount + trashOldCount
  };
}
