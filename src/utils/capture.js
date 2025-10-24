/**
 * Tab capture and deduplication logic for Triage Hub
 * Handles universal tab removal with smart deduplication
 */

import { loadAppState, saveAppState } from './storage.js';

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
 * Check if a URL already exists in stashed tabs
 */
async function findDuplicateInStashed(url) {
  try {
    const stashedTabs = await loadAppState('triageHub_stashedTabs') || [];
    const normalizedUrl = normalizeUrl(url);
    
    return stashedTabs.find(tab => 
      normalizeUrl(tab.url || '') === normalizedUrl
    );
  } catch (error) {
    console.error('[Triage Hub] Error checking for duplicates:', error);
    return null;
  }
}

/**
 * Remove duplicate tab from stashed tabs
 */
async function removeDuplicateFromStashed(duplicateItem) {
  try {
    const stashedTabs = await loadAppState('triageHub_stashedTabs') || [];
    const originalCount = stashedTabs.length;
    
    const updatedStashed = stashedTabs.filter(tab => tab.id !== duplicateItem.id);
    const newCount = updatedStashed.length;
    
    await saveAppState('triageHub_stashedTabs', updatedStashed);
    
    console.log(`[Triage Hub] 🗑️  Removed duplicate from stashed tabs:`);
    console.log(`[Triage Hub] 📰 Title: "${duplicateItem.title}"`);
    console.log(`[Triage Hub] 🆔 ID: ${duplicateItem.id}`);
    console.log(`[Triage Hub] 📊 Stashed count: ${originalCount} → ${newCount}`);
    
    return true;
  } catch (error) {
    console.error('[Triage Hub] Error removing duplicate:', error);
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
    console.log('[Triage Hub] Added to triage inbox:', inboxItem.title);
    
    return inboxItem;
  } catch (error) {
    console.error('[Triage Hub] Error adding to inbox:', error);
    throw error;
  }
}

/**
 * Universal tab capture handler with deduplication
 * This is the main function called when a tab is closed
 */
async function captureClosedTab(tabInfo) {
  try {
    console.log('[Triage Hub] 🎯 STARTING TAB CAPTURE:', tabInfo.title);
    console.log('[Triage Hub] 📍 URL:', tabInfo.url);
    
    // Step 1: Check for duplicates in stashed tabs
    const duplicate = await findDuplicateInStashed(tabInfo.url);
    
    if (duplicate) {
      console.log('[Triage Hub] 🔄 DUPLICATE FOUND in stashed tabs!');
      console.log('[Triage Hub] 🗑️  Removing old version:', duplicate.title);
      console.log('[Triage Hub] 🆔 Old item ID:', duplicate.id);
      
      await removeDuplicateFromStashed(duplicate);
      
      console.log('[Triage Hub] ✅ DEDUPLICATION COMPLETE - Old version removed');
    } else {
      console.log('[Triage Hub] ℹ️  No duplicates found in stashed tabs');
    }
    
    // Step 2: Add to triage inbox
    console.log('[Triage Hub] 📥 Adding to triage inbox...');
    const inboxItem = await addToTriageInbox({
      title: tabInfo.title,
      description: `Captured from ${new URL(tabInfo.url).hostname}`,
      url: tabInfo.url,
      favicon: tabInfo.favIconUrl,
      type: 'captured-tab'
    });
    
    console.log('[Triage Hub] ✅ TAB CAPTURE COMPLETE');
    console.log('[Triage Hub] 🆔 New inbox item ID:', inboxItem.id);
    
    if (duplicate) {
      console.log('[Triage Hub] 📊 SUMMARY: Removed 1 duplicate, added 1 new item');
    } else {
      console.log('[Triage Hub] 📊 SUMMARY: No duplicates found, added 1 new item');
    }
    
    return inboxItem;
    
  } catch (error) {
    console.error('[Triage Hub] ❌ ERROR in capture process:', error);
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
    // Listen for tab removal
    chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
      try {
        // We can't get tab info after it's removed, so this would need
        // to be paired with onUpdated listener to track tab info
        console.log('[Triage Hub] Tab removed:', tabId);
      } catch (error) {
        console.error('[Triage Hub] Error in tab removal listener:', error);
      }
    });
    
    console.log('[Triage Hub] Tab capture listeners set up');
  } else {
    console.log('[Triage Hub] Chrome APIs not available, tab capture disabled');
  }
}

// Expose functions globally for testing
if (typeof window !== 'undefined') {
  window.TriageHub_captureTab = simulateTabCapture;
  window.TriageHub_setupCapture = setupTabCaptureListeners;
}

export {
  captureClosedTab,
  simulateTabCapture,
  setupTabCaptureListeners,
  findDuplicateInStashed,
  addToTriageInbox,
  normalizeUrl
};