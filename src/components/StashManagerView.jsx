import React, { useState, useEffect } from 'react';
import { ArrowLeft, Archive, Trash2, Inbox, Filter } from 'lucide-react';
import { cn } from '../utils/cn.js';
import StashCard from './StashCard.jsx';

/**
 * Unified Stash Manager View
 * Full-screen management interface for all items with filtering
 * Filter options: All Stashed, Inbox, Trash
 */
function StashManagerView({ 
  onNavigateBack, 
  initialFilter = 'stashed',
  inboxData = [],
  stashedTabs = [],
  trashData = [],
  onItemAction // New prop for handling FidgetControl actions
}) {
  // Filter state
  const [activeFilter, setActiveFilter] = useState(initialFilter);

  // Set initial filter from prop
  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  // Get current filter data
  const getCurrentData = () => {
    switch (activeFilter) {
      case 'inbox':
        return {
          items: inboxData || [],
          title: 'Inbox Items',
          emptyMessage: 'Your inbox is empty',
          emptyDescription: 'Closed tabs and new items will appear here for you to triage and organize.'
        };
      case 'trash':
        return {
          items: trashData || [],
          title: 'Trash Items',
          emptyMessage: 'Trash is empty',
          emptyDescription: 'Deleted items can be recovered from here for a limited time.'
        };
      case 'stashed':
      default:
        return {
          items: stashedTabs || [],
          title: 'Stashed Items',
          emptyMessage: 'No stashed items yet',
          emptyDescription: 'Items you stash from the triage inbox will appear here for organized management.'
        };
    }
  };

  const currentData = getCurrentData();
  const counts = {
    stashed: (stashedTabs || []).length,
    inbox: (inboxData || []).length,
    trash: (trashData || []).length
  };

  const handleItemClick = (item) => {
    console.log(`[Tab Napper] ${activeFilter} item clicked:`, item);
    // TODO: Implement item interaction (navigate, edit, move between lists, etc.)
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex items-center space-x-2 bg-white dark:bg-calm-800 p-2 rounded-lg border border-calm-200 dark:border-calm-700 w-fit">
        <button
          onClick={() => setActiveFilter('stashed')}
          className={cn(
            'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeFilter === 'stashed'
              ? 'bg-calm-600 text-white shadow-sm'
              : 'text-calm-700 hover:text-calm-900 hover:bg-calm-50 dark:text-calm-300 dark:hover:text-calm-100 dark:hover:bg-calm-700'
          )}
        >
          <Archive className="h-4 w-4" />
          <span>All Stashed ({counts.stashed})</span>
        </button>
        
        <button
          onClick={() => setActiveFilter('inbox')}
          className={cn(
            'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeFilter === 'inbox'
              ? 'bg-calm-600 text-white shadow-sm'
              : 'text-calm-700 hover:text-calm-900 hover:bg-calm-50 dark:text-calm-300 dark:hover:text-calm-100 dark:hover:bg-calm-700'
          )}
        >
          <Inbox className="h-4 w-4" />
          <span>Inbox ({counts.inbox})</span>
        </button>
        
        <button
          onClick={() => setActiveFilter('trash')}
          className={cn(
            'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeFilter === 'trash'
              ? 'bg-calm-600 text-white shadow-sm'
              : 'text-calm-700 hover:text-calm-900 hover:bg-calm-50 dark:text-calm-300 dark:hover:text-calm-100 dark:hover:bg-calm-700'
          )}
        >
          <Trash2 className="h-4 w-4" />
          <span>View Trash ({counts.trash})</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="calm-card">
        {currentData.items.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center">
            {activeFilter === 'inbox' ? (
              <Inbox className="h-16 w-16 mx-auto text-calm-300 mb-4" />
            ) : activeFilter === 'trash' ? (
              <Trash2 className="h-16 w-16 mx-auto text-calm-300 mb-4" />
            ) : (
              <Archive className="h-16 w-16 mx-auto text-calm-300 mb-4" />
            )}
            <h3 className="text-lg font-medium text-calm-700 dark:text-calm-300 mb-2">{currentData.emptyMessage}</h3>
            <p className="text-calm-500 dark:text-calm-400 max-w-md mx-auto">
              {currentData.emptyDescription}
            </p>
          </div>
        ) : (
          /* Items List */
          <div className="p-6">
            <div className="sm:flex sm:items-center mb-6">
              <div className="sm:flex-auto">
                <h2 className="text-lg font-medium text-calm-900 dark:text-calm-200">{currentData.title}</h2>
                <p className="mt-1 text-sm text-calm-500 dark:text-calm-400">
                  Sorted by date added
                </p>
              </div>
            </div>
            
            <ul role="list" className="divide-y divide-calm-200 dark:divide-calm-700 max-h-[70vh] overflow-y-auto">
              {currentData.items.map((item, index) => (
                <li key={item.id || item.url || index} className="-mx-2 px-2">
                  <StashCard
                    item={item}
                    onItemClick={() => handleItemClick(item)}
                    onItemAction={onItemAction}
                    showFidgetControls={true}
                  />
                </li>
              ))}
            </ul>
            
            {currentData.items.length > 10 && (
              <div className="mt-6 text-center text-sm text-calm-500 dark:text-calm-400">
                Showing all {currentData.items.length} {activeFilter} items
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StashManagerView;