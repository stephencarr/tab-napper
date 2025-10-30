/**
 * Tab capture and deduplication logic for Tab Napper
 * Handles universal tab removal with smart deduplication
 */

import { loadAppState, saveAppState } from './storage.js';
import { debugLog, debugError, debugSuccess } from './debug.js';

// In-memory store for tracking tab information
let tabTracker = new Map();

/**
 * Track tab information for capture when closed
 */
function trackTab(tab) {
  if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
    tabTracker.set(tab.id, {
      id: tab.id,
      url: tab.url,
      title: tab.title || 'Untitled',
      favIconUrl: tab.favIconUrl || null,
      lastUpdated: Date.now()
    });
    debugLog('Capture', `Tracking tab: ${tab.title}`);
  }
}

/**
 * Clean up old tracked tabs (older than 1 hour)
 */
function cleanupTabTracker() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [tabId, tabInfo] of tabTracker.entries()) {
    if (tabInfo.lastUpdated < oneHourAgo) {
      tabTracker.delete(tabId);
    }
  }
}

/**
 * Check if two URLs are effectively the same (ignoring fragments, some params)
 */
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    // Remove fragment and common tracking parameters
    urlObj.hash = '';
    urlObj.searchParams.delete('utm_source');
    urlObj.searchParams.delete('utm_medium');
    urlObj.searchParams.delete('utm_campaign');
    urlObj.searchParams.delete('fbclid');
    urlObj.searchParams.delete('gclid');
    return urlObj.toString();
  } catch {
    return url; // Return original if URL parsing fails
  }
}

/**
 * Check if a URL already exists in scheduled
 */
async function findDuplicateInStashed(url) {
  try {
    const stashedTabs = await loadAppState('triageHub_scheduled') || [];
    const normalizedUrl = normalizeUrl(url);
    
    return stashedTabs.find(tab => 
      normalizeUrl(tab.url || '') === normalizedUrl
    );
  } catch (error) {
    debugError('Capture', 'Error checking for duplicates:', error);
    return null;
  }
}

/**
 * Remove duplicate tab from scheduled
 */
async function removeDuplicateFromStashed(duplicateItem) {
  try {
    const stashedTabs = await loadAppState('triageHub_scheduled') || [];
    const originalCount = stashedTabs.length;
    
    const updatedStashed = stashedTabs.filter(tab => tab.id !== duplicateItem.id);
    const newCount = updatedStashed.length;
    
    await saveAppState('triageHub_scheduled', updatedStashed);
    
    debugSuccess('Capture', `Removed duplicate from scheduled: "${duplicateItem.title}" (${originalCount} → ${newCount})`);
    
    return true;
  } catch (error) {
    debugError('Capture', 'Error removing duplicate:', error);
    return false;
  }
}

/**
 * Add new item to triage inbox
 */
