/**
 * Centralized Storage Keys
 * 
 * This file defines all Chrome storage keys used in Tab Napper.
 * Centralizing them here makes renaming/refactoring easier and prevents typos.
 */

export const STORAGE_KEYS = {
  // Core data collections
  INBOX: 'triageHub_inbox',
  SCHEDULED: 'triageHub_scheduled',
  TRASH: 'triageHub_trash',
  COMPLETED: 'triageHub_completed',
  
  // Legacy keys (for migration)
  LEGACY_STASHED: 'triageHub_stashedTabs',
  
  // App state
  CURRENT_NOTE_ID: 'triageHub_currentNoteId',
  ENCRYPTION_KEY: 'encryptionKey',
  
  // Settings
  AUTO_CLEANUP_ENABLED: 'autoCleanup_enabled',
  AUTO_CLEANUP_DAYS: 'autoCleanup_trashDays',
  
  // Quick access
  QUICK_ACCESS_CARDS: 'triageHub_quickAccessCards',
};

/**
 * Migration: Check if old storage key exists and migrate to new key
 */
export async function migrateStorageKey(oldKey, newKey) {
  const result = await chrome.storage.local.get([oldKey, newKey]);
  
  // If new key already has data, don't migrate
  if (result[newKey] && result[newKey].length > 0) {
    console.log(`[Migration] ${newKey} already has data, skipping migration`);
    return;
  }
  
  // If old key has data, migrate it
  if (result[oldKey] && result[oldKey].length > 0) {
    console.log(`[Migration] Migrating ${result[oldKey].length} items from ${oldKey} to ${newKey}`);
    await chrome.storage.local.set({ [newKey]: result[oldKey] });
    // Don't remove old key yet - keep for safety
    console.log(`[Migration] ✓ Migration complete`);
  }
}

/**
 * Run all storage migrations
 */
export async function runStorageMigrations() {
  console.log('[Migration] Running storage migrations...');
  
  // Migrate stashedTabs → scheduled
  await migrateStorageKey(STORAGE_KEYS.LEGACY_STASHED, STORAGE_KEYS.SCHEDULED);
  
  console.log('[Migration] ✓ All migrations complete');
}
