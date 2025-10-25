import React, { useMemo, useCallback } from 'react';
import { Star, ExternalLink, Clock, PinOff, Pin } from 'lucide-react';
import { saveAppState } from '../utils/storage.js';
import { useReactiveStorage } from '../utils/reactiveStorage.js';
import { navigateToUrl } from '../utils/navigation.js';
import { unpinItem } from '../utils/smartSuggestions.js';
import { cn } from '../utils/cn.js';
import ListItem from './ListItem.jsx';

/**
 * Quick Access Cards component for the Right Column
 * Displays frequently accessed items from chrome.storage.sync
 */
function QuickAccessCards({ className, maxItems = 6 }) {
  const { data: quickAccessData, isLoading, error } = useReactiveStorage('triageHub_quickAccessCards', []);

  // PERFORMANCE: Use useMemo to avoid re-sorting on every render
  const quickAccessItems = useMemo(() => {
    if (!quickAccessData) return [];

    // IMPORTANT: Spread operator [...array] creates a copy before sorting
    // This is necessary because sort() mutates arrays, and we must not
    // mutate data from useReactiveStorage (React immutability principle).
    // Without the spread, we'd be mutating the reactive storage state.
    return [...quickAccessData]
      .sort((a, b) => {
        // Primary sort: access count (descending)
        if (b.accessCount !== a.accessCount) {
          return b.accessCount - a.accessCount;
        }
        // Secondary sort: last accessed time (descending)
        return b.lastAccessed - a.lastAccessed;
      })
      .slice(0, maxItems);
  }, [quickAccessData, maxItems]);

  // Handle clicking on a quick access item
  const handleQuickAccessClick = async (item) => {
    console.log('[Tab Napper] ⭐ Quick access item clicked:', {
      title: item.title,
      url: item.url,
      accessCount: item.accessCount
    });

    try {
      // Navigate to the URL
      const result = await navigateToUrl(item.url, item.title);
      
      if (result.action === 'switched') {
        console.log('[Tab Napper] ✅ Successfully switched to existing tab');
      } else if (result.action === 'created') {
        console.log('[Tab Napper] ✅ Successfully opened new tab');
      }
      
      // Update access count and last accessed time
      await updateAccessCount(item);
      
    } catch (error) {
      console.error('[Tab Napper] ❌ Error navigating to quick access URL:', error);
    }
  };

  // Handle unpinning an item
  const handleUnpinItem = async (item, event) => {
    event.stopPropagation(); // Prevent triggering the click handler
    
    console.log('[Tab Napper] 📌 Unpinning item:', item.title);
    
    try {
      await unpinItem(item.id);
      console.log('[Tab Napper] ✅ Successfully unpinned item');
    } catch (error) {
      console.error('[Tab Napper] ❌ Error unpinning item:', error);
    }
  };

  // Update access count for an item
  const updateAccessCount = useCallback(async (item) => {
    try {
      // PERFORMANCE: Use the reactive data we already have, don't reload it
      if (!Array.isArray(quickAccessData)) {
        console.error('[Tab Napper] ❌ Cannot update access count: quickAccessData is not a valid array for item', { 
          id: item?.id, 
          title: item?.title, 
          url: item?.url,
          quickAccessDataType: typeof quickAccessData,
          quickAccessDataLength: (quickAccessData && typeof quickAccessData === 'object')
            ? Object.keys(quickAccessData).length
            : undefined
        });
        return;
      }

      const updatedData = quickAccessData.map(accessItem => {
        if (accessItem.id === item.id) {
          return {
            ...accessItem,
            accessCount: (accessItem.accessCount || 0) + 1,
            lastAccessed: Date.now()
          };
        }
        return accessItem;
      });

      // Save back to storage - reactiveStorage will update UI automatically
      await saveAppState('triageHub_quickAccessCards', updatedData);

    } catch (error) {
      console.error('[Tab Napper] Error updating access count:', error);
    }
  }, [quickAccessData]);

  // Get favicon URL with better error handling
  const getFaviconUrl = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return null;
    }
  };

  // Render favicon with fallback
  const renderFavicon = (url) => {
    const faviconUrl = getFaviconUrl(url);
    if (!faviconUrl) {
      return <Star className="h-4 w-4 text-amber-500" />;
    }

    return (
      <img
        src={faviconUrl}
        alt=""
        className="h-4 w-4"
        onError={(e) => {
          // Replace with star icon on error
          const starIcon = document.createElement('div');
          starIcon.innerHTML = `<svg class="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>`;
          e.target.replaceWith(starIcon.firstChild);
        }}
        onLoad={() => {
          // Favicon loaded successfully - no need to log every favicon
        }}
      />
    );
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

  // Only show loading shimmers if we're actually loading and have never loaded data
  if (isLoading && quickAccessData === null) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-calm-500 dark:text-calm-400" />
            <h2 className="text-lg font-medium text-calm-900 dark:text-calm-200">Quick Access</h2>
          </div>
          <div className="animate-pulse">
            <Star className="h-4 w-4 text-calm-400 dark:text-calm-500" />
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-calm-100 dark:bg-calm-700 rounded-lg"></div>
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
            <Star className="h-5 w-5 text-calm-500" />
            <h2 className="text-lg font-medium text-calm-900">Quick Access</h2>
          </div>
        </div>
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-calm-500" />
          <h2 className="text-lg font-medium text-calm-900">Quick Access</h2>
          {quickAccessItems.length > 0 && (
            <span className="text-xs text-calm-500 bg-calm-100 px-2 py-1 rounded-full">
              {quickAccessItems.length}
            </span>
          )}
        </div>
      </div>

      {quickAccessItems.length === 0 ? (
        <div className="text-center py-8 text-calm-500">
          <Star className="h-8 w-8 mx-auto mb-3 text-calm-300" />
          <p className="text-sm font-medium mb-1">No quick access cards yet</p>
          <p className="text-xs text-calm-400">
            Items you access frequently will appear here for quick navigation
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {quickAccessItems.map((item) => (
            <ListItem
              key={item.id}
              title={item.title}
              subtitle={
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-calm-500">
                    <span className="truncate">
                      {item.url ? new URL(item.url).hostname : 'Unknown'}
                    </span>
                    <div className="flex items-center space-x-2 ml-2">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{getTimeAgo(item.lastAccessed)}</span>
                      </span>
                      <span className="text-amber-600 font-medium">
                        {item.accessCount || 0}×
                      </span>
                    </div>
                  </div>
                  {item.type === 'smart-suggestion' && (
                    <div className="text-xs text-emerald-600 flex items-center space-x-1">
                      <Pin className="h-3 w-3" />
                      <span>Smart suggestion</span>
                    </div>
                  )}
                </div>
              }
              icon={
                item.url ? renderFavicon(item.url) : <Star className="h-4 w-4 text-amber-500" />
              }
              onClick={() => {
                console.log(`[Tab Napper] Quick access item clicked: ${item.title}`);
                handleQuickAccessClick(item);
              }}
              className="hover:bg-amber-50 border-amber-200 hover:border-amber-300 transition-colors cursor-pointer group"
              badge={
                item.accessCount > 5 ? (
                  <div className="flex items-center space-x-1 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                    <Star className="h-3 w-3" />
                    <span>Frequently Used</span>
                  </div>
                ) : null
              }
              actions={
                <button
                  onClick={(e) => handleUnpinItem(item, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-amber-600 hover:text-amber-700 hover:bg-amber-100 rounded"
                  title="Unpin from Quick Access"
                >
                  <PinOff className="h-4 w-4" />
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default QuickAccessCards;