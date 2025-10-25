import React from 'react';
import { Archive, Trash2, Inbox } from 'lucide-react';
import { cn } from '../utils/cn.js';
import StashCard from './StashCard.jsx';

/**
 * Unified Stash Manager View
 * Full-screen management interface for all items with tab navigation
 * Tab options: All Stashed, Inbox, Trash
 */
function StashManagerView({ 
  onNavigateBack, 
  initialFilter = 'stashed',
  inboxData = [],
  stashedTabs = [],
  trashData = [],
  onItemAction,
  onTabChange // New prop to notify parent of tab changes
}) {
  // Tab state - derived from initialFilter prop
  const activeTab = initialFilter;
  
  console.log('[StashManagerView] Rendering with:', {
    activeTab,
    inboxLength: inboxData?.length,
    stashedLength: stashedTabs?.length,
    trashLength: trashData?.length,
    inboxSample: inboxData?.[0]?.title,
    stashedSample: stashedTabs?.[0]?.title,
    trashSample: trashData?.[0]?.title
  });

  // Get current tab data
  const getCurrentData = () => {
    console.log('[StashManagerView] getCurrentData() called for tab:', activeTab);
    
    // Helper to sort items by timestamp (newest first)
    const sortByTimestamp = (items) => {
      return [...items].sort((a, b) => {
        const timeA = a.deletedAt || a.timestamp || a.capturedAt || 0;
        const timeB = b.deletedAt || b.timestamp || b.capturedAt || 0;
        return timeB - timeA; // Descending (newest first)
      });
    };
    
    switch (activeTab) {
      case 'inbox':
        console.log('[StashManagerView] Returning inbox data:', inboxData?.length, 'items');
        return {
          items: sortByTimestamp(inboxData || []),
          title: 'Inbox',
          description: 'Closed tabs and new items for you to triage and organize',
          emptyMessage: 'Your inbox is empty',
          emptyDescription: 'Closed tabs and new items will appear here for you to triage and organize.'
        };
      case 'trash':
        console.log('[StashManagerView] Returning trash data:', trashData?.length, 'items');
        return {
          items: sortByTimestamp(trashData || []),
          title: 'Trash',
          description: 'Deleted items that can be recovered',
          emptyMessage: 'Trash is empty',
          emptyDescription: 'Deleted items can be recovered from here for a limited time.'
        };
      case 'stashed':
      default:
        console.log('[StashManagerView] Returning stashed data:', stashedTabs?.length, 'items');
        return {
          items: sortByTimestamp(stashedTabs || []),
          title: 'All Stashed',
          description: 'All your saved and organized items',
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
    console.log(`[Tab Napper] ${activeTab} item clicked:`, item);
    // TODO: Implement item interaction (navigate, edit, move between lists, etc.)
  };

  const tabs = [
    { id: 'stashed', name: 'All Stashed', icon: Archive, count: counts.stashed },
    { id: 'inbox', name: 'Inbox', icon: Inbox, count: counts.inbox },
    { id: 'trash', name: 'Trash', icon: Trash2, count: counts.trash },
  ];

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="border-b border-calm-200 dark:border-calm-700 pb-5">
        <h1 className="text-2xl font-semibold text-calm-900 dark:text-calm-100">
          {currentData.title}
        </h1>
        <p className="mt-2 text-sm text-calm-500 dark:text-calm-400">
          {currentData.description}
        </p>
      </div>

      {/* Tabs with Badges */}
      <div className="border-b border-calm-200 dark:border-calm-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  // Notify parent to change view instead of using local state
                  if (onTabChange) {
                    onTabChange(tab.id);
                  }
                }}
                className={cn(
                  'group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-calm-600 dark:border-calm-400 text-calm-700 dark:text-calm-200'
                    : 'border-transparent text-calm-500 dark:text-calm-400 hover:border-calm-300 dark:hover:border-calm-600 hover:text-calm-700 dark:hover:text-calm-200'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <tab.icon
                  className={cn(
                    'mr-2 h-5 w-5',
                    isActive
                      ? 'text-calm-600 dark:text-calm-400'
                      : 'text-calm-400 dark:text-calm-500 group-hover:text-calm-500 dark:group-hover:text-calm-400'
                  )}
                  aria-hidden="true"
                />
                <span>{tab.name}</span>
                {tab.count > 0 && (
                  <span
                    className={cn(
                      'ml-3 rounded-full py-0.5 px-2.5 text-xs font-medium',
                      isActive
                        ? 'bg-calm-100 dark:bg-calm-700 text-calm-700 dark:text-calm-200'
                        : 'bg-calm-100 dark:bg-calm-800 text-calm-600 dark:text-calm-400'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div>
        {currentData.items.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 px-4">
            {activeTab === 'inbox' ? (
              <Inbox className="mx-auto h-12 w-12 text-calm-300 dark:text-calm-600" />
            ) : activeTab === 'trash' ? (
              <Trash2 className="mx-auto h-12 w-12 text-calm-300 dark:text-calm-600" />
            ) : (
              <Archive className="mx-auto h-12 w-12 text-calm-300 dark:text-calm-600" />
            )}
            <h3 className="mt-2 text-sm font-semibold text-calm-900 dark:text-calm-200">
              {currentData.emptyMessage}
            </h3>
            <p className="mt-1 text-sm text-calm-500 dark:text-calm-400">
              {currentData.emptyDescription}
            </p>
          </div>
        ) : (
          /* Items List */
          <div>
            <ul role="list" className="divide-y divide-calm-200 dark:divide-calm-700">
              {currentData.items.map((item, index) => {
                // Use index in key to guarantee uniqueness, especially for trash with duplicates
                const itemKey = `${activeTab}-${item.id || item.url || index}-${index}`;
                console.log(`[StashManagerView] Rendering item ${index} in ${activeTab}:`, {
                  key: itemKey,
                  title: item.title,
                  id: item.id,
                  url: item.url
                });
                return (
                  <li key={itemKey} className="py-4">
                    <StashCard
                      item={item}
                      onItemClick={() => handleItemClick(item)}
                      onItemAction={onItemAction}
                      showFidgetControls={activeTab !== 'trash'}
                      isTrashView={activeTab === 'trash'}
                    />
                  </li>
                );
              })}
            </ul>
            
            {currentData.items.length > 10 && (
              <div className="mt-6 text-center text-sm text-calm-500 dark:text-calm-400">
                Showing all {currentData.items.length} items
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StashManagerView;