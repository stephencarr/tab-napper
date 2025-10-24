import React, { useState, useEffect } from 'react';
import { Clock, Square, Pin, ExternalLink } from 'lucide-react';
import { getRecentHistoryWithStatus } from '../utils/history.js';
import { navigateToUrl } from '../utils/navigation.js';
import { useReactiveStorage } from '../utils/reactiveStorage.js';
import { cn } from '../utils/cn.js';
import ListItem from './ListItem.jsx';

/**
 * Recently Visited component for the Left Column
 * Shows browser history with visual status indicators
 */
function RecentlyVisited({ className, maxItems = 20 }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Watch for changes in stashed tabs to update history status
  const { data: stashedTabs } = useReactiveStorage('triageHub_stashedTabs', []);

  // Load history on component mount and when stashed tabs change
  useEffect(() => {
    loadHistory();
  }, [maxItems, stashedTabs]); // Add stashedTabs as dependency

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const items = await getRecentHistoryWithStatus(maxItems);
      setHistoryItems(items);
      
    } catch (err) {
      console.error('[Tab Napper] Error loading history:', err);
      setError('Failed to load browsing history');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clicking on a history item
  const handleHistoryItemClick = async (item) => {
    console.log('[Tab Napper] 🖱️ History item clicked:', {
      title: item.title,
      url: item.url,
      isCurrentlyOpen: item.isCurrentlyOpen,
      isPreviouslyStashed: item.isPreviouslyStashed
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
            <Clock className="h-5 w-5 text-calm-600" />
            <h2 className="text-lg font-semibold text-calm-800">Recently Visited</h2>
          </div>
          <div className="animate-pulse">
            <Clock className="h-4 w-4 text-calm-400" />
          </div>
        </div>
        
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 bg-calm-100 rounded-lg animate-pulse">
              <div className="h-4 bg-calm-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-calm-200 rounded w-1/2"></div>
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
            <Clock className="h-5 w-5 text-calm-600" />
            <h2 className="text-lg font-semibold text-calm-800">Recently Visited</h2>
          </div>
        </div>
        
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (historyItems.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-calm-600" />
            <h2 className="text-lg font-semibold text-calm-800">Recently Visited</h2>
          </div>
        </div>
        
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-calm-300 mx-auto mb-4" />
          <p className="text-calm-500 mb-2">No browsing history found</p>
          <p className="text-calm-400 text-sm">
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
          <Clock className="h-5 w-5 text-calm-600" />
          <h2 className="text-lg font-semibold text-calm-800">Recently Visited</h2>
          <span className="text-sm text-calm-500 bg-calm-100 px-2 py-1 rounded-full">
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
            className="hover:bg-calm-50 transition-colors"
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
                  <ExternalLink className="w-4 h-4 text-calm-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm font-medium text-calm-800 truncate">
                    {item.title}
                  </p>
                  
                  {/* Status Indicators */}
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {item.isCurrentlyOpen && (
                      <Square 
                        className="w-3 h-3 text-blue-500 fill-current" 
                        title="Currently open"
                      />
                    )}
                    {item.isPreviouslyStashed && (
                      <Pin 
                        className="w-3 h-3 text-green-500 fill-current" 
                        title="Previously stashed"
                      />
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-calm-500 truncate mb-1">
                  {item.url}
                </p>
                
                <div className="flex items-center justify-between text-xs text-calm-400">
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

      {/* Legend */}
      <div className="border-t border-calm-200 pt-3">
        <div className="flex items-center justify-between text-xs text-calm-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Square className="w-3 h-3 text-blue-500 fill-current" />
              <span>Currently open</span>
            </div>
            <div className="flex items-center space-x-1">
              <Pin className="w-3 h-3 text-green-500 fill-current" />
              <span>Previously stashed</span>
            </div>
          </div>
          <span>Last 7 days</span>
        </div>
      </div>
    </div>
  );
}

export default RecentlyVisited;