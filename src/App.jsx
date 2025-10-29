import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle, CheckCircle, Loader2, Inbox, Archive, Trash2, TestTube } from 'lucide-react';
import { loadAllAppData, saveAppState, loadAppState } from './utils/storage.js';
import { getOrCreateEncryptionKey } from './utils/encryption.js';
import { addSampleData, clearSampleData, generateTestBrowsingHistory } from './utils/devUtils.js';
import { simulateTabCapture, setupTabCaptureListeners, addToTriageInbox, normalizeUrl } from './utils/capture.js';
import { searchAllData, createDebouncedSearch } from './utils/search.js';
import { getFormattedVersion } from './utils/version.js';
import { initializeReactiveStore } from './utils/reactiveStore.js';
import { openNoteEditor, navigateToUrl } from './utils/navigation.js';
import { calculateScheduledTime, setScheduledAlarm, clearScheduledAlarm, clearAllAlarmsForItem } from './utils/schedule.js';
import { autoPinCurrentTab, isCurrentTabPinned } from './utils/autoPin.js';
import { runAutoCleanup, getCleanupPreview } from './utils/autoCleanup.js';
import { useDarkMode, toggleDarkMode } from './hooks/useDarkMode.js';
import { useReactiveStore } from './hooks/useReactiveStore.js';
import { useDevMode, setupDevModeEasterEgg } from './hooks/useDevMode.js';
import ListContainer from './components/ListContainer.jsx';
import ListItem from './components/ListItem.jsx';
import UniversalSearch from './components/UniversalSearch.jsx';
import SearchResults from './components/SearchResults.jsx';
import RecentlyVisited from './components/RecentlyVisited.jsx';
import QuickAccessCards from './components/QuickAccessCards.jsx';
import ContextualComponent from './components/ContextualComponent.jsx';
import FullStashManager from './components/FullStashManager.jsx';
import StashManagerView from './components/StashManagerView.jsx';
import DevPanel from './components/DevPanel.jsx';
import QuickNoteCapture from './components/QuickNoteCapture.jsx';
import Layout from './components/Layout.jsx';

