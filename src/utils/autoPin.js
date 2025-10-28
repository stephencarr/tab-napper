/**
 * Auto-pin utility
 * Automatically pins the Tab Napper tab when the app loads
 */

/**
 * Pin the current tab if it's not already pinned
 * @returns {Promise<boolean>} True if pinned, false if already pinned or failed
 */
export async function autoPinCurrentTab() {
  try {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      console.log('[AutoPin] Chrome tabs API not available');
      return false;
    }

    // Get current tab
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!currentTab) {
      console.log('[AutoPin] Could not find current tab');
      return false;
    }

    // Check if already pinned
    if (currentTab.pinned) {
      console.log('[AutoPin] Tab already pinned');
      return false;
    }

    // Pin the tab
    await chrome.tabs.update(currentTab.id, { pinned: true });
    console.log('[AutoPin] ✅ Tab pinned successfully');
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
