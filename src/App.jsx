import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle, CheckCircle, Loader2, Inbox, Archive, Trash2, TestTube } from 'lucide-react';
import { loadAllAppData, saveAppState, loadAppState } from './utils/storage.js';
import { getOrCreateEncryptionKey } from './utils/encryption.js';
import { addSampleData, clearSampleData, generateTestBrowsingHistory, testSmartSuggestions } from './utils/devUtils.js';
import { simulateTabCapture, setupTabCaptureListeners } from './utils/capture.js';
import { searchAllData, createDebouncedSearch } from './utils/search.js';
import { getFormattedVersion } from './utils/version.js';
import { initializeReactiveStore, subscribeToStateChanges, refreshStateFromStorage } from './utils/reactiveStore.js';
import { openNoteEditor } from './utils/navigation.js';
import { useDarkMode, toggleDarkMode } from './hooks/useDarkMode.js';
import ListContainer from './components/ListContainer.jsx';
import ListItem from './components/ListItem.jsx';
import UniversalSearch from './components/UniversalSearch.jsx';
import SearchResults from './components/SearchResults.jsx';
import RecentlyVisited from './components/RecentlyVisited.jsx';
import QuickAccessCards from './components/QuickAccessCards.jsx';
import SmartSuggestions from './components/SmartSuggestions.jsx';
import ContextualComponent from './components/ContextualComponent.jsx';
import FullStashManager from './components/FullStashManager.jsx';
import StashManagerView from './components/StashManagerView.jsx';
import DevConsole from './components/DevConsole.jsx';
import QuickNoteCapture from './components/QuickNoteCapture.jsx';
import Layout from './components/Layout.jsx';

