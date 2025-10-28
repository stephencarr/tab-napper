/**
 * Bookmark Utility
 * Simple functions to add/remove items from Quick Access
 */

import { loadAppState, saveAppState } from './storage.js';

/**
 * Add item to Quick Access (bookmark it)
 * @param {Object} item - Item to bookmark (tab, history entry, etc.)
 * @returns {Promise<void>}
 */
export async function bookmarkItem(item) {
  try {
    console.log('[Bookmarks] Adding bookmark:', item.title || item.url);
    
    const quickAccessCards = await loadAppState('triageHub_quickAccessCards') || [];
    
    // Check if already bookmarked
    const alreadyBookmarked = quickAccessCards.some(card => card.url === item.url);
    if (alreadyBookmarked) {
      console.log('[Bookmarks] Item already bookmarked');
      return;
    }
    
    // Create bookmark card
    const bookmark = {
      id: item.id || `bookmark-${crypto.randomUUID()}`,
      title: item.title || new URL(item.url).hostname,
      url: item.url,
      favicon: item.favicon || item.favIconUrl || `https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}&sz=32`,
      timestamp: item.timestamp || Date.now(),
      type: 'bookmark',
      source: 'user-bookmark'
    };
    
    // Add to quick access
    await saveAppState('triageHub_quickAccessCards', [bookmark, ...quickAccessCards]);
    
    console.log('[Bookmarks] ✅ Bookmark added');
  } catch (error) {
    console.error('[Bookmarks] Error adding bookmark:', error);
    throw error;
  }
}

/**
 * Remove item from Quick Access (unbookmark it)
 * @param {string} url - URL of item to remove
 * @returns {Promise<void>}
 */
export async function unbookmarkItem(url) {
  try {
    console.log('[Bookmarks] Removing bookmark:', url);
    
    const quickAccessCards = await loadAppState('triageHub_quickAccessCards') || [];
    const updated = quickAccessCards.filter(card => card.url !== url);
    
    await saveAppState('triageHub_quickAccessCards', updated);
    
    console.log('[Bookmarks] ✅ Bookmark removed');
  } catch (error) {
    console.error('[Bookmarks] Error removing bookmark:', error);
    throw error;
  }
}

/**
 * Check if item is bookmarked
 * @param {string} url - URL to check
 * @returns {Promise<boolean>}
 */
export async function isBookmarked(url) {
  try {
    const quickAccessCards = await loadAppState('triageHub_quickAccessCards') || [];
    return quickAccessCards.some(card => card.url === url);
  } catch (error) {
    console.error('[Bookmarks] Error checking bookmark:', error);
    return false;
  }
}

/**
 * Get all bookmarks
 * @returns {Promise<Array>}
 */
export async function getAllBookmarks() {
  try {
    const quickAccessCards = await loadAppState('triageHub_quickAccessCards') || [];
    return quickAccessCards.filter(card => card.type === 'bookmark' || card.source === 'user-bookmark');
  } catch (error) {
    console.error('[Bookmarks] Error getting bookmarks:', error);
    return [];
  }
}
