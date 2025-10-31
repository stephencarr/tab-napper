import React, { useMemo, useState, useEffect } from 'react';
import { Archive, Trash2, Inbox, Filter, X, Copy, ExternalLink, Pin, RefreshCw } from 'lucide-react';
import { cn } from '../utils/cn.js';
import StashCard from './StashCard.jsx';
import BulkActionBar from './BulkActionBar.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { useOpenTabs } from '../hooks/useOpenTabs.js';
import { useBulkActions } from '../hooks/useBulkActions.js';
import { useConfirm } from '../hooks/useConfirm.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { closeOpenTabs, findAndCloseDuplicateTabs } from '../utils/navigation.js';

/**
 * Unified Scheduled Manager View
 * Full-screen management interface for all items with tab navigation
 * Phase 2: Enhanced with filter and bulk actions
 * Tab options: All Scheduled, Inbox, Trash
 */
function StashManagerView({ 
  initialFilter = 'scheduled',
  inboxData = [],
  scheduledData = [],
  archiveData = [],
  trashData = [],
  onItemAction,
  onTabChange // New prop to notify parent of tab changes
}) {
  // Tab state - derived from initialFilter prop
  const activeTab = initialFilter;
  
  // Phase 2: Filter state
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  
  // Phase 2: Duplicate tabs state
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  
  // Toast and confirmation hooks
  const { toast } = useToast();
  const { confirm, confirmProps } = useConfirm();
  
  // Combine all items for open tab detection
  const allItems = useMemo(
    () => [...inboxData, ...scheduledData, ...archiveData, ...trashData],
    [inboxData, scheduledData, archiveData, trashData]
  );
  
  // Track which items are currently open (polls every 10 seconds + real-time events)
  const { isOpen, openItemIds, uniqueTabCount, refreshOpenTabs, isChecking } = useOpenTabs(allItems, 10000, true);
  
  // Bulk actions hook
  const {
    selectedCount,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    getSelectedIds
  } = useBulkActions();
  
  // Force initial check when view changes or when component mounts
  useEffect(() => {
    console.log('[Tab Napper] View changed or mounted, forcing open tabs check...');
    refreshOpenTabs();
  }, [activeTab, refreshOpenTabs]); // Re-check when switching between inbox/stashed/trash or refreshOpenTabs changes
  
  // Clear selections when tab changes (fixes context issue)
  useEffect(() => {
    clearSelection();
  }, [activeTab, clearSelection]);
  
  // Phase 2: Check for duplicate tabs - only run on manual trigger or view change
  // Don't tie to openItemIds to avoid excessive checks
  useEffect(() => {
    const checkDuplicates = async () => {
      if (activeTab === 'trash' || activeTab === 'archive') {
        setDuplicateCount(0);
        return;
      }

      setIsCheckingDuplicates(true);
      try {
        const dryRun = await findAndCloseDuplicateTabs({ keepNewest: true, dryRun: true });
        setDuplicateCount(
          Array.isArray(dryRun.duplicates)
            ? dryRun.duplicates.reduce((sum, dup) => sum + (dup.closedTabs?.length || 0), 0)
            : 0
        );
      } catch (error) {
        console.error('[Tab Napper] Error checking duplicates:', error);
        setDuplicateCount(0);
      } finally {
        setIsCheckingDuplicates(false);
      }
    };

    checkDuplicates();
  }, [activeTab]); // Only re-check when view changes, not on every tab event
  

  // Get current tab data
  const getCurrentData = () => {
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
        return {
          items: sortByTimestamp(inboxData || []),
          title: 'Inbox',
          description: 'Closed tabs and new items for you to triage and organize',
          emptyMessage: 'Your inbox is empty',
          emptyDescription: 'Closed tabs and new items will appear here for you to triage and organize.'
        };
      case 'archive':
        return {
          items: sortByTimestamp(archiveData || []),
          title: 'Archive',
          description: 'Completed and archived items',
          emptyMessage: 'Archive is empty',
          emptyDescription: 'Completed items will appear here. Archived items remain searchable and can be unarchived at any time.'
        };
      case 'trash':
        return {
          items: sortByTimestamp(trashData || []),
          title: 'Trash',
          description: 'Deleted items that can be recovered',
          emptyMessage: 'Trash is empty',
          emptyDescription: 'Deleted items can be recovered from here for a limited time.'
        };
      case 'scheduled':
      default:
        return {
          items: sortByTimestamp(scheduledData || []),
          title: 'All Scheduled',
          description: 'All your saved and organized items',
          emptyMessage: 'No scheduled items yet',
          emptyDescription: 'Items you schedule from the triage inbox will appear here for organized management.'
        };
    }
  };

  const currentData = getCurrentData();
  
  // Phase 2: Apply open filter if enabled
  const filteredItems = useMemo(() => {
    if (!showOnlyOpen) {
      return currentData.items;
    }
    return currentData.items.filter(item => isOpen(item));
  }, [currentData.items, showOnlyOpen, isOpen]);
  
  const counts = {
    scheduled: (scheduledData || []).length,
    inbox: (inboxData || []).length,
    archive: (archiveData || []).length,
    trash: (trashData || []).length
  };
  
  // Phase 2: Handle bulk close action
  const handleCloseAllOpen = async () => {
    // Get ALL open items across all views, not just current view
    const allOpenItems = allItems.filter(item => openItemIds.has(item.id));
    
    console.log('[Tab Napper] DEBUG Close All:', {
      activeTab,
      currentViewItems: currentData.items.length,
      allOpenItems: allOpenItems.length,
      uniqueTabCount: uniqueTabCount,
      openItemIds: Array.from(openItemIds),
      allItemsCount: allItems.length,
      inboxCount: inboxData.length,
      stashedCount: scheduledData.length
    });
    
    if (allOpenItems.length === 0) {
      console.log('[Tab Napper] No open items found to close');
      toast.warning('No Open Tabs', 'No tabs found to close. The items may not be currently open in your browser.');
      return;
    }
    
    // Use uniqueTabCount for the user-facing message
    const tabWord = uniqueTabCount === 1 ? 'tab' : 'tabs';
    
    await confirm({
      title: `Close ${uniqueTabCount} Open ${tabWord.charAt(0).toUpperCase() + tabWord.slice(1)}?`,
      message: `This will close all open tabs matching your saved items, regardless of which list they're in.\n\n(Pinned tabs will be preserved)`,
      type: 'warning',
      confirmText: 'Close All',
      cancelText: 'Cancel',
      onConfirm: async () => {
        console.log('[Tab Napper] 🗑️ Closing all open tabs...');
        const result = await closeOpenTabs(allOpenItems);
        
        console.log(`[Tab Napper] ✅ Closed ${result.closed} tabs`);
        if (result.skipped > 0) {
          console.log(`[Tab Napper] 📌 Preserved ${result.skipped} pinned tabs`);
        }
        if (result.failed > 0) {
          console.warn(`[Tab Napper] ⚠️ Failed to close ${result.failed} tabs`);
        }

        // Show result toast
        if (result.closed > 0) {
          let message = `Closed ${result.closed} ${result.closed === 1 ? 'tab' : 'tabs'}`;
          if (result.skipped > 0) {
            message += ` • Preserved ${result.skipped} pinned`;
          }
          toast.success('Tabs Closed', message);
        } else {
          toast.warning('No Tabs Closed', 'All matching tabs were pinned and preserved.');
        }

        // Refresh the open tabs status
        await refreshOpenTabs();
      }
    });
  };
  
  // Phase 2: Handle duplicate cleanup
  const handleFindDuplicates = async () => {
    if (duplicateCount === 0) {
      toast.info('No Duplicates', 'No duplicate tabs found.');
      return;
    }
    
    await confirm({
      title: 'Close Duplicate Tabs',
      message: `Found duplicate tabs open.\n\nThis will close ${duplicateCount} duplicate tabs, keeping the newest of each.\n\n(Pinned tabs will always be preserved)`,
      type: 'warning',
      confirmText: 'Close Duplicates',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          console.log('[Tab Napper] 🔍 Closing duplicate tabs...');
          
          const result = await findAndCloseDuplicateTabs({ keepNewest: true, dryRun: false });
          
          console.log(`[Tab Napper] ✅ Closed ${result.closed} duplicate tabs`);
          if (result.skipped > 0) {
            console.log(`[Tab Napper] 📌 Preserved ${result.skipped} pinned tabs`);
          }
          
          // Show result toast
          if (result.closed > 0) {
            let message = `Closed ${result.closed} duplicate ${result.closed === 1 ? 'tab' : 'tabs'}. Kept newest for each URL.`;
            if (result.skipped > 0) {
              message += ` Preserved ${result.skipped} pinned.`;
            }
            toast.success('Duplicates Removed', message);
          } else {
            toast.info('No Duplicates Closed', 'All duplicate tabs were pinned and preserved.');
          }
          
          // Refresh open status and duplicate count
          await refreshOpenTabs();
          setDuplicateCount(0);
        } catch (error) {
          console.error('[Tab Napper] Error finding duplicates:', error);
          toast.error('Error', `Failed to close duplicates: ${error.message}`);
        }
      }
    });
  };

  const handleItemClick = (item) => {
    // TODO: Implement item interaction (navigate, edit, move between lists, etc.)
  };
  
  // Bulk action handlers
  const handleBulkTrash = async () => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;
    
    await confirm({
      title: 'Move to Trash',
      message: `Move ${ids.length} ${ids.length === 1 ? 'item' : 'items'} to Trash?`,
      type: 'warning',
      confirmText: 'Move to Trash',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          for (const id of ids) {
            const item = allItems.find(i => i.id === id);
            if (item) {
              await onItemAction?.(item, 'delete');
            }
          }
          toast.success('Moved to Trash', `${ids.length} ${ids.length === 1 ? 'item' : 'items'} moved to trash`);
          clearSelection();
        } catch (error) {
          console.error('[Tab Napper] Error in bulk trash:', error);
          toast.error('Action Failed', 'Failed to move items to trash');
        }
      }
    });
  };
  
  const handleBulkArchive = async () => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;
    
    await confirm({
      title: 'Move to Archive',
      message: `Move ${ids.length} ${ids.length === 1 ? 'item' : 'items'} to Archive?`,
      type: 'info',
      confirmText: 'Move to Archive',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          for (const id of ids) {
            const item = allItems.find(i => i.id === id);
            if (item) {
              await onItemAction?.(item, 'mark_done'); // mark_done moves to archive
            }
          }
          toast.success('Moved to Archive', `${ids.length} ${ids.length === 1 ? 'item' : 'items'} archived`);
          clearSelection();
        } catch (error) {
          console.error('[Tab Napper] Error in bulk archive:', error);
          toast.error('Action Failed', 'Failed to move items to archive');
        }
      }
    });
  };
  
  const handleBulkSchedule = async () => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;
    
    await confirm({
      title: 'Move to Scheduled',
      message: `Move ${ids.length} ${ids.length === 1 ? 'item' : 'items'} to Scheduled?`,
      type: 'info',
      confirmText: 'Schedule',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          for (const id of ids) {
            const item = allItems.find(i => i.id === id);
            if (item) {
              await onItemAction?.(item, 'remind_me', { when: 'Later' });
            }
          }
          toast.success('Moved to Scheduled', `${ids.length} ${ids.length === 1 ? 'item' : 'items'} scheduled`);
          clearSelection();
        } catch (error) {
          console.error('[Tab Napper] Error in bulk schedule:', error);
          toast.error('Action Failed', 'Failed to schedule items');
        }
      }
    });
  };
  
  const handleBulkRestore = async () => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;
    
    await confirm({
      title: 'Restore to Inbox',
      message: `Restore ${ids.length} ${ids.length === 1 ? 'item' : 'items'} to Inbox?`,
      type: 'info',
      confirmText: 'Restore',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          for (const id of ids) {
            const item = allItems.find(i => i.id === id);
            if (item) {
              await onItemAction?.(item, 'restore');
            }
          }
          toast.success('Restored to Inbox', `${ids.length} ${ids.length === 1 ? 'item' : 'items'} restored`);
          clearSelection();
        } catch (error) {
          console.error('[Tab Napper] Error in bulk restore:', error);
          toast.error('Action Failed', 'Failed to restore items');
        }
      }
    });
  };

  const tabs = [
    { id: 'scheduled', name: 'All Scheduled', icon: Archive, count: counts.scheduled },
    { id: 'inbox', name: 'Inbox', icon: Inbox, count: counts.inbox },
    { id: 'archive', name: 'Archive', icon: Archive, count: counts.archive },
    { id: 'trash', name: 'Trash', icon: Trash2, count: counts.trash },
  ];

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      <ConfirmDialog {...confirmProps} />
      
      {/* Page Heading */}
      <div className="border-b border-calm-200 dark:border-calm-700 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-calm-900 dark:text-calm-100">
              {currentData.title}
            </h1>
            <p className="mt-2 text-sm text-calm-500 dark:text-calm-400">
              {currentData.description}
            </p>
          </div>
          
          {/* Manual Refresh Button */}
          {activeTab !== 'trash' && (
            <button
              onClick={() => {
                console.log('[Tab Napper] Manual refresh triggered');
                refreshOpenTabs();
              }}
              disabled={isChecking}
              title="Refresh open tabs detection"
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-calm-300 dark:border-calm-600 bg-white dark:bg-calm-800 text-calm-700 dark:text-calm-300 hover:bg-calm-50 dark:hover:bg-calm-750 transition-colors",
                isChecking && "opacity-50 cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("h-4 w-4", isChecking && "animate-spin")} />
              {isChecking ? 'Checking...' : 'Refresh'}
            </button>
          )}
        </div>
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
            {/* Phase 2: Filter and Bulk Action Controls */}
            {(openItemIds.size > 0 || duplicateCount > 0) && activeTab !== 'trash' && (
              <div className="mb-4 space-y-3">
                {/* Open items banner */}
                {openItemIds.size > 0 && (
                  <div className="flex items-center justify-between gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-green-700 dark:text-green-400" />
                      <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                        {uniqueTabCount} {uniqueTabCount === 1 ? 'tab' : 'tabs'} open in browser
                      </span>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Filter toggle */}
                      <button
                        onClick={() => setShowOnlyOpen(!showOnlyOpen)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
                          showOnlyOpen
                            ? "bg-green-100 dark:bg-green-800 border-green-300 dark:border-green-600 text-green-800 dark:text-green-200"
                            : "bg-white dark:bg-calm-800 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
                        )}
                      >
                        <Filter className="h-3 w-3" />
                        {showOnlyOpen ? `Showing ${filteredItems.length}` : 'Show Only'}
                      </button>
                      
                      {/* Close All button */}
                      <button
                        onClick={handleCloseAllOpen}
                        title="Close all open tabs matching your saved items (pinned tabs will be preserved)"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-red-300 dark:border-red-700 bg-white dark:bg-calm-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <X className="h-3 w-3" />
                        Close All
                        <Pin className="h-2.5 w-2.5 opacity-60" />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Duplicate tabs banner */}
                {duplicateCount > 0 && (
                  <div className="flex items-center justify-between gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Copy className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                      <span className="text-sm text-purple-700 dark:text-purple-400 font-medium">
                        {duplicateCount} duplicate {duplicateCount === 1 ? 'tab' : 'tabs'} detected
                      </span>
                    </div>
                    
                    {/* Close Duplicates button */}
                    <button
                      onClick={handleFindDuplicates}
                      disabled={isCheckingDuplicates}
                      title="Close duplicate tabs (pinned tabs will be preserved)"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-purple-300 dark:border-purple-700 bg-white dark:bg-calm-800 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Copy className="h-3 w-3" />
                      Close Duplicates
                      <Pin className="h-2.5 w-2.5 opacity-60" />
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Bulk Action Bar */}
            <BulkActionBar
              selectedCount={selectedCount}
              totalCount={filteredItems.length}
              onSelectAll={() => selectAll(filteredItems)}
              onClearSelection={clearSelection}
              onTrash={handleBulkTrash}
              onArchive={handleBulkArchive}
              onSchedule={handleBulkSchedule}
              onRestore={handleBulkRestore}
              currentView={currentData.title}
            />
            
            <ul role="list" className="divide-y divide-calm-200 dark:divide-calm-700">
              {filteredItems.map((item, index) => {
                // Use a stable key based on id or url; deduplication is handled in storage
                const itemKey = `${activeTab}-${item.id || item.url}`;
                return (
                  <li key={itemKey} className="py-4">
                    <StashCard
                      item={item}
                      onItemClick={() => handleItemClick(item)}
                      onItemAction={onItemAction}
                      showFidgetControls={activeTab !== 'trash'}
                      isTrashView={activeTab === 'trash'}
                      isArchiveView={activeTab === 'archive'}
                      isScheduledView={activeTab === 'scheduled'}
                      isCurrentlyOpen={isOpen(item)}
                      showCheckbox={true}
                      isSelected={isSelected(item.id)}
                      onToggleSelect={toggleSelection}
                    />
                  </li>
                );
              })}
            </ul>
            
            {filteredItems.length > 10 && (
              <div className="mt-6 text-center text-sm text-calm-500 dark:text-calm-400">
                Showing {showOnlyOpen ? `${filteredItems.length} open items` : `all ${currentData.items.length} items`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StashManagerView;