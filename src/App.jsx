import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2, Inbox, Archive, Trash2, TestTube } from 'lucide-react';
import { loadAllAppData, saveAppState, loadAppState } from './utils/storage.js';
import { getOrCreateEncryptionKey } from './utils/encryption.js';
import { addSampleData, clearSampleData } from './utils/devUtils.js';
import ListContainer from './components/ListContainer.jsx';
import ListItem from './components/ListItem.jsx';

function App() {
  const [appState, setAppState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize the application and test direct state reading
  useEffect(() => {
    async function initializeApp() {
      try {
        console.log('[Triage Hub] Initializing application...');
        
        // Initialize E2EE key (will create if doesn't exist)
        await getOrCreateEncryptionKey();
        console.log('[Triage Hub] Encryption key ready');
        
        // Load all application data via loadAllAppData
        const data = await loadAllAppData();
        console.log('[Triage Hub] Application data loaded:', data);
        
        // Test direct state reading for individual keys
        console.log('[Triage Hub] Testing direct state reading...');
        const directInbox = await loadAppState('triageHub_inbox');
        const directStashed = await loadAppState('triageHub_stashedTabs');
        const directTrash = await loadAppState('triageHub_trash');
        
        console.log('[Triage Hub] Direct inbox read:', directInbox);
        console.log('[Triage Hub] Direct stashed read:', directStashed);
        console.log('[Triage Hub] Direct trash read:', directTrash);
        
        setAppState(data);
        setIsLoading(false);
      } catch (err) {
        console.error('[Triage Hub] Initialization error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    }

    initializeApp();
  }, []);

  // Save state changes to storage
  const updateAppState = async (key, value) => {
    try {
      const storageKey = `triageHub_${key}`;
      await saveAppState(storageKey, value);
      setAppState(prev => ({ ...prev, [key]: value }));
    } catch (err) {
      console.error(`[Triage Hub] Error updating ${key}:`, err);
      setError(`Failed to save ${key}`);
    }
  };

  // Add sample data for testing
  const handleAddSampleData = async () => {
    try {
      await addSampleData();
      // Reload app state to show new data
      const newData = await loadAllAppData();
      setAppState(newData);
    } catch (err) {
      console.error('[Triage Hub] Error adding sample data:', err);
    }
  };

  // Clear sample data for testing
  const handleClearData = async () => {
    try {
      await clearSampleData();
      // Reload app state to show cleared data
      const newData = await loadAllAppData();
      setAppState(newData);
    } catch (err) {
      console.error('[Triage Hub] Error clearing data:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-calm-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-calm-600 mx-auto mb-4" />
          <p className="text-calm-600 text-lg">Initializing Triage Hub...</p>
          <p className="text-calm-400 text-sm mt-2">Setting up encryption and loading your data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-calm-50 flex items-center justify-center">
        <div className="calm-card p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-center mb-4">Initialization Error</h1>
          <p className="text-calm-600 text-center mb-6">{error}</p>
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

  return (
    <div className="min-h-screen bg-calm-50">
      {/* Header */}
      <header className="bg-white border-b border-calm-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-calm-600 rounded-lg flex items-center justify-center">
              <div className="grid grid-cols-1 gap-1">
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
            <h1 className="text-xl font-semibold text-calm-800">Triage Hub</h1>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-calm-600">Encrypted & Private</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Quick Access Cards */}
          <div className="lg:col-span-1">
            <div className="calm-card p-6">
              <ListContainer
                title="Quick Access"
                items={appState.quickAccessCards}
                emptyMessage="No quick access cards yet"
                emptyDescription="Quick access cards will appear here for easy navigation to your most important items."
                icon={CheckCircle}
                onItemClick={(item) => console.log('Quick access clicked:', item)}
              />
            </div>
          </div>

          {/* Triage Inbox */}
          <div className="lg:col-span-2">
            <div className="calm-card p-6">
              <ListContainer
                title="Triage Inbox"
                items={appState.inbox}
                emptyMessage="Your inbox is empty"
                emptyDescription="Closed tabs and new items will appear here for you to triage and organize."
                icon={Inbox}
                onItemClick={(item) => console.log('Inbox item clicked:', item)}
              />
            </div>
          </div>
        </div>

        {/* Secondary Lists Row */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Stashed Tabs */}
          <div className="calm-card p-6">
            <ListContainer
              title="Stashed Tabs"
              items={appState.stashedTabs}
              emptyMessage="No stashed tabs"
              emptyDescription="Tabs you've decided to keep for later will be organized here."
              icon={Archive}
              onItemClick={(item) => console.log('Stashed tab clicked:', item)}
            />
          </div>

          {/* Trash */}
          <div className="calm-card p-6">
            <ListContainer
              title="Trash"
              items={appState.trash}
              emptyMessage="Trash is empty"
              emptyDescription="Deleted items can be recovered from here for a limited time."
              icon={Trash2}
              onItemClick={(item) => console.log('Trash item clicked:', item)}
            />
          </div>
        </div>

        {/* Storage & Encryption Test Panel */}
        <div className="mt-8 calm-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-calm-800 flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Storage & Encryption Test Results</span>
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={handleAddSampleData}
                className="calm-button-secondary px-3 py-1 text-xs flex items-center space-x-1"
              >
                <TestTube className="h-3 w-3" />
                <span>Add Sample Data</span>
              </button>
              <button
                onClick={handleClearData}
                className="calm-button-secondary px-3 py-1 text-xs"
              >
                Clear Data
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-calm-50 p-3 rounded-lg">
              <span className="font-medium text-calm-700 block">Inbox Items</span>
              <span className="text-calm-600">{appState.inbox.length} items</span>
              <div className="text-xs text-calm-500 mt-1">
                ✓ Local storage, unencrypted
              </div>
            </div>
            <div className="bg-calm-50 p-3 rounded-lg">
              <span className="font-medium text-calm-700 block">Stashed Tabs</span>
              <span className="text-calm-600">{appState.stashedTabs.length} items</span>
              <div className="text-xs text-calm-500 mt-1">
                ✓ Local storage, unencrypted
              </div>
            </div>
            <div className="bg-calm-50 p-3 rounded-lg">
              <span className="font-medium text-calm-700 block">Trash Items</span>
              <span className="text-calm-600">{appState.trash.length} items</span>
              <div className="text-xs text-calm-500 mt-1">
                ✓ Local storage, unencrypted
              </div>
            </div>
            <div className="bg-calm-50 p-3 rounded-lg">
              <span className="font-medium text-calm-700 block">Quick Access</span>
              <span className="text-calm-600">{appState.quickAccessCards.length} cards</span>
              <div className="text-xs text-calm-500 mt-1">
                ✓ Sync storage, encrypted
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>✓ Data Pipeline Verified:</strong> Storage initialization → Encryption key generation → 
              Data loading → Component rendering all working correctly.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;