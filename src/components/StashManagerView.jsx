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
    <div className="min-h-screen bg-calm-25">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onNavigateBack}
              className="flex items-center space-x-2 text-calm-600 hover:text-calm-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Tab Napper</span>
            </button>
            <div className="h-6 w-px bg-calm-300"></div>
            <div className="flex items-center space-x-3">
              <Filter className="h-6 w-6 text-calm-600" />
              <h1 className="text-2xl font-semibold text-calm-900">Item Manager</h1>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-calm-200 w-fit">
            <button
              onClick={() => setActiveFilter('stashed')}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                activeFilter === 'stashed'
                  ? 'bg-calm-600 text-white shadow-sm'
                  : 'text-calm-700 hover:text-calm-900 hover:bg-calm-50'
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
                  : 'text-calm-700 hover:text-calm-900 hover:bg-calm-50'
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
                  : 'text-calm-700 hover:text-calm-900 hover:bg-calm-50'
              )}
            >
              <Trash2 className="h-4 w-4" />
              <span>View Trash ({counts.trash})</span>
            </button>
          </div>
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
              <h3 className="text-lg font-medium text-calm-700 mb-2">{currentData.emptyMessage}</h3>
              <p className="text-calm-500 max-w-md mx-auto">
                {currentData.emptyDescription}
              </p>
              <button
                onClick={onNavigateBack}
                className="mt-6 px-4 py-2 bg-calm-600 text-white rounded-lg hover:bg-calm-700 transition-colors"
              >
                Go back to Tab Napper
              </button>
            </div>
          ) : (
            /* Items List */
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-calm-800">{currentData.title}</h2>
                <div className="flex items-center space-x-2 text-sm text-calm-500">
                  <span>Sorted by date added</span>
                </div>
              </div>
              
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {currentData.items.map((item, index) => (
                  <StashCard
                    key={item.id || item.url || index}
                    item={item}
                    onItemClick={() => handleItemClick(item)}
                    onItemAction={onItemAction}
                    showFidgetControls={true}
                  />
                ))}
              </div>
              
              {currentData.items.length > 10 && (
                <div className="mt-6 text-center text-sm text-calm-500">
                  Showing all {currentData.items.length} {activeFilter} items
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StashManagerView;