/**
 * Auto-pin utility
 * Pins Tab Napper only once - uses storage to track if pinned
 */

import { loadAppState, saveAppState } from './storage.js';

/**
 * Pin the current tab if not already pinned (tracked via storage)
 * @returns {Promise<boolean>} True if pinned, false if already pinned or failed
 */
export async function autoPinCurrentTab() {
  try {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      console.log('[AutoPin] Chrome tabs API not available');
      return false;
    }

    // Check storage flag first (fast, synchronous check)
    const hasPinnedTab = await loadAppState('tabNapper_hasPinnedTab', false);
    
    if (hasPinnedTab) {
      console.log('[AutoPin] Already have a pinned Tab Napper (from storage flag)');
      return false;
    }

    // Get current tab
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!currentTab) {
      console.log('[AutoPin] Could not find current tab');
      return false;
    }

    // Check if this tab is already pinned
    if (currentTab.pinned) {
      console.log('[AutoPin] This tab already pinned');
      await saveAppState('tabNapper_hasPinnedTab', true);
      return false;
    }

    // Pin this tab and set storage flag
    await chrome.tabs.update(currentTab.id, { pinned: true });
    await saveAppState('tabNapper_hasPinnedTab', true);
    
    console.log('[AutoPin] ✅ Tab pinned successfully and flag set');
    return true;
    
  } catch (error) {
    console.error('[AutoPin] Error pinning tab:', error);
    return false;
  }
}

/**
 * Check if current tab is pinned
 * @returns {Promise<boolean>}
 */
export async function isCurrentTabPinned() {
  try {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      return false;
    }

    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return currentTab?.pinned || false;
  } catch (error) {
    console.error('[AutoPin] Error checking pin status:', error);
    return false;
  }
}

/**
 * Check if any Tab Napper tab is pinned
 * @returns {Promise<boolean>}
 */
export async function isAnyTabNapperPinned() {
  try {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      return false;
    }

    const allTabs = await chrome.tabs.query({});
    const pinnedTabNapper = allTabs.find(tab => 
      tab.pinned && tab.url && tab.url.includes('triage_hub.html')
    );
    
    return !!pinnedTabNapper;
  } catch (error) {
    console.error('[AutoPin] Error checking if any Tab Napper is pinned:', error);
    return false;
  }
}

/**
 * Reset the pinned flag (for debugging or if user unpins manually)
 */
export async function resetPinnedFlag() {
  await saveAppState('tabNapper_hasPinnedTab', false);
  console.log('[AutoPin] Reset pinned flag');
}