function App() {
  // Initialize dark mode detection
  useDarkMode();
  
  const [appState, setAppState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('Dashboard'); // Sidebar-driven views
  const [stashManagerFilter, setStashManagerFilter] = useState('stashed');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // PERFORMANCE: Create debounced search function only once
  // useMemo instead of useCallback because createDebouncedSearch returns a function
  const debouncedSearch = useMemo(
    () => createDebouncedSearch(300),
    [] // Only create once on mount
  );

  // Initialize the application with reactive store
  useEffect(() => {
    let unsubscribe = null;
    
    async function initializeApp() {
      try {
        console.log('[Tab Napper] Initializing application...');
        
        // Initialize E2EE key (will create if doesn't exist)
        await getOrCreateEncryptionKey();
        console.log('[Tab Napper] Encryption key ready');
        
        // Initialize reactive store and load data
        const data = await initializeReactiveStore();
        console.log('[Tab Napper] Reactive store initialized with', {
          inbox: data.inbox?.length ?? 'undefined',
          stashedTabs: data.stashedTabs?.length ?? 'undefined',
          trash: data.trash?.length ?? 'undefined',
          quickAccessCards: data.quickAccessCards?.length ?? 'undefined'
        });
        
        // Subscribe to state changes for automatic UI updates
        unsubscribe = subscribeToStateChanges((newState) => {
          console.log('[Tab Napper] State change detected, updating UI');
          setAppState(newState);
        });

        // Set up tab capture listeners
        setupTabCaptureListeners();
        
        setAppState(data);
        setIsLoading(false);
      } catch (err) {
        console.error('[Tab Napper] Initialization error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    }

    initializeApp();
    
    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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
      // Trigger reactive state refresh
      await refreshStateFromStorage();
    } catch (err) {
      console.error('[Tab Napper] Error adding sample data:', err);
    }
  };

  // Clear sample data for testing
  const handleClearData = async () => {
    try {
      await clearSampleData();
      // Trigger reactive state refresh
      await refreshStateFromStorage();
    } catch (err) {
      console.error('[Tab Napper] Error clearing data:', err);
    }
  };

  // Handle search
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleSearchClear = () => {
    setSearchTerm('');
  };

  // Handle search result clicks
  const handleSearchResultClick = (item) => {
    console.log('[Tab Napper] Search result clicked:', item);

    // Notes: open in internal editor
    if (item.isNote || item.type === 'note') {
      openNoteEditor(item.id);
      return;
    }

    // If item has a URL, open it in a new tab
    if (item.url) {
      chrome.tabs.create({ url: item.url }, () => {
        if (chrome.runtime.lastError) {
          console.error(`[Tab Napper] Error creating tab for ${item.url}: ${chrome.runtime.lastError.message}`);
        }
      });
    } else {
      console.log('[Tab Napper] Item has no URL to open:', item);
    }
  };

  const handleTriageInbox = () => {
    console.log('[Tab Napper] Navigating to inbox triage view...');
    setCurrentView('stash-manager');
    setStashManagerFilter('inbox');
  };

  const handleNavigateBack = () => {
    setCurrentView('main');
  };

  // Handle FidgetControl actions
  const handleItemAction = async (action, item) => {
    try {
      console.log('[Tab Napper] FidgetControl action:', action, 'for item:', item);
      
      switch (action) {
        case 'delete':
          // Move item to trash
          const currentInbox = appState.inbox || [];
          const currentStashed = appState.stashedTabs || [];
          const currentTrash = appState.trash || [];
          
          // Remove from inbox or stashed
          const updatedInbox = currentInbox.filter(i => i.id !== item.id);
          const updatedStashed = currentStashed.filter(i => i.id !== item.id);
          
          // Add to trash with deletion timestamp
          const trashedItem = {
            ...item,
            deletedAt: Date.now(),
            originalLocation: currentInbox.includes(item) ? 'inbox' : 'stashed'
          };
          const updatedTrash = [...currentTrash, trashedItem];
          
          // Update storage
          await updateAppState('inbox', updatedInbox);
          await updateAppState('stashedTabs', updatedStashed);
          await updateAppState('trash', updatedTrash);
          
          console.log('[Tab Napper] Item moved to trash:', item.title);
          break;
          
        case 'remind':
        case 'follow-up':
        case 'review':
          // For now, just log the scheduled action
          // TODO: Implement reminder/scheduling system
          console.log('[Tab Napper] Scheduled action:', action, 'for item:', item.title);
          break;
          
        default:
          console.warn('[Tab Napper] Unknown FidgetControl action:', action);
      }
    } catch (error) {
      console.error('[Tab Napper] Error handling FidgetControl action:', error);
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
      
      console.log(`[Tab Napper] Simulating capture of: ${testUrl}`);

      const capturedItem = await simulateTabCapture(testUrl, testTitle);

      // Trigger reactive state refresh
      await refreshStateFromStorage();

      // Show user feedback
      console.log(`[Tab Napper] Captured: ${capturedItem.title}`);

    } catch (err) {
      console.error('[Tab Napper] Error simulating capture:', err);
    }
  };

  // Handle generating test browsing history
  const handleGenerateTestHistory = async () => {
    try {
      await generateTestBrowsingHistory();
      console.log('[Tab Napper] Test browsing history generated!');
    } catch (error) {
      console.error('[Tab Napper] Error generating test history:', error);
    }
  };

  // Handle testing smart suggestions
  const handleTestSuggestions = async () => {
    try {
      await testSmartSuggestions();
    } catch (error) {
      console.error('[Tab Napper] Error testing suggestions:', error);
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
      
      // Trigger reactive state refresh
      await refreshStateFromStorage();
      
      console.log('[Tab Napper] Added test items to stashed tabs for deduplication testing');
      console.log('Now click "Simulate Tab Capture" to see deduplication in action!');

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
      {/* Page Heading */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-calm-900 dark:text-calm-100">Dashboard</h1>
      </div>

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
    switch (currentView) {
      case 'All Stashed':
        return (
          <StashManagerView
            initialFilter="stashed"
            inboxData={appState?.inbox || []}
            stashedTabs={appState?.stashedTabs || []}
            trashData={appState?.trash || []}
            onItemAction={handleItemAction}
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
          />
        );
      case 'Dashboard':
      default:
        return renderDashboard();
    }
  };

  return (
    <Layout
      currentView={currentView}
      setCurrentView={setCurrentView}
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      onSearchClear={handleSearchClear}
    >
      {renderContent()}
      {!isSearchMode && <DevConsole isEnabled={true} />}
    </Layout>
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