function App() {
  // Initialize dark mode detection
  useDarkMode();
  
  // Dev mode state
  const { isDevMode, toggleDevMode } = useDevMode();
  const [showDevPanel, setShowDevPanel] = useState(false);
  
  // Use the reactive store hook for guaranteed fresh data
  const appState = useReactiveStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('Dashboard'); // Sidebar-driven views
  const [stashManagerFilter, setStashManagerFilter] = useState('stashed');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Set up easter egg for dev mode
  useEffect(() => {
    const cleanup = setupDevModeEasterEgg(() => {
      toggleDevMode();
      setShowDevPanel(true);
    });
    
    // Expose dev mode toggle and cache clear globally for console access
    if (typeof window !== 'undefined') {
      window.TabNapper_toggleDevMode = () => {
        toggleDevMode();
        setShowDevPanel(true);
        console.log('🎉 Dev Mode:', !isDevMode ? 'ENABLED' : 'DISABLED');
      };
      
      // Expose auto-pin reset for debugging
      window.TabNapper_resetPin = async () => {
        const { resetPinnedFlag } = await import('./utils/autoPin.js');
        await resetPinnedFlag();
        console.log('📌 Auto-pin flag reset - next tab will pin');
      };
      
      // Expose auto-cleanup for manual triggering
      window.TabNapper_runCleanup = async () => {
        const preview = await getCleanupPreview();
        console.log('🔍 Cleanup preview:', preview);
        const stats = await runAutoCleanup(true); // Force = true for manual trigger
        console.log('✅ Cleanup complete:', stats);
        return stats;
      };
    }
    
    return cleanup;
  }, [toggleDevMode, isDevMode]);

  // PERFORMANCE: Create debounced search function only once
  // useMemo instead of useCallback because createDebouncedSearch returns a function
  const debouncedSearch = useMemo(
    () => createDebouncedSearch(300),
    [] // Only create once on mount
  );

  // Initialize the application with reactive store
  useEffect(() => {
    async function initializeApp() {
      try {
        // Initialize E2EE key (will create if doesn't exist)
        await getOrCreateEncryptionKey();
        
        // Initialize reactive store and load data
        const data = await initializeReactiveStore();

        // Set up tab capture listeners
        setupTabCaptureListeners();
        
        // Auto-pin the tab to keep Tab Napper always visible
        autoPinCurrentTab();
        
        // Run auto-cleanup (inbox > 1 week to trash, trash > 1 month deleted)
        try {
          const cleanupStats = await runAutoCleanup();
          if (cleanupStats.inboxMovedToTrash > 0 || cleanupStats.trashDeleted > 0) {
            console.log('[Tab Napper] 🧹 Auto-cleanup completed:', cleanupStats);
            
            // User-friendly notification
            if (cleanupStats.inboxMovedToTrash > 0) {
              console.log(`[Tab Napper] 📦 ${cleanupStats.inboxMovedToTrash} old inbox items moved to trash (>1 week old)`);
            }
            if (cleanupStats.trashDeleted > 0) {
              console.log(`[Tab Napper] 🗑️ ${cleanupStats.trashDeleted} items permanently deleted from trash (>1 month old)`);
            }
          }
        } catch (cleanupError) {
          console.error('[Tab Napper] Auto-cleanup failed:', cleanupError);
          // Don't block app initialization if cleanup fails
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('[Tab Napper] Initialization error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    }

    initializeApp();
  }, []);

  // Handle search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      setIsSearching(true);
      debouncedSearch(searchTerm, (results) => {
        setSearchResults(results);
        setIsSearching(false);
      });
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm, debouncedSearch]);

  // Save state changes to storage
  const updateAppState = async (key, value) => {
    try {
      const storageKey = `triageHub_${key}`;
      await saveAppState(storageKey, value);
      // Note: Reactive store will automatically update React state
    } catch (err) {
      console.error(`[Tab Napper] Error updating ${key}:`, err);
      setError(`Failed to save ${key}`);
    }
  };

  // Add sample data for testing
  const handleAddSampleData = async () => {
    try {
      await addSampleData();
      // Chrome storage listener will automatically update the reactive store
    } catch (err) {
      console.error('[Tab Napper] Error adding sample data:', err);
    }
  };

  // Clear sample data for testing
  const handleClearData = async () => {
    try {
      await clearSampleData();
      // Chrome storage listener will automatically update the reactive store
    } catch (err) {
      console.error('[Tab Napper] Error clearing data:', err);
    }
  };

  // Handle search (stabilized with useCallback to reduce rerenders downstream)
  const handleSearchChange = React.useCallback((value) => {
    setSearchTerm(value);
  }, [setSearchTerm]);

  const handleSearchClear = React.useCallback(() => {
    setSearchTerm('');
  }, []);

  // Handle search result clicks
  const handleSearchResultClick = async (item) => {
    // Notes: open in internal editor
    if (item.isNote || item.type === 'note') {
      openNoteEditor(item.id);
      return;
    }

    // If item has a URL, use navigateToUrl for consistent behavior
    // (includes duplicate tab detection and switching)
    if (item.url) {
      try {
        await navigateToUrl(item.url, item.title);
      } catch (error) {
        console.error(`[Tab Napper] Error navigating to ${item.url}:`, error);
      }
    }
  };

  const handleTriageInbox = () => {
    setCurrentView('stash-manager');
    setStashManagerFilter('inbox');
  };

  const handleNavigateBack = () => {
    setCurrentView('main');
  };

  // Handle FidgetControl actions
  const handleItemAction = async (action, item, actionData) => {
    try {
      
      switch (action) {
        case 'restore':
          // Restore item from trash back to inbox using the proper capture API
          
          // Step 1: Remove from trash
          const currentTrash = await loadAppState('triageHub_trash', []);
          const updatedTrash = currentTrash.filter(i => i.id !== item.id);
          await saveAppState('triageHub_trash', updatedTrash);
          
          // Step 2: Add to inbox using the proper API with deduplication
          // This will handle deduplication across all collections and add to top
          const restoredItem = {
            ...item,
            description: item.description || `Restored from trash`,
          };
          
          await addToTriageInbox(restoredItem);
          
          // Chrome storage listener will automatically update the reactive store
          break;
          
        case 'delete':
          // Move item to trash
          
          const currentInboxForDelete = await loadAppState('triageHub_inbox', []);
          const currentStashed = await loadAppState('triageHub_stashedTabs', []);
          const currentTrashForDelete = await loadAppState('triageHub_trash', []);
          
          
          // Remove from inbox or stashed
          const updatedInboxForDelete = currentInboxForDelete.filter(i => i.id !== item.id);
          const updatedStashed = currentStashed.filter(i => i.id !== item.id);
          
          // Clear any scheduled alarms (check all possible action types)
          console.log('[Tab Napper] Clearing any alarms for deleted item:', item.title);
          await clearAllAlarmsForItem(item);
          
          // Add to trash with deletion timestamp
          const trashedItem = {
            ...item,
            deletedAt: Date.now(),
            originalLocation: currentInboxForDelete.find(i => i.id === item.id) ? 'inbox' : 'stashed'
          };
          const updatedTrashForDelete = [...currentTrashForDelete, trashedItem];
          
          
          // Update storage
          await saveAppState('triageHub_inbox', updatedInboxForDelete);
          await saveAppState('triageHub_stashedTabs', updatedStashed);
          await saveAppState('triageHub_trash', updatedTrashForDelete);
          
          break;
          
        case 'remind_me':
        case 'follow_up':
        case 'review':
          // Stash and Schedule: Move to stashed tabs with scheduled reminder
          console.log('[Tab Napper] Scheduling item:', { action, item: item.title, actionData });
          
          // Step 1: Calculate the scheduled time
          const scheduledTime = calculateScheduledTime(actionData.when);
          console.log('[Tab Napper] Scheduled time:', new Date(scheduledTime).toLocaleString());
          
          // Step 2: If item was previously scheduled, clear the old alarm
          if (item.scheduledFor && item.scheduledAction) {
            await clearScheduledAlarm(item, item.scheduledAction);
            console.log('[Tab Napper] Cleared previous alarm');
          }
          
          // Step 3: Remove from inbox (if present)
          const currentInboxForSchedule = await loadAppState('triageHub_inbox', []);
          const updatedInboxForSchedule = currentInboxForSchedule.filter(i => i.id !== item.id);
          
          // Step 4: Update in stashed tabs with new scheduling metadata
          const currentStashedForSchedule = await loadAppState('triageHub_stashedTabs', []);
          
          // Remove old version from stashed (if it was already there)
          const filteredStashed = currentStashedForSchedule.filter(i => i.id !== item.id);
          
          const scheduledItem = {
            ...item,
            scheduledFor: scheduledTime,
            scheduledAction: action,
            scheduledWhen: actionData.when,
            stashedAt: item.stashedAt || Date.now()
          };
          const updatedStashedForSchedule = [scheduledItem, ...filteredStashed];
          
          // Step 5: Save to storage
          await saveAppState('triageHub_inbox', updatedInboxForSchedule);
          await saveAppState('triageHub_stashedTabs', updatedStashedForSchedule);
          
          // Step 6: Set new Chrome alarm
          await setScheduledAlarm(item, action, scheduledTime);
          
          console.log('[Tab Napper] ✓ Item scheduled and stashed:', item.title);
          break;
          
        default:
          console.warn('[Tab Napper] Unknown FidgetControl action:', action);
      }
    } catch (error) {
      console.error(`[Tab Napper] Error handling action '${action}':`, error);
    }
  };

  // Simulate tab capture for testing
  const handleSimulateCapture = async () => {
    try {
      // Use a fixed set of URLs that might duplicate
      const testUrls = [
        'https://developer.mozilla.org/en-US/docs/Web/API',
        'https://react.dev/learn',
        'https://tailwindcss.com/docs'
      ];
      
      // Cycle through URLs to increase chance of duplicates
      const urlIndex = appState.inbox.length % testUrls.length;
      const testUrl = testUrls[urlIndex];
      const testTitle = `Test Tab ${urlIndex + 1} - ${new Date().toLocaleTimeString()}`;
      
      const capturedItem = await simulateTabCapture(testUrl, testTitle);

      // Chrome storage listener will automatically update the reactive store

    } catch (err) {
      console.error('[Tab Napper] Error simulating capture:', err);
    }
  };

  // Handle generating test browsing history
  const handleGenerateTestHistory = async () => {
    try {
      await generateTestBrowsingHistory();
    } catch (error) {
      console.error('[Tab Napper] Error generating test history:', error);
    }
  };

  // Add items to stashed tabs to test deduplication
  const handleSetupDedupeTest = async () => {
    try {
      const testStashedItems = [
        {
          id: 'stashed-test-1',
          title: 'MDN Web API Documentation (OLD VERSION)',
          description: 'This should be removed when we capture the same URL',
          url: 'https://developer.mozilla.org/en-US/docs/Web/API',
          timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
          type: 'learning'
        },
        {
          id: 'stashed-test-2', 
          title: 'React Learning Guide (OLD VERSION)',
          description: 'This should be removed when we capture the same URL',
          url: 'https://react.dev/learn',
          timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
          type: 'learning'
        }
      ];
      
      await saveAppState('triageHub_stashedTabs', testStashedItems);
      
      // Chrome storage listener will automatically update the reactive store

    } catch (err) {
      console.error('[Tab Napper] Error setting up dedupe test:', err);
    }
  };

  // Determine if we're in search mode
  const isSearchMode = searchTerm.trim().length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-calm-50 dark:bg-calm-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-calm-600 dark:text-calm-400 mx-auto mb-4" />
          <p className="text-calm-600 dark:text-calm-300 text-lg">Initializing Tab Napper...</p>
          <p className="text-calm-400 dark:text-calm-500 text-sm mt-2">Setting up encryption and loading your data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-calm-50 dark:bg-calm-900 flex items-center justify-center">
        <div className="calm-card p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-center mb-4 text-calm-800 dark:text-calm-200">Initialization Error</h1>
          <p className="text-calm-600 dark:text-calm-300 text-center mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="calm-button-primary w-full px-4 py-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Routing logic
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <div className="calm-card p-6">
            <QuickNoteCapture onNoteSaved={() => {}} />
          </div>
          <div className="calm-card p-6">
            <RecentlyVisited maxItems={10} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="calm-card p-6">
            <QuickAccessCards maxItems={6} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isSearchMode) {
      return (
        <SearchResults
          searchTerm={searchTerm}
          results={searchResults}
          isLoading={isSearching}
          onItemClick={handleSearchResultClick}
        />
      );
    }
    
    // Handler for tab changes within StashManagerView
    const handleTabChange = (tabId) => {
      
      // Map tab IDs to view names
      const tabToViewMap = {
        'stashed': 'All Stashed',
        'inbox': 'Inbox',
        'trash': 'Trash'
      };
      const newView = tabToViewMap[tabId];
      if (newView) {
        setCurrentView(newView);
      }
    };
    
    switch (currentView) {
      case 'All Stashed':
        return (
          <StashManagerView
            initialFilter="stashed"
            inboxData={appState?.inbox || []}
            stashedTabs={appState?.stashedTabs || []}
            trashData={appState?.trash || []}
            onItemAction={handleItemAction}
            onTabChange={handleTabChange}
          />
        );
      case 'Inbox':
        return (
          <StashManagerView
            initialFilter="inbox"
            inboxData={appState?.inbox || []}
            stashedTabs={appState?.stashedTabs || []}
            trashData={appState?.trash || []}
            onItemAction={handleItemAction}
            onTabChange={handleTabChange}
          />
        );
      case 'Trash':
        return (
          <StashManagerView
            initialFilter="trash"
            inboxData={appState?.inbox || []}
            stashedTabs={appState?.stashedTabs || []}
            trashData={appState?.trash || []}
            onItemAction={handleItemAction}
            onTabChange={handleTabChange}
          />
        );
      case 'Dashboard':
      default:
        return renderDashboard();
    }
  };

  return (
    <>
      <Layout
        currentView={currentView}
        setCurrentView={setCurrentView}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        searchLoading={isSearching}
      >
        {renderContent()}
      </Layout>
      
      {/* Dev Panel - Only show when dev mode is enabled */}
      {isDevMode && (
        <>
          <DevPanel 
            isOpen={showDevPanel}
            onClose={() => setShowDevPanel(false)}
          />
          
          {/* Floating Dev Mode Toggle */}
          <button
            onClick={() => setShowDevPanel(!showDevPanel)}
            className="fixed bottom-4 left-4 p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-40 group"
            title="Toggle Developer Panel"
          >
            <TestTube className="h-5 w-5" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Dev Panel
            </span>
          </button>
        </>
      )}
    </>
  );
}

// Simple wrapper that conditionally renders the contextual card
function ContextualCardWrapper() {
  const [hasContent, setHasContent] = useState(false);
  
  // Use effect to check for contextual content periodically
  useEffect(() => {
    const checkContextual = async () => {
      try {
        // This is a simplified check - in a real implementation you'd want to
        // share state or use a context, but for now we'll just check if there's potential content
        const stashedTabs = await loadAppState('triageHub_stashedTabs') || [];
        setHasContent(stashedTabs.length > 0);
      } catch (error) {
        setHasContent(false);
      }
    };
    
    checkContextual();
    const interval = setInterval(checkContextual, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Don't render the card at all if there's no potential for contextual content
  if (!hasContent) {
    return null;
  }
  
  return (
    <div className="calm-card p-6">
      <ContextualComponent />
    </div>
  );
}

export default App;