/**
 * History utilities for Tab Napper
 * Handles Chrome history API integration and deduplication
 */

import { loadAppState } from './storage.js';
import { debugLog, debugError } from './debug.js';

// Cache for history data to reduce API calls
let historyCache = null;
let historyCacheTime = 0;
const HISTORY_CACHE_DURATION = 30000; // 30 seconds

/**
 * Fetch recent history from Chrome History API
 */
async function fetchRecentHistory(maxResults = 20) {
  try {
    // Check cache first
    const now = Date.now();
    if (historyCache && (now - historyCacheTime) < HISTORY_CACHE_DURATION) {
      debugLog('History', 'Using cached history data');
      return historyCache.slice(0, maxResults);
    }

    // Check for mock data first (for testing)
    if (typeof window !== 'undefined' && window._mockHistoryData) {
      console.log('[Tab Napper] 🧪 Using mock history data for testing');
      const mockData = await getMockHistoryData();
      
      console.log(`[Tab Napper] 📊 Mock data: ${mockData.length} items, requested: ${maxResults}`);
      
      // Cache the mock data
      historyCache = mockData;
      historyCacheTime = now;
      
      return mockData.slice(0, maxResults);
    }

    // Only use stored mock data if explicitly enabled via window flag
    if (typeof window !== 'undefined' && window._enableMockHistory) {
      const storedMockData = await getMockHistoryData();
      if (storedMockData && storedMockData.length > 0) {
        console.log('[Tab Napper] 🧪 Using stored mock history data for testing');
        console.log(`[Tab Napper] 📊 Stored mock data: ${storedMockData.length} items, requested: ${maxResults}`);
        
        // Cache the mock data
        historyCache = storedMockData;
        historyCacheTime = now;
        
        return storedMockData.slice(0, maxResults);
      }
    }

    if (typeof chrome !== 'undefined' && chrome.history) {
      // Test Chrome history API availability
      try {
        // First, test a small query to verify permissions
        await new Promise((resolve, reject) => {
          chrome.history.search(
            { text: '', maxResults: 1, startTime: Date.now() - 60000 }, // Last minute
            (results) => {
              if (chrome.runtime.lastError) {
                console.warn('[Tab Napper] Chrome history permission issue:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
              } else {
                resolve(results);
              }
            }
          );
        });
        
        // If test passed, proceed with full query
        console.log('[Tab Napper] ✅ Chrome history API available and accessible');
      } catch (permissionError) {
        console.error('[Tab Napper] ❌ Chrome history API permission denied:', permissionError);
        console.log('[Tab Napper] 💡 Browser history search will be unavailable');
        return await getMockHistoryData();
      }
      
      // Determine time window based on request size
      const isComprehensiveSearch = maxResults > 1000;
      const timeWindow = isComprehensiveSearch 
        ? (365 * 24 * 60 * 60 * 1000) // 1 year for comprehensive search
        : (30 * 24 * 60 * 60 * 1000);  // 30 days for regular fetch
        
      console.log(`[Tab Napper] 📚 Fetching ${isComprehensiveSearch ? 'comprehensive' : 'recent'} history (${isComprehensiveSearch ? '1 year' : '30 days'})`);
      console.log(`[Tab Napper] 📊 Requesting ${maxResults} items from ${Math.floor(timeWindow / (24 * 60 * 60 * 1000))} days ago`);
      
      // Get history from Chrome API
      const historyItems = await new Promise((resolve, reject) => {
        chrome.history.search(
          {
            text: '',
            maxResults: Math.max(maxResults * 3, 10000), // Get more to account for deduplication, minimum 10k
            startTime: Date.now() - timeWindow
          },
          (results) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(results);
            }
          }
        );
      });

      // Only log significant amounts to reduce console noise
      if (historyItems.length > 10) {
        debugLog('History', `✅ Fetched ${historyItems.length} history items from Chrome`);
      }
      
      // Deduplicate and limit results
      const deduped = deduplicateHistoryItems(historyItems);
      
      // Cache the results
      historyCache = deduped;
      historyCacheTime = now;
      
      const limited = deduped.slice(0, maxResults);
      
      if (limited.length !== historyItems.length && limited.length > 5) {
        debugLog('History', `After deduplication: ${limited.length} unique items`);
      }
      return limited;

    } else {
      console.log('[Tab Napper] ⚠️ Chrome history API not available, using mock data');
      return await getMockHistoryData();
    }
  } catch (error) {
    console.error('[Tab Napper] Error fetching history:', error);
    return await getMockHistoryData();
  }
}

/**
 * Deduplicate history items by URL
 */
function deduplicateHistoryItems(historyItems) {
  const urlMap = new Map();
  
  // Keep the most recent visit for each URL
  historyItems.forEach(item => {
    const url = normalizeUrl(item.url);
    const existing = urlMap.get(url);
    
    if (!existing || item.lastVisitTime > existing.lastVisitTime) {
      urlMap.set(url, item);
    }
  });
  
  return Array.from(urlMap.values())
    .filter(item => isValidHistoryItem(item))
    .sort((a, b) => b.lastVisitTime - a.lastVisitTime);
}

/**
 * Normalize URL for deduplication
 */
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    // Remove fragments and common tracking parameters
    urlObj.hash = '';
    urlObj.searchParams.delete('utm_source');
    urlObj.searchParams.delete('utm_medium');
    urlObj.searchParams.delete('utm_campaign');
    urlObj.searchParams.delete('fbclid');
    urlObj.searchParams.delete('gclid');
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Check if history item should be included
 */
