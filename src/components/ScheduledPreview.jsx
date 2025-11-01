import React from 'react';
import { Clock, ExternalLink, Bell } from 'lucide-react';
import { useReactiveStore } from '../hooks/useReactiveStore.js';
import { navigateToUrl } from '../utils/navigation.js';
import { cn } from '../utils/cn.js';

/**
 * Scheduled Preview Panel - Shows upcoming scheduled items
 */
export default function ScheduledPreview({ maxItems = 5, showTimeUntil = true, className }) {
  const appState = useReactiveStore();
  const scheduledItems = appState?.scheduled || [];
  
  // Sort by scheduled time (earliest first)
  const sortedItems = [...scheduledItems].sort((a, b) => {
    const timeA = a.scheduledFor || a.timestamp || 0;
    const timeB = b.scheduledFor || b.timestamp || 0;
    return timeA - timeB;
  });
  
  const displayItems = sortedItems.slice(0, maxItems);
  
  const handleItemClick = async (item) => {
    if (item.url) {
      await navigateToUrl(item.url, item.title);
    }
  };
  
  const getTimeUntilText = (scheduledFor) => {
    if (!scheduledFor) return null;
    
    const now = Date.now();
    const diff = scheduledFor - now;
    
    if (diff < 0) return 'Overdue';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `in ${days}d`;
    if (hours > 0) return `in ${hours}h`;
    if (minutes > 0) return `in ${minutes}m`;
    return 'Soon';
  };
  
  if (scheduledItems.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Clock className="h-12 w-12 text-calm-300 dark:text-calm-600 mx-auto mb-3" />
        <p className="text-calm-500 dark:text-calm-400 text-sm">
          No scheduled items
        </p>
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-2', className)}>
      {displayItems.map((item) => {
        const timeUntil = getTimeUntilText(item.scheduledFor);
        const isOverdue = timeUntil === 'Overdue';
        
        return (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={cn(
              'group p-3 rounded-lg hover:bg-calm-50 dark:hover:bg-calm-800 border cursor-pointer transition-all',
              isOverdue 
                ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/20'
                : 'border-calm-200 dark:border-calm-700'
            )}
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
                <div className="flex items-center gap-2 mt-1">
                  {showTimeUntil && timeUntil && (
                    <div className={cn(
                      'flex items-center gap-1 text-xs',
                      isOverdue 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-calm-500 dark:text-calm-400'
                    )}>
                      <Bell className="h-3 w-3" />
                      <span>{timeUntil}</span>
                    </div>
                  )}
                  {item.scheduledFor && (
                    <span className="text-xs text-calm-400 dark:text-calm-500">
                      {/* Shows both date and time for scheduled items (e.g., 'Jan 5, 3:30 PM') */}
                      {new Date(item.scheduledFor).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {scheduledItems.length > maxItems && (
        <div className="text-center pt-2">
          <span className="text-sm text-calm-500 dark:text-calm-400">
            +{scheduledItems.length - maxItems} more scheduled
          </span>
        </div>
      )}
    </div>
  );
}