async function addToTriageInbox(item) {
  try {
    const inbox = await loadAppState('triageHub_inbox') || [];
    
    // Create standardized inbox item
    const inboxItem = {
      id: `inbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: item.title || 'Untitled',
      description: item.description || '',
      url: item.url || '',
      timestamp: Date.now(),
      type: item.type || 'tab',
      source: 'capture',
      favicon: item.favicon || null,
      ...item // Allow override of any properties
    };
    
    // Add to beginning of inbox (most recent first)
    const updatedInbox = [inboxItem, ...inbox];
    
    await saveAppState('triageHub_inbox', updatedInbox);
    debugSuccess('Capture', `Added to triage inbox: ${inboxItem.title}`);
    
    return inboxItem;
  } catch (error) {
    debugError('Capture', 'Error adding to inbox:', error);
    throw error;
  }
}

/**
 * Universal tab capture handler with deduplication
 * This is the main function called when a tab is closed
 */
async function captureClosedTab(tabInfo) {
  try {
    debugLog('Capture', `🎯 STARTING TAB CAPTURE: ${tabInfo.title}`);
    debugLog('Capture', `📍 URL: ${tabInfo.url}`);
    
    // Step 1: Simple gateway deduplication - check ALL collections
    const normalizedUrl = normalizeUrl(tabInfo.url);
    debugLog('Capture', `🔍 Checking for duplicates of: ${normalizedUrl}`);
    
    // Load all collections
    const [triageInbox, stashedTabs, trash] = await Promise.all([
      loadAppState('triageHub_inbox', []),
      loadAppState('triageHub_scheduled', []),
      loadAppState('triageHub_trash', [])
    ]);
    
    let removedFrom = [];
    
    // Check and remove from triage inbox
    const inboxDuplicates = triageInbox.filter(item => normalizeUrl(item.url || '') === normalizedUrl);
    if (inboxDuplicates.length > 0) {
      const cleanedInbox = triageInbox.filter(item => normalizeUrl(item.url || '') !== normalizedUrl);
      await saveAppState('triageHub_inbox', cleanedInbox);
      removedFrom.push(`inbox (${inboxDuplicates.length})`);
      debugLog('Capture', `�️ Removed ${inboxDuplicates.length} duplicates from inbox`);
    }
    
    // Check and remove from scheduled
    const stashedDuplicates = stashedTabs.filter(item => normalizeUrl(item.url || '') === normalizedUrl);
    if (stashedDuplicates.length > 0) {
      const cleanedStashed = stashedTabs.filter(item => normalizeUrl(item.url || '') !== normalizedUrl);
      await saveAppState('triageHub_scheduled', cleanedStashed);
      removedFrom.push(`stashed (${stashedDuplicates.length})`);
      debugLog('Capture', `🗑️ Removed ${stashedDuplicates.length} duplicates from scheduled`);
    }
    
    // Check and remove from trash (optional - might want to keep trash separate)
    const trashDuplicates = trash.filter(item => normalizeUrl(item.url || '') === normalizedUrl);
    if (trashDuplicates.length > 0) {
      const cleanedTrash = trash.filter(item => normalizeUrl(item.url || '') !== normalizedUrl);
      await saveAppState('triageHub_trash', cleanedTrash);
      removedFrom.push(`trash (${trashDuplicates.length})`);
      debugLog('Capture', `🗑️ Removed ${trashDuplicates.length} duplicates from trash`);
    }
    
    // Log deduplication summary
    if (removedFrom.length > 0) {
      debugSuccess('Capture', `✅ DEDUPLICATION: Removed old entries from ${removedFrom.join(', ')}`);
    } else {
      debugLog('Capture', 'ℹ️ No duplicates found - this is a new URL');
    }
    
    // Step 2: Add fresh entry to triage inbox
    debugLog('Capture', '📥 Adding fresh entry to triage inbox...');
    const inboxItem = await addToTriageInbox({
      title: tabInfo.title,
      description: `Captured from ${new URL(tabInfo.url).hostname}`,
      url: tabInfo.url,
      favicon: tabInfo.favIconUrl,
      type: 'captured-tab'
    });
    
    debugSuccess('Capture', `✅ TAB CAPTURE COMPLETE - Fresh entry: ${inboxItem.id}`);
    debugLog('Capture', `📊 SUMMARY: Removed duplicates from [${removedFrom.join(', ')}], added 1 fresh entry`);
    
    return inboxItem;
    
  } catch (error) {
    debugError('Capture', '❌ ERROR in capture process:', error);
    throw error;
  }
}

/**
 * Simulate tab closure for testing purposes
 */
async function simulateTabCapture(url, title) {
  const mockTab = {
    url: url,
    title: title || `Test Tab - ${new Date().toLocaleTimeString()}`,
    favIconUrl: null
  };
  
  return await captureClosedTab(mockTab);
}

/**
 * Set up Chrome extension listeners for actual tab capture
 * This should be called during extension initialization
 */
function setupTabCaptureListeners() {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    
    // Track all existing tabs on startup
    chrome.tabs.query({}, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error('[Tab Napper] Error querying tabs on startup:', chrome.runtime.lastError.message);
        return;
      }
      tabs.forEach(tab => trackTab(tab));
      debugLog('Capture', `Tracking ${tabs.length} existing tabs`);
    });
    
    // Track new tabs when created
    chrome.tabs.onCreated.addListener((tab) => {
      trackTab(tab);
    });
    
    // Update tracked tab info when tabs change
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.url || changeInfo.title) {
        trackTab(tab);
      }
    });
    
    // Handle tab activation to update tracking
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        trackTab(tab);
      } catch (error) {
        // Tab might not exist anymore, ignore
      }
    });
    
    // CRITICAL: Handle tab removal with capture
    chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
      try {
        const trackedTab = tabTracker.get(tabId);
        
        if (trackedTab && trackedTab.url) {
          // Skip chrome:// and extension pages
          if (trackedTab.url.startsWith('chrome://') || 
              trackedTab.url.startsWith('chrome-extension://') ||
              trackedTab.url.startsWith('moz-extension://') ||
              trackedTab.url === 'about:blank') {
            debugLog('Capture', `Skipping system tab: ${trackedTab.url}`);
            tabTracker.delete(tabId);
            return;
          }
          
          debugLog('Capture', `🚫 Tab closed: ${trackedTab.title} (${trackedTab.url})`);
          
          // Capture the closed tab
          await captureClosedTab(trackedTab);
          
        } else {
          debugLog('Capture', `Tab ${tabId} closed but not tracked`);
        }
        
        // Clean up tracking
        tabTracker.delete(tabId);
        
      } catch (error) {
        debugError('Capture', 'Error in tab removal listener:', error);
      }
    });
    
    // Clean up old tracked tabs periodically
    setInterval(cleanupTabTracker, 5 * 60 * 1000); // Every 5 minutes
    
    debugLog('Capture', 'Tab capture listeners set up successfully');
    console.log('[Tab Napper] 🎯 Universal tab capture system is ACTIVE');
    
  } else {
    debugLog('Capture', 'Chrome APIs not available, tab capture disabled');
  }
}

// Expose functions globally for testing and debugging
if (typeof window !== 'undefined') {
  window.tabNapperCapture = {
    simulate: simulateTabCapture,
    setup: setupTabCaptureListeners,
    getTracked: () => Array.from(tabTracker.values()),
    clearTracked: () => tabTracker.clear(),
    captureUrl: async (url, title) => {
      const mockTab = { url, title: title || url, favIconUrl: null };
      return await captureClosedTab(mockTab);
    }
  };
}

export {
  captureClosedTab,
  simulateTabCapture,
  setupTabCaptureListeners,
  findDuplicateInStashed,
  addToTriageInbox,
  normalizeUrl,
  trackTab,
  cleanupTabTracker
};