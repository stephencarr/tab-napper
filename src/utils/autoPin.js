/**
 * Auto-pin utility
 * Pins Tab Napper only once - checks if ANY Tab Napper tab is already pinned
 */

/**
 * Pin the current tab if no other Tab Napper tab is already pinned
 * @returns {Promise<boolean>} True if pinned, false if already pinned elsewhere or failed
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

    // Check if this tab is already pinned
    if (currentTab.pinned) {
      console.log('[AutoPin] This tab already pinned');
      return false;
    }

    // Check if ANY Tab Napper tab is already pinned
    const allTabs = await chrome.tabs.query({});
    const tabNapperUrl = chrome.runtime.getURL('triage_hub.html');
    
    const pinnedTabNapper = allTabs.find(tab => 
      tab.pinned && tab.url && tab.url.includes('triage_hub.html')
    );
    
    if (pinnedTabNapper) {
      console.log('[AutoPin] Tab Napper already pinned in tab', pinnedTabNapper.id);
      return false;
    }

    // Pin this tab since no other Tab Napper is pinned
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
