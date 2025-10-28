/**
 * Tab navigation utilities for Tab Napper
 * Handles opening, switching, and managing browser tabs
 */

import { isCurrentTabPinned } from './autoPin.js';

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
}

export {
  navigateToUrl,
  findOpenTab,
  closeTab,
  getCurrentTab,
  normalizeUrl,
  openNoteEditor
};