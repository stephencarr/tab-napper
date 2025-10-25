import React from 'react';
import { FileText } from 'lucide-react';
import { cn } from '../utils/cn.js';
import FidgetControl from './FidgetControl.jsx';

/**
 * Unified StashCard Component
 * Structured card layout with three distinct zones for consistent display
 * across dashboard and stash manager views
 */
function StashCard({ 
  item,
  onItemClick,
  onItemAction,
  showFidgetControls = true,
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
          className="w-4 h-4 flex-shrink-0"
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

  // Special handling for notes
  const isNote = item.isNote || item.type === 'note';
  
  // Get icon - use note icon for notes, favicon for tabs
  const getIcon = () => {
    if (isNote) {
      return <FileText className="w-4 h-4 text-calm-600" />;
    }
    return getFavicon(item.url) || <div className="w-4 h-4 bg-calm-300 rounded" />;
  };

  // Get subtitle - different for notes vs tabs
  const getSubtitle = () => {
    if (isNote) {
      const wordCount = item.wordCount || (item.description ? item.description.trim().split(/\s+/).length : 0);
      return `Note • ${wordCount} words`;
    }
    return getDomain(item.url);
  };

  return (
    <div 
      className={cn(
        "w-full p-4 bg-white dark:bg-calm-800 border border-calm-200 dark:border-calm-700 rounded-lg transition-all duration-200 ease-in-out hover:border-calm-300 dark:hover:border-calm-600 hover:shadow-sm",
        onItemClick && "cursor-pointer",
        className
      )}
      onClick={onItemClick ? () => onItemClick(item) : undefined}
    >
      {/* Structured Card Layout with Three Zones */}
      <div className="flex justify-between items-start w-full">
        
        {/* Zone 1: Identity - Favicon, Title, Creation Date */}
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {/* Icon (Favicon or Note icon) */}
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* High Contrast Title */}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-calm-200 truncate">
              {item.title || item.name || 'Untitled'}
            </h3>
            
            {/* Metadata Row - Domain/Type and Time */}
            <div className="flex items-center justify-between text-xs mt-0.5">
              <span className="text-gray-500 dark:text-calm-400 truncate flex-1 mr-2">
                {getSubtitle()}
              </span>
              <span className="text-gray-400 dark:text-calm-500 flex-shrink-0">
                {getTimeAgo(item.timestamp || item.createdAt)}
              </span>
            </div>
            
            {/* Category/Type badge if available */}
            {(item.category || item.type) && (
              <div className="mt-1">
                <span className="inline-block text-xs text-calm-600 dark:text-calm-300 bg-calm-100 dark:bg-calm-750 px-2 py-0.5 rounded-full">
                  {item.category || item.type}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Zone 2 & 3: Action Block - FidgetControl with proper containment */}
        {showFidgetControls && (
          <div className="flex-shrink-0 ml-4">
            <FidgetControl
              item={item}
              onAction={onItemAction}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default StashCard;