import React from 'react';
import { Search, FileText, Globe, Clock } from 'lucide-react';
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
  // Group results by type for better organization
  const groupedResults = results.reduce((groups, item) => {
    const type = item.source || 'other';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(item);
    return groups;
  }, {});

  // Get icon for result type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'inbox': return FileText;
      case 'stashedTabs': return Globe;
      case 'quickAccessCards': return Clock;
      default: return FileText;
    }
  };

  // Get type display name
  const getTypeName = (type) => {
    switch (type) {
      case 'inbox': return 'Inbox';
      case 'stashedTabs': return 'Stashed Tabs';
      case 'quickAccessCards': return 'Quick Access';
      case 'trash': return 'Trash';
      default: return 'Other';
    }
  };

  // Highlight search term in text
  const highlightText = (text, term) => {
    if (!term || !text) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Search className="h-8 w-8 animate-pulse text-calm-400 mx-auto mb-2" />
          <p className="text-calm-600">Searching...</p>
        </div>
      </div>
    );
  }

  if (!searchTerm) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 text-calm-300 mx-auto mb-4" />
        <p className="text-calm-500 text-lg mb-2">Start typing to search</p>
        <p className="text-calm-400 text-sm max-w-md mx-auto">
          Search across all your tabs, notes, and saved items to find what you need quickly.
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 text-calm-300 mx-auto mb-4" />
        <p className="text-calm-500 text-lg mb-2">No results found</p>
        <p className="text-calm-400 text-sm max-w-md mx-auto">
          Try adjusting your search terms or check if the item you're looking for has been moved to trash.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <div className="flex items-center justify-between">
        <p className="text-calm-600">
          Found <strong>{results.length}</strong> result{results.length !== 1 ? 's' : ''} for{' '}
          <strong>"{searchTerm}"</strong>
        </p>
      </div>

      {/* Grouped Results */}
      {Object.entries(groupedResults).map(([type, items]) => {
        const Icon = getTypeIcon(type);
        const typeName = getTypeName(type);

        return (
          <div key={type} className="space-y-3">
            <div className="flex items-center space-x-2">
              <Icon className="h-4 w-4 text-calm-600" />
              <h3 className="text-sm font-medium text-calm-700">
                {typeName} ({items.length})
              </h3>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <ListItem
                  key={`${type}-${item.id || index}`}
                  onClick={() => onItemClick?.(item)}
                  className="hover:bg-calm-50"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-calm-800">
                        {highlightText(item.title || item.name || 'Untitled', searchTerm)}
                      </p>
                      {item.description && (
                        <p className="text-sm text-calm-600 mt-1 line-clamp-2">
                          {highlightText(item.description, searchTerm)}
                        </p>
                      )}
                      {item.url && (
                        <p className="text-xs text-calm-500 mt-1 truncate">
                          {highlightText(item.url, searchTerm)}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-calm-400 flex-shrink-0">
                      {typeName}
                    </div>
                  </div>
                </ListItem>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SearchResults;