/**
 * History utilities for Triage Hub
 * Handles Chrome history API integration and deduplication
 */

import { loadAppState } from './storage.js';

/**
 * Fetch recent history from Chrome History API
 */
async function fetchRecentHistory(maxResults = 20) {
  try {
    if (typeof chrome !== 'undefined' && chrome.history) {
      // Get history from Chrome API
      const historyItems = await new Promise((resolve, reject) => {
        chrome.history.search(
          {
            text: '',
            maxResults: maxResults * 3, // Get more to account for deduplication
            startTime: Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
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

      console.log(`[Triage Hub] Fetched ${historyItems.length} history items from Chrome`);
      
      // Deduplicate and limit results
      const deduped = deduplicateHistoryItems(historyItems);
      const limited = deduped.slice(0, maxResults);
      
      console.log(`[Triage Hub] After deduplication: ${limited.length} unique items`);
      return limited;

    } else {
      console.log('[Triage Hub] Chrome history API not available, using mock data');
      return getMockHistoryData();
    }
  } catch (error) {
    console.error('[Triage Hub] Error fetching history:', error);
    return getMockHistoryData();
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
      
      return tabs.map(tab => normalizeUrl(tab.url));
    } else {
      console.log('[Triage Hub] Chrome tabs API not available');
      return [];
    }
  } catch (error) {
    console.error('[Triage Hub] Error fetching open tabs:', error);
    return [];
  }
}

/**
 * Check if URL exists in stashed tabs
 */
async function getStashedUrls() {
  try {
    const stashedTabs = await loadAppState('triageHub_stashedTabs') || [];
    return stashedTabs.map(tab => normalizeUrl(tab.url || ''));
  } catch (error) {
    console.error('[Triage Hub] Error fetching stashed URLs:', error);
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
    console.error('[Triage Hub] Error enriching history:', error);
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
function getMockHistoryData() {
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
  
  console.log('[Triage Hub] Using mock history data');
  return mockItems;
}

/**
 * Get recent history with status indicators
 */
async function getRecentHistoryWithStatus(maxResults = 20) {
  try {
    const historyItems = await fetchRecentHistory(maxResults);
    const enrichedItems = await enrichHistoryWithStatus(historyItems);
    
    console.log(`[Triage Hub] Retrieved ${enrichedItems.length} history items with status`);
    return enrichedItems;
  } catch (error) {
    console.error('[Triage Hub] Error getting history with status:', error);
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