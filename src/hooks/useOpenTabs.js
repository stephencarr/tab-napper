import { useState, useEffect, useCallback, useRef } from 'react';
import { findOpenTab } from '../utils/navigation.js';

// Configuration: Debounce delay for tab event handling (in milliseconds)
// Prevents excessive checks when tabs are rapidly created/updated/removed
const DEBOUNCE_DELAY_MS = 500;

/**
 * Custom hook to track which items are currently open in browser tabs
 * Phase 2: Enhanced with real-time Chrome tab event listeners
 * Phase 3: Added debouncing, caching, and window focus detection
 * 
 * @param {Array} items - Array of items to check (must have .url property)
 * @param {number} pollInterval - How often to check (ms), default 10 seconds
 * @param {boolean} useRealTimeEvents - Use Chrome tab events for instant updates (default true)
 * @returns {Object} - {
 *   openItemIds: Set<itemId>,           // Set of open item IDs
 *   uniqueTabCount: number,             // Number of unique browser tabs open for these items
 *   isOpen: (item) => boolean,          // Function to check if a specific item is open
 *   isChecking: boolean,                // Whether a check is currently in progress
 *   lastCheckTime: number,              // Timestamp of the last check (ms since epoch)
 *   refreshOpenTabs: () => void         // Function to manually refresh open tab status
 * }
 */
export function useOpenTabs(items = [], pollInterval = 10000, useRealTimeEvents = true) {
  const [openItemIds, setOpenItemIds] = useState(new Set());
  const [uniqueTabIds, setUniqueTabIds] = useState(new Set()); // Track unique browser tabs
  const [isChecking, setIsChecking] = useState(false);
  
  // Debounce timer ref
  const debounceTimerRef = useRef(null);
  
  // Cache last check result for instant display
  const [lastCheckTime, setLastCheckTime] = useState(0);

  /**
   * Check all items and update which ones are currently open
   */
  const checkOpenTabs = useCallback(async () => {
    if (!items || items.length === 0) {
      setOpenItemIds(new Set());
      setUniqueTabIds(new Set());
      return;
    }

    setIsChecking(true);
    const newOpenIds = new Set();
    const newTabIds = new Set(); // Track unique browser tab IDs

    try {
      console.log(`[useOpenTabs] Checking ${items.length} items for open tabs...`);
      
      // Check each item in parallel for performance
      await Promise.all(
        items.map(async (item) => {
          if (item.url && item.id) {
            try {
              const openTab = await findOpenTab(item.url);
              if (openTab) {
                newOpenIds.add(item.id);
                newTabIds.add(openTab.id); // Track the actual tab ID
                console.log(`[useOpenTabs] ✓ Found open: ${item.title || item.url} (window ${openTab.windowId}, tab ${openTab.id}, pinned: ${openTab.pinned})`);
              }
            } catch (error) {
              console.error('[useOpenTabs] Error checking item:', item.id, error);
            }
          }
        })
      );

      console.log(`[useOpenTabs] Detection complete: ${newTabIds.size} unique tabs open (${newOpenIds.size} items matched)`);
      setOpenItemIds(newOpenIds);
      setUniqueTabIds(newTabIds);
      setLastCheckTime(Date.now());
    } catch (error) {
      console.error('[useOpenTabs] Error checking open tabs:', error);
    } finally {
      setIsChecking(false);
    }
  }, [items]);
  
  /**
   * Debounced check - waits DEBOUNCE_DELAY_MS after last call before executing
   * Prevents redundant checks when multiple tabs change rapidly
   */
  const debouncedCheck = useCallback(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      console.log('[useOpenTabs] ⏱️ Debounced check executing...');
      checkOpenTabs();
    }, DEBOUNCE_DELAY_MS);
  }, [checkOpenTabs]);

  /**
   * Set up polling to keep open status updated
   */
  useEffect(() => {
    // Initial check
    checkOpenTabs();

    // Set up polling
    const interval = setInterval(checkOpenTabs, pollInterval);

    return () => clearInterval(interval);
  }, [checkOpenTabs, pollInterval]);

  /**
   * Phase 2: Real-time Chrome tab event listeners for instant updates
   * Phase 3: Enhanced with debouncing and window focus detection
   */
  useEffect(() => {
    if (!useRealTimeEvents) {
      return;
    }
    
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      return;
    }

    // Handler for tab changes (debounced)
    const handleTabChange = (tabId, changeInfo, tab) => {
      // Only refresh when tab is completely loaded or when URL changes
      if (changeInfo.status === 'complete' || changeInfo.url) {
        console.log('[useOpenTabs] 📡 Tab updated, debouncing check...');
        debouncedCheck();
      }
    };

    const handleTabCreated = () => {
      console.log('[useOpenTabs] 📡 Tab created, debouncing check...');
      debouncedCheck();
    };

    const handleTabRemoved = () => {
      console.log('[useOpenTabs] 📡 Tab removed, debouncing check...');
      debouncedCheck();
    };
    
    // Handler for window focus changes
    const handleWindowFocusChanged = (windowId) => {
      if (windowId !== chrome.windows.WINDOW_ID_NONE) {
        console.log('[useOpenTabs] 🪟 Window focus changed, checking tabs...');
        debouncedCheck();
      }
    };

    // Register listeners
    chrome.tabs.onCreated.addListener(handleTabCreated);
    chrome.tabs.onUpdated.addListener(handleTabChange);
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    chrome.windows.onFocusChanged.addListener(handleWindowFocusChanged);

    console.log('[useOpenTabs] 🎧 Real-time event listeners registered (with debouncing & window focus)');

    // Cleanup
    return () => {
      chrome.tabs.onCreated.removeListener(handleTabCreated);
      chrome.tabs.onUpdated.removeListener(handleTabChange);
      chrome.tabs.onRemoved.removeListener(handleTabRemoved);
      chrome.windows.onFocusChanged.removeListener(handleWindowFocusChanged);
      
      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      console.log('[useOpenTabs] 🔇 Real-time event listeners removed');
    };
  }, [debouncedCheck, useRealTimeEvents]);

  /**
   * Helper function to check if a specific item is open
   */
  const isOpen = useCallback(
    (item) => {
      return item && item.id ? openItemIds.has(item.id) : false;
    },
    [openItemIds]
  );

  // Return both item IDs and unique tab count
  return {
    openItemIds,
    uniqueTabCount: uniqueTabIds.size, // Actual number of unique browser tabs
    isOpen,
    isChecking,
    lastCheckTime, // Expose for debugging/display
    refreshOpenTabs: checkOpenTabs
  };
}
