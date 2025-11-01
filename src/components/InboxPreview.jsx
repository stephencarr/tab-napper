import React from 'react';
import { Inbox, ExternalLink } from 'lucide-react';
import { useReactiveStore } from '../hooks/useReactiveStore.js';
import { navigateToUrl } from '../utils/navigation.js';
import { cn } from '../utils/cn.js';

/**
 * Inbox Preview Panel - Shows recent unprocessed items
 */
export default function InboxPreview({ maxItems = 5, className }) {
  const appState = useReactiveStore();
  const inboxItems = appState?.inbox || [];
  
  const displayItems = inboxItems.slice(0, maxItems);
  
  const handleItemClick = async (item) => {
    if (item.url) {
      await navigateToUrl(item.url, item.title);
    }
  };
  
  if (inboxItems.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Inbox className="h-12 w-12 text-calm-300 dark:text-calm-600 mx-auto mb-3" />
        <p className="text-calm-500 dark:text-calm-400 text-sm">
          Inbox is empty
        </p>
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-2', className)}>
      {displayItems.map((item) => (
        <div
          key={item.id}
          onClick={() => handleItemClick(item)}
          className="group p-3 rounded-lg hover:bg-calm-50 dark:hover:bg-calm-800 border border-calm-200 dark:border-calm-700 cursor-pointer transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-calm-800 dark:text-calm-200 truncate">
                  {item.title || 'Untitled'}
                </span>
                {item.url && (
                  <ExternalLink className="h-3 w-3 text-calm-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                )}
              </div>
              {item.description && (
                <p className="text-sm text-calm-600 dark:text-calm-400 line-clamp-1 mt-1">
                  {item.description}
                </p>
              )}
              {item.timestamp && (
                <p className="text-xs text-calm-400 dark:text-calm-500 mt-1">
                  {new Date(item.timestamp).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {inboxItems.length > maxItems && (
        <div className="text-center pt-2">
          <span className="text-sm text-calm-500 dark:text-calm-400">
            +{inboxItems.length - maxItems} more items
          </span>
        </div>
      )}
    </div>
  );
}
