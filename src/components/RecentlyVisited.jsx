import React, { useState, useEffect, useRef } from 'react';
import { Clock, ExternalLink } from 'lucide-react';
import { navigateToUrl } from '../utils/navigation.js';
import { useReactiveStorage } from '../utils/reactiveStorage.js';
import { cn } from '../utils/cn.js';
import ListItem from './ListItem.jsx';

/**
 * Lightweight history fetch for RecentlyVisited component
 */
async function getLightweightRecentHistory(maxItems = 50) {
  if (typeof chrome === 'undefined' || !chrome.history) {
    console.log('[RecentlyVisited] Chrome history API not available');
    return [];
  }
  
  try {
    const searchBudget = Math.max(50, maxItems * 5);
    const historyItems = await new Promise((resolve, reject) => {
      chrome.history.search(
        {
          text: '',
          maxResults: searchBudget,
          // Removed startTime to get most recent items regardless of date
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
    
    // Filter out unwanted URLs
    const excludePatterns = [
      'chrome://', 'chrome-extension://', 'moz-extension://',
      'data:', 'blob:', 'javascript:'
    ];
    
    const filtered = historyItems
      .filter(item => 
        !excludePatterns.some(pattern => item.url.startsWith(pattern)) &&
        item.title && item.title.trim().length > 0
      )
      .map(item => ({
        ...item,
        id: `history-${item.url}`,
        description: item.url
      }));

    // Ensure we only return up to requested maxItems
    return filtered.slice(0, Math.max(0, maxItems));
    
  } catch (error) {
    console.error('[RecentlyVisited] Error fetching lightweight history:', error);
    return [];
  }
}

/**
 * Recently Visited component for the Left Column
 * Shows browser history with visual status indicators
 */
function RecentlyVisited({ className, maxItems = 50 }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const mountedRef = useRef(true); // Start as true since we're in the component
  
  // Watch for changes in stashed tabs to update history status
  const { data: stashedTabs } = useReactiveStorage('triageHub_stashedTabs', []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { 
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Load history on component mount and when stashed tabs change
  useEffect(() => {
    // Debounce rapid triggers so we don't hammer chrome.history.search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      loadHistory();
    }, 400);
  }, [maxItems, stashedTabs]); // Add stashedTabs as dependency

  const loadHistory = async () => {
    try {
      if (!mountedRef.current) return;
      setIsLoading(true);
      setError(null);
      
      const items = await getLightweightRecentHistory(maxItems);
      if (!mountedRef.current) return;
      setHistoryItems(items);
      
    } catch (err) {
      console.error('[Tab Napper] Error loading history:', err);
      if (!mountedRef.current) return;
      setError('Failed to load browsing history');
    } finally {
      if (!mountedRef.current) return;
      setIsLoading(false);
    }
  };

  // Handle clicking on a history item
  const handleHistoryItemClick = async (item) => {
    console.log('[Tab Napper] 🖱️ History item clicked:', {
      title: item.title,
      url: item.url
    });

    try {
      const result = await navigateToUrl(item.url, item.title);
      
      if (result.action === 'switched') {
        console.log('[Tab Napper] ✅ Successfully switched to existing tab');
      } else if (result.action === 'created') {
        console.log('[Tab Napper] ✅ Successfully opened new tab');
      } else {
        console.log('[Tab Napper] ✅ Opened in external window/fallback');
      }
      
      // Refresh the history to update open status
      setTimeout(() => {
        loadHistory();
      }, 500);
      
    } catch (error) {
      console.error('[Tab Napper] ❌ Error navigating to URL:', error);
    }
  };

  // Get time ago string
  const getTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  // Get favicon URL
  const getFaviconUrl = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return null;
    }
  };

  if (isLoading && historyItems.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-calm-600 dark:text-calm-400" />
            <h2 className="text-lg font-semibold text-calm-800 dark:text-calm-200">Recently Visited</h2>
          </div>
          <div className="animate-pulse">
            <Clock className="h-4 w-4 text-calm-400 dark:text-calm-500" />
          </div>
        </div>
        
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 bg-calm-100 dark:bg-calm-800 rounded-lg animate-pulse">
              <div className="h-4 bg-calm-200 dark:bg-calm-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-calm-200 dark:bg-calm-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-calm-600 dark:text-calm-400" />
            <h2 className="text-lg font-semibold text-calm-800 dark:text-calm-200">Recently Visited</h2>
          </div>
        </div>
        
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (historyItems.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-calm-600 dark:text-calm-400" />
            <h2 className="text-lg font-semibold text-calm-800 dark:text-calm-200">Recently Visited</h2>
          </div>
        </div>
        
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-calm-300 dark:text-calm-600 mx-auto mb-4" />
          <p className="text-calm-500 dark:text-calm-400 mb-2">No browsing history found</p>
          <p className="text-calm-400 dark:text-calm-500 text-sm">
            Visit some websites to see your recent history here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-calm-600 dark:text-calm-400" />
          <h2 className="text-lg font-semibold text-calm-800 dark:text-calm-200">Recently Visited</h2>
          <span className="text-sm text-calm-500 dark:text-calm-400 bg-calm-100 dark:bg-calm-800 px-2 py-1 rounded-full">
            {historyItems.length}
          </span>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {historyItems.map((item, index) => (
          <ListItem
            key={item.id || item.url || index}
            onClick={() => handleHistoryItemClick(item)}
            className="hover:bg-calm-50 dark:hover:bg-calm-800 transition-colors"
          >
            <div className="flex items-start space-x-3">
              {/* Favicon */}
              <div className="flex-shrink-0 mt-1">
                {getFaviconUrl(item.url) ? (
                  <img
                    src={getFaviconUrl(item.url)}
                    alt=""
                    className="w-4 h-4"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <ExternalLink className="w-4 h-4 text-calm-400 dark:text-calm-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm font-medium text-calm-800 dark:text-calm-200 truncate">
                    {item.title}
                  </p>
                </div>
                
                <p className="text-xs text-calm-500 dark:text-calm-400 truncate mb-1">
                  {item.url}
                </p>
                
                <div className="flex items-center justify-between text-xs text-calm-400 dark:text-calm-500">
                  <span>{getTimeAgo(item.lastVisitTime)}</span>
                  {item.visitCount > 1 && (
                    <span>{item.visitCount} visits</span>
                  )}
                </div>
              </div>
            </div>
          </ListItem>
        ))}
      </div>

      {/* Simple footer */}
      <div className="border-t border-calm-200 dark:border-calm-700 pt-3">
        <div className="flex items-center justify-center text-xs text-calm-500 dark:text-calm-400">
          <span>Last {maxItems} items</span>
        </div>
      </div>
    </div>
  );
}

export default RecentlyVisited;