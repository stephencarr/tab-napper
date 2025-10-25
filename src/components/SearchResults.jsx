import React from 'react';
import { Search, FileText, Globe, Clock, History } from 'lucide-react';
import ListContainer from './ListContainer.jsx';
import ListItem from './ListItem.jsx';

/**
 * Search Results component for displaying filtered results
 * Shows results from all data sources in a unified view
 */
function SearchResults({ 
  searchTerm, 
  results = [], 
  onItemClick,
  isLoading = false 
}) {
  // Define the priority order for result segments
  const segmentOrder = ['inbox', 'stashedTabs', 'quickAccessCards', 'recentHistory', 'trash'];
  
  // Group results by type for better organization with priority ordering
  const groupedResults = results.reduce((groups, item) => {
    const type = item.source || 'other';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(item);
    return groups;
  }, {});

  // Sort segments by priority order, then by item relevance within each segment
  const orderedSegments = segmentOrder
    .filter(type => groupedResults[type] && groupedResults[type].length > 0)
    .map(type => [type, groupedResults[type].sort((a, b) => b.relevance - a.relevance)]);

  // Get icon for result type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'inbox': return FileText;
      case 'stashedTabs': return Globe;
      case 'quickAccessCards': return Clock;
      case 'recentHistory': return History;
      case 'trash': return FileText;
      default: return FileText;
    }
  };

  // Get type display name with priority indicators
  const getTypeName = (type) => {
    switch (type) {
      case 'inbox': return 'Inbox';
      case 'stashedTabs': return 'Stashed Tabs';
      case 'quickAccessCards': return 'Quick Access';
      case 'recentHistory': return 'Browser History';
      case 'trash': return 'Trash';
      default: return 'Other';
    }
  };

  // Get type color for visual hierarchy
  const getTypeColor = (type) => {
    switch (type) {
      case 'inbox': return 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/40';
      case 'stashedTabs': return 'text-green-600 bg-green-50 dark:text-green-300 dark:bg-green-900/40';
      case 'quickAccessCards': return 'text-purple-600 bg-purple-50 dark:text-purple-300 dark:bg-purple-900/40';
      case 'recentHistory': return 'text-gray-600 bg-gray-50 dark:text-gray-300 dark:bg-gray-800/40';
      case 'trash': return 'text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-900/40';
      default: return 'text-gray-600 bg-gray-50 dark:text-gray-300 dark:bg-gray-800/40';
    }
  };

  // Highlight search term in text
  const highlightText = (text, term) => {
    if (!term || !text) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 dark:bg-yellow-700 dark:text-yellow-100 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Search className="h-8 w-8 animate-pulse text-calm-400 dark:text-calm-500 mx-auto mb-2" />
          <p className="text-calm-600 dark:text-calm-300">Searching...</p>
        </div>
      </div>
    );
  }

  if (!searchTerm) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 text-calm-300 dark:text-calm-600 mx-auto mb-4" />
        <p className="text-calm-500 dark:text-calm-300 text-lg mb-2">Start typing to search</p>
        <p className="text-calm-400 dark:text-calm-500 text-sm max-w-md mx-auto">
          Search across all your tabs, notes, and saved items to find what you need quickly.
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 text-calm-300 dark:text-calm-600 mx-auto mb-4" />
        <p className="text-calm-500 dark:text-calm-300 text-lg mb-2">No results found</p>
        <p className="text-calm-400 dark:text-calm-500 text-sm max-w-md mx-auto">
          Try adjusting your search terms or check if the item you're looking for has been moved to trash.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <div className="flex items-center justify-between">
        <p className="text-calm-600 dark:text-calm-300">
          Found <strong>{results.length}</strong> result{results.length !== 1 ? 's' : ''} for{' '}
          <strong>"{searchTerm}"</strong>
        </p>
        {results.length > 0 && (
          <p className="text-xs text-calm-500 dark:text-calm-400">
            Showing: {orderedSegments.map(([type, items]) => 
              `${getTypeName(type)} (${items.length})`
            ).join(', ')}
          </p>
        )}
      </div>

      {/* Scrollable Results Container */}
      <div className="max-h-[calc(100vh-16rem)] overflow-y-auto pr-2 space-y-6">
        {/* Ordered Segments with Priority */}
        {orderedSegments.map(([type, items]) => {
          const Icon = getTypeIcon(type);
          const typeName = getTypeName(type);
          const typeColor = getTypeColor(type);

          return (
            <div key={type} className="space-y-3">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${typeColor}`}>
                <Icon className="h-4 w-4" />
                <h3 className="text-sm font-semibold">
                  {typeName} ({items.length})
                </h3>
                {type === 'inbox' && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    High Priority
                  </span>
                )}
                {type === 'stashedTabs' && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Saved
                  </span>
                )}
              </div>

              {/* Tailwind UI Stack List */}
              <ul role="list" className="divide-y divide-calm-200 dark:divide-calm-700">
                {items.map((item, index) => (
                  <li
                    key={`${type}-${item.id || index}`}
                    onClick={() => onItemClick?.(item)}
                    className="py-3 hover:bg-calm-50 dark:hover:bg-calm-800/50 transition-colors cursor-pointer rounded-lg px-2 -mx-2 border-l-4 border-transparent hover:border-calm-400 dark:hover:border-calm-500"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-calm-900 dark:text-calm-100">
                          {highlightText(item.title || item.name || 'Untitled', searchTerm)}
                        </p>
                        {item.description && (
                          <p className="text-sm text-calm-600 dark:text-calm-300 mt-1 line-clamp-2">
                            {highlightText(item.description, searchTerm)}
                          </p>
                        )}
                        {item.url && (
                          <p className="text-xs text-calm-500 dark:text-calm-400 mt-1 truncate">
                            {highlightText(item.url, searchTerm)}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-calm-400 dark:text-calm-500 flex-shrink-0 flex flex-col items-end">
                        <span>{typeName}</span>
                        <span className="text-xs text-calm-300 dark:text-calm-600">
                          Score: {item.relevance?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      {results.length > 0 && (
        <div className="text-xs text-calm-400 dark:text-calm-500 text-center pt-4 border-t border-calm-100 dark:border-calm-700">
          Results are ordered by relevance within each category.
          Inbox and Stashed items appear first for quick access.
        </div>
      )}
    </div>
  );
}

export default SearchResults;