function isValidHistoryItem(item) {
  // Filter out unwanted URLs
  const excludePatterns = [
    'chrome://',
    'chrome-extension://',
    'moz-extension://',
    'data:',
    'blob:',
    'javascript:'
  ];
  
  return !excludePatterns.some(pattern => item.url.startsWith(pattern)) &&
         item.title && 
         item.title.trim().length > 0;
}

/**
 * Get currently open tabs
 */
async function getCurrentlyOpenTabs() {
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
      
      // Filter out invalid URLs and normalize valid ones
      return tabs
        .filter(tab => tab.url && typeof tab.url === 'string' && tab.url.startsWith('http'))
        .map(tab => {
          try {
            return normalizeUrl(tab.url);
          } catch (error) {
            console.warn('[Tab Napper] Invalid URL in open tabs:', tab.url, error);
            return null;
          }
        })
        .filter(url => url !== null);
    } else {
      console.log('[Tab Napper] Chrome tabs API not available');
      return [];
    }
  } catch (error) {
    console.error('[Tab Napper] Error fetching open tabs:', error);
    return [];
  }
}

/**
 * Check if URL exists in scheduled
 */
async function getStashedUrls() {
  try {
    const scheduledTabs = await loadAppState('triageHub_scheduled') || [];
    return scheduledTabs.map(tab => normalizeUrl(tab.url || ''));
  } catch (error) {
    console.error('[Tab Napper] Error fetching stashed URLs:', error);
    return [];
  }
}

/**
 * Add status indicators to history items
 */
async function enrichHistoryWithStatus(historyItems) {
  try {
    const [openTabs, stashedUrls] = await Promise.all([
      getCurrentlyOpenTabs(),
      getStashedUrls()
    ]);
    
    return historyItems.map(item => {
      const normalizedUrl = normalizeUrl(item.url);
      
      return {
        ...item,
        isCurrentlyOpen: openTabs.includes(normalizedUrl),
        isPreviouslyStashed: stashedUrls.includes(normalizedUrl)
      };
    });
  } catch (error) {
    console.error('[Tab Napper] Error enriching history:', error);
    return historyItems.map(item => ({
      ...item,
      isCurrentlyOpen: false,
      isPreviouslyStashed: false
    }));
  }
}

/**
 * Get mock history data for testing when Chrome API unavailable
 */
async function getMockHistoryData() {
  // Check if we have test data generated by devUtils
  if (typeof window !== 'undefined' && window._mockHistoryData) {
    console.log('[Tab Napper] Using generated test history data from window');
    return window._mockHistoryData;
  }
  
  // Check extension storage for persistent mock data
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['tabNapper_mockHistory']);
      if (result.tabNapper_mockHistory && result.tabNapper_mockHistory.length > 0) {
        console.log('[Tab Napper] Using generated test history data from storage');
        // Also restore to window for faster access
        if (typeof window !== 'undefined') {
          window._mockHistoryData = result.tabNapper_mockHistory;
        }
        return result.tabNapper_mockHistory;
      }
    }
  } catch (error) {
    console.warn('[Tab Napper] Could not read mock data from storage:', error);
  }
  
  // Fallback to basic mock data
  const mockItems = [
    {
      id: 'mock-1',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API',
      title: 'Web APIs | MDN',
      lastVisitTime: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      visitCount: 5,
      typedCount: 1
    },
    {
      id: 'mock-2',
      url: 'https://react.dev/learn',
      title: 'Learn React',
      lastVisitTime: Date.now() - 1000 * 60 * 60, // 1 hour ago
      visitCount: 3,
      typedCount: 0
    },
    {
      id: 'mock-3',
      url: 'https://tailwindcss.com/docs',
      title: 'Tailwind CSS Documentation',
      lastVisitTime: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      visitCount: 8,
      typedCount: 2
    },
    {
      id: 'mock-4',
      url: 'https://github.com/microsoft/vscode',
      title: 'microsoft/vscode: Visual Studio Code',
      lastVisitTime: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
      visitCount: 2,
      typedCount: 0
    },
    {
      id: 'mock-5',
      url: 'https://stackoverflow.com/questions/tagged/javascript',
      title: 'javascript - Stack Overflow',
      lastVisitTime: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
      visitCount: 12,
      typedCount: 1
    }
  ];
  
  console.log('[Tab Napper] Using basic mock history data');
  return mockItems;
}

/**
 * Get recent history with status indicators
 */
async function getRecentHistoryWithStatus(maxResults = 20) {
  try {
    const historyItems = await fetchRecentHistory(maxResults);
    const enrichedItems = await enrichHistoryWithStatus(historyItems);
    
    debugLog('History', `Retrieved ${enrichedItems.length} history items with status`);
    return enrichedItems;
  } catch (error) {
    debugError('History', 'Error getting history with status:', error);
    return [];
  }
}

export {
  fetchRecentHistory,
  getRecentHistoryWithStatus,
  getCurrentlyOpenTabs,
  getStashedUrls,
  enrichHistoryWithStatus,
  normalizeUrl
};

// Expose cache clearing function for testing
if (typeof window !== 'undefined') {
  window._clearHistoryCache = () => {
    historyCache = null;
    historyCacheTime = 0;
  };
}