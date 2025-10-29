/**
 * Tab navigation utilities for Tab Napper
 * Handles opening, switching, and managing browser tabs
 */

/**
 * Switch to an existing tab or open a new one
 * First checks if the URL is already open, switches to it if found
 * Otherwise creates a new tab
 */
async function navigateToUrl(url, title = null) {
  try {
    console.log(`[Tab Napper] 🚀 Navigating to: ${url}`);
    
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      // First, try to find if the tab is already open
      const existingTab = await findOpenTab(url);
      
      if (existingTab) {
        console.log(`[Tab Napper] 🔄 Switching to existing tab: ${existingTab.id}`);
        
        // Switch to the existing tab
        await chrome.tabs.update(existingTab.id, { active: true });
        
        // Bring the window to front if needed
        await chrome.windows.update(existingTab.windowId, { focused: true });
        
        return { action: 'switched', tabId: existingTab.id };
      } else {
        console.log(`[Tab Napper] 🆕 Opening new tab`);
        
        // Create a new tab
        const newTab = await chrome.tabs.create({
          url: url,
          active: true
        });
        
        return { action: 'created', tabId: newTab.id };
      }
    } else {
      console.log('[Tab Napper] Chrome tabs API not available, opening in new window');
      window.open(url, '_blank');
      return { action: 'external', tabId: null };
    }
  } catch (error) {
    console.error('[Tab Napper] Error navigating to URL:', error);
    // Fallback to window.open
    window.open(url, '_blank');
    return { action: 'fallback', tabId: null };
  }
}

/**
 * Find if a URL is currently open in any tab
 */
async function findOpenTab(targetUrl) {
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const tabs = await new Promise((resolve, reject) => {
        chrome.tabs.query({}, (tabs) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(tabs);
          }
        });
      });
      
      const normalizedTarget = normalizeUrl(targetUrl);
      
      return tabs.find(tab => normalizeUrl(tab.url) === normalizedTarget);
    }
    return null;
  } catch (error) {
    console.error('[Tab Napper] Error finding open tab:', error);
    return null;
  }
}

/**
 * Normalize URL for comparison
 */
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    // Remove fragments and some query params for comparison
    urlObj.hash = '';
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Open a note editor tab at chrome-extension://<id>/note.html?id=<noteId>
 * Reuses navigateToUrl for tab reuse behavior.
 */
async function openNoteEditor(noteId) {
  try {
    const base = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL
      ? chrome.runtime.getURL('note.html')
      : `${window.location.origin}/note.html`;
    const url = `${base}?id=${encodeURIComponent(noteId)}`;
    return await navigateToUrl(url);
  } catch (err) {
    console.error('[Tab Napper] Error opening note editor:', err);
    return await navigateToUrl(`note.html?id=${encodeURIComponent(noteId)}`);
  }
}

/**
 * Close a tab by ID
 */
