import React from 'react';
import { FileText, RotateCcw } from 'lucide-react';
import { cn } from '../utils/cn.js';
import FidgetControl from './FidgetControl.jsx';
import { navigateToUrl } from '../utils/navigation.js';

/**
 * Unified StashCard Component
 * Structured card layout with proper Tailwind UI list styling
 */
function StashCard({ 
  item,
  onItemClick,
  onItemAction,
  showFidgetControls = true,
  isTrashView = false,
  className
}) {
  // Get favicon or fallback
  const getFavicon = (url) => {
    if (!url) return null;
    try {
      const domain = new URL(url).hostname;
      return (
        <img 
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
          alt=""
          className="w-5 h-5 flex-shrink-0"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      );
    } catch {
      return null;
    }
  };

  // Get time ago string
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently added';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Get domain from URL
  const getDomain = (url) => {
    if (!url) return 'No URL';
    try {
      return new URL(url).hostname;
    } catch {
      return 'Invalid URL';
    }
  };

  // Handle navigation
  const handleNavigate = async (e) => {
    // Don't navigate if clicking on action buttons
    if (e && (e.defaultPrevented || e.target.closest('button'))) {
      return;
    }
    
    if (isNote) {
      // Open note editor
      console.log('[Tab Napper] Opening note:', item.title);
      if (onItemClick) {
        onItemClick(item);
      }
    } else if (item.url) {
      // Open URL in new tab
      console.log('[Tab Napper] Navigating to:', item.title);
      try {
        await navigateToUrl(item.url, item.title);
      } catch (error) {
        console.error('[Tab Napper] Error navigating:', error);
      }
    }
  };

  // Special handling for notes
  const isNote = item.type === 'note';
  
  // Get icon - use note icon for notes, favicon for tabs
  const getIcon = () => {
    if (isNote) {
      return <FileText className="w-5 h-5 text-calm-600 dark:text-calm-400" />;
    }
    return getFavicon(item.url) || <div className="w-5 h-5 bg-calm-300 dark:bg-calm-600 rounded" />;
  };

  // Get tags array
  const getTags = () => {
    if (item.tags && Array.isArray(item.tags)) {
      return item.tags;
    }
    if (item.category) {
      return [item.category];
    }
    if (item.type && item.type !== 'tab') {
      return [item.type];
    }
    return [];
  };

  const tags = getTags();

  return (
    <div 
      className={cn(
        "flex items-start justify-between w-full group cursor-pointer hover:bg-calm-50 dark:hover:bg-calm-800/50 -mx-4 px-4 py-3 rounded-lg transition-colors",
        className
      )}
      onClick={handleNavigate}
    >
      {/* Left side: Icon + Content */}
      <div className="flex items-start space-x-3 flex-1 min-w-0">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm font-semibold text-calm-900 dark:text-calm-100 truncate group-hover:text-calm-700 dark:group-hover:text-calm-200">
            {item.title || item.name || 'Untitled'}
          </p>
          
          {/* URL/Domain */}
          <p className="text-sm text-calm-600 dark:text-calm-400 truncate">
            {isNote 
              ? `Note • ${typeof item.wordCount === 'number' ? item.wordCount : 0} words`
              : getDomain(item.url)
            }
          </p>
          
          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-md bg-calm-100 dark:bg-calm-750 px-2 py-1 text-xs font-medium text-calm-700 dark:text-calm-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Timestamp */}
          <p className="mt-1 text-xs text-calm-500 dark:text-calm-400">
            {getTimeAgo(item.timestamp || item.createdAt)}
          </p>
        </div>
      </div>

      {/* Right side: Actions */}
      {isTrashView ? (
        /* Trash view: Show only Restore button */
        <div 
          className="flex-shrink-0 ml-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              console.log('[Tab Napper] Restoring item from trash:', item.title);
              if (onItemAction) {
                onItemAction('restore', item);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-calm-300 dark:border-calm-600 bg-white dark:bg-calm-800 text-calm-700 dark:text-calm-300 hover:bg-calm-50 dark:hover:bg-calm-750 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Restore
          </button>
        </div>
      ) : showFidgetControls ? (
        /* Normal view: Show fidget controls */
        <div 
          className="flex-shrink-0 ml-4"
          onClick={(e) => e.stopPropagation()}
        >
          <FidgetControl
            item={item}
            onAction={onItemAction}
            className="w-full"
          />
        </div>
      ) : null}
    </div>
  );
}

export default StashCard;