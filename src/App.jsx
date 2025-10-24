import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { loadAllAppData, saveAppState } from './utils/storage.js';
import { getOrCreateEncryptionKey } from './utils/encryption.js';

function App() {
  const [appState, setAppState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize the application
  useEffect(() => {
    async function initializeApp() {
      try {
        console.log('[Triage Hub] Initializing application...');
        
        // Initialize E2EE key (will create if doesn't exist)
        await getOrCreateEncryptionKey();
        console.log('[Triage Hub] Encryption key ready');
        
        // Load all application data
        const data = await loadAllAppData();
        console.log('[Triage Hub] Application data loaded:', data);
        
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
              <h2 className="text-lg font-semibold text-calm-800 mb-4">Quick Access</h2>
              <div className="space-y-3">
                {appState.quickAccessCards.length === 0 ? (
                  <p className="text-calm-500 text-sm">No quick access cards yet</p>
                ) : (
                  appState.quickAccessCards.map((card, index) => (
                    <div key={index} className="p-3 bg-calm-50 rounded-lg">
                      <p className="text-sm font-medium text-calm-700">{card.title}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Triage Inbox */}
          <div className="lg:col-span-2">
            <div className="calm-card p-6">
              <h2 className="text-lg font-semibold text-calm-800 mb-4">Triage Inbox</h2>
              <div className="space-y-3">
                {appState.inbox.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-calm-500 mb-2">Your inbox is empty</p>
                    <p className="text-calm-400 text-sm">Closed tabs and new items will appear here</p>
                  </div>
                ) : (
                  appState.inbox.map((item, index) => (
                    <div key={index} className="p-4 bg-calm-50 rounded-lg">
                      <p className="text-sm font-medium text-calm-700">{item.title}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Data Overview for Development */}
        <div className="mt-8 calm-card p-6">
          <h3 className="text-lg font-semibold text-calm-800 mb-4">Data Overview (Development)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-calm-700">Inbox Items:</span>
              <span className="ml-2 text-calm-600">{appState.inbox.length}</span>
            </div>
            <div>
              <span className="font-medium text-calm-700">Stashed Tabs:</span>
              <span className="ml-2 text-calm-600">{appState.stashedTabs.length}</span>
            </div>
            <div>
              <span className="font-medium text-calm-700">Trash Items:</span>
              <span className="ml-2 text-calm-600">{appState.trash.length}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;