async function closeTab(tabId) {
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      await chrome.tabs.remove(tabId);
      console.log(`[Tab Napper] Closed tab: ${tabId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Tab Napper] Error closing tab:', error);
    return false;
  }
}

/**
 * Close all open tabs that match the provided items
 * Phase 2: Bulk action for managing open tabs
 * Excludes pinned tabs for safety
 * @param {Array} items - Array of items with URLs to close
 * @returns {Promise<Object>} - { closed: number, failed: number, skipped: number, errors: Array }
 */
async function closeOpenTabs(items) {
  const results = { closed: 0, failed: 0, skipped: 0, errors: [] };
  
  if (!items || items.length === 0) {
    return results;
  }
  
  console.log(`[Tab Napper] 🗑️ Closing ${items.length} open tabs (excluding pinned)...`);
  
  for (const item of items) {
    if (!item.url) {
      continue;
    }
    
    try {
      const tab = await findOpenTab(item.url);
      if (tab) {
        // Skip pinned tabs
        if (tab.pinned) {
          results.skipped++;
          console.log(`[Tab Napper] ⏭️ Skipped pinned tab: ${item.title}`);
          continue;
        }
        
        const success = await closeTab(tab.id);
        if (success) {
          results.closed++;
          console.log(`[Tab Napper] ✅ Closed: ${item.title}`);
        } else {
          results.failed++;
          results.errors.push({ item, error: 'Failed to close' });
        }
      }
    } catch (error) {
      console.error('[Tab Napper] Error closing tab for item:', item.title, error);
      results.failed++;
      results.errors.push({ item, error: error.message });
    }
  }
  
  console.log(`[Tab Napper] 📊 Close results: ${results.closed} closed, ${results.skipped} pinned (skipped), ${results.failed} failed`);
  return results;
}

/**
 * Find and close duplicate tabs (multiple tabs with same normalized URL)
 * Phase 2: Duplicate cleanup utility
 * Excludes pinned tabs from being closed
 * @param {Object} options - { keepNewest: boolean, dryRun: boolean }
 * @returns {Promise<Object>} - { duplicates: Array, closed: number, kept: number, skipped: number }
 */
async function findAndCloseDuplicateTabs(options = {}) {
  const { keepNewest = true, dryRun = false } = options;
  
  try {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      console.warn('[Tab Napper] Chrome tabs API not available');
      return { duplicates: [], closed: 0, kept: 0, skipped: 0 };
    }
    
    const tabs = await new Promise((resolve, reject) => {
      chrome.tabs.query({}, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(tabs);
        }
      });
    });
    
    // Group tabs by normalized URL
    const urlGroups = new Map();
    
    for (const tab of tabs) {
      if (!tab.url || !tab.url.startsWith('http')) {
        continue; // Skip chrome:// and other special URLs
      }
      
      const normalized = normalizeUrl(tab.url);
      if (!urlGroups.has(normalized)) {
        urlGroups.set(normalized, []);
      }
      urlGroups.get(normalized).push(tab);
    }
    
    // Find groups with duplicates
    const duplicateGroups = Array.from(urlGroups.entries())
      .filter(([url, tabs]) => tabs.length > 1)
      .map(([url, tabs]) => ({ url, tabs }));
    
    console.log(`[Tab Napper] 🔍 Found ${duplicateGroups.length} URLs with duplicates`);
    
    let closed = 0;
    let kept = 0;
    let skipped = 0;
    const results = [];
    
    for (const group of duplicateGroups) {
      // Separate pinned from unpinned tabs
      const pinnedTabs = group.tabs.filter(t => t.pinned);
      const unpinnedTabs = group.tabs.filter(t => !t.pinned);
      
      // If all tabs are pinned, skip this group entirely
      if (unpinnedTabs.length === 0) {
        skipped += pinnedTabs.length - 1;
        console.log(`[Tab Napper] ⏭️ Skipped URL (all tabs pinned): ${group.url}`);
        continue;
      }
      
      // Sort unpinned tabs - newest first or oldest first based on option
      const sortedUnpinned = [...unpinnedTabs].sort((a, b) => {
        if (keepNewest) {
          return b.id - a.id; // Newer tabs have higher IDs
        } else {
          return a.id - b.id; // Older tabs have lower IDs
        }
      });
      
      // Keep first unpinned tab, close the rest (never close pinned)
      const [keepTab, ...closeTabs] = sortedUnpinned;
      
      results.push({
        url: group.url,
        totalCount: group.tabs.length,
        keptTab: keepTab,
        closedTabs: closeTabs,
        pinnedCount: pinnedTabs.length
      });
      
      kept++;
      skipped += pinnedTabs.length; // Count pinned tabs as skipped
      
      if (!dryRun) {
        for (const tab of closeTabs) {
          try {
            await chrome.tabs.remove(tab.id);
            closed++;
            console.log(`[Tab Napper] 🗑️ Closed duplicate: ${tab.title} (ID: ${tab.id})`);
          } catch (error) {
            console.error(`[Tab Napper] Failed to close tab ${tab.id}:`, error);
          }
        }
      } else {
        closed += closeTabs.length;
        if (pinnedTabs.length > 0) {
          console.log(`[Tab Napper] 🔍 [DRY RUN] Would close ${closeTabs.length} duplicates (${pinnedTabs.length} pinned preserved): ${keepTab.title}`);
        } else {
          console.log(`[Tab Napper] 🔍 [DRY RUN] Would close ${closeTabs.length} duplicates of: ${keepTab.title}`);
        }
      }
    }
    
    return {
      duplicates: results,
      closed,
      kept,
      skipped,
      dryRun
    };
  } catch (error) {
    console.error('[Tab Napper] Error finding/closing duplicates:', error);
    return { duplicates: [], closed: 0, kept: 0, skipped: 0, error: error.message };
  }
}

/**
 * Get information about the current active tab
 */
async function getCurrentTab() {
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const tabs = await new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(tabs);
          }
        });
      });
      
      return tabs[0] || null;
    }
    return null;
  } catch (error) {
    console.error('[Tab Napper] Error getting current tab:', error);
    return null;
  }
}

// Expose functions globally for console testing
if (typeof window !== 'undefined') {
  window.TriageHub_navigateToUrl = navigateToUrl;
  window.TriageHub_findOpenTab = findOpenTab;
  window.TriageHub_getCurrentTab = getCurrentTab;
  window.TriageHub_closeOpenTabs = closeOpenTabs;
  window.TriageHub_findDuplicates = findAndCloseDuplicateTabs;
}

export {
  navigateToUrl,
  findOpenTab,
  closeTab,
  closeOpenTabs,
  findAndCloseDuplicateTabs,
  getCurrentTab,
  normalizeUrl,
  openNoteEditor
};