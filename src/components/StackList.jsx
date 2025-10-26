import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * Favicon component with error handling
 */
function FaviconIcon({ url }) {
  const [imageError, setImageError] = useState(false);
  
  const getFaviconUrl = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=16`;
    } catch {
      return null;
    }
  };
  
  const faviconUrl = getFaviconUrl(url);
  
  if (faviconUrl && !imageError) {
    return (
      <img
        src={faviconUrl}
        alt=""
        className="w-4 h-4"
        onError={() => setImageError(true)}
      />
    );
  }
  
  return <ExternalLink className="w-4 h-4 text-calm-400 dark:text-calm-500" />;
}

/**
 * Reusable Stack List Component
 * Implements Tailwind UI stack pattern for consistent list display
 * Used by RecentlyVisited, SearchResults, and other list views
 */
function StackList({ items, onItemClick, renderIcon, highlightText }) {
  // Default icon renderer if none provided
  const defaultRenderIcon = (item) => <FaviconIcon url={item.url} />;

  const iconRenderer = renderIcon || defaultRenderIcon;

  return (
    <ul role="list" className="divide-y divide-calm-200 dark:divide-calm-700">
      {items.map((item, index) => (
        <li
          key={item.id || item.url || index}
          onClick={() => onItemClick?.(item)}
          className="py-3 hover:bg-calm-50 dark:hover:bg-calm-800/50 transition-colors cursor-pointer rounded-lg px-2 -mx-2"
        >
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-1">
              {iconRenderer(item)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-calm-900 dark:text-calm-100 truncate">
                {highlightText ? highlightText(item.title || item.name || 'Untitled') : item.title || item.name || 'Untitled'}
              </p>
              
              {item.description && (
                <p className="text-xs text-calm-600 dark:text-calm-300 truncate mt-1">
                  {highlightText ? highlightText(item.description) : item.description}
                </p>
              )}
              
              {item.url && (
                <p className="text-xs text-calm-500 dark:text-calm-400 truncate mt-1">
                  {highlightText ? highlightText(item.url) : item.url}
                </p>
              )}
              
              {/* Additional metadata row */}
              {item.metadata && (
                <div className="flex items-center justify-between text-xs text-calm-400 dark:text-calm-500 mt-1">
                  {item.metadata}
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default StackList;
