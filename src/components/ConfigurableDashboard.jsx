import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Plus } from 'lucide-react';
import DashboardPanel from './DashboardPanel.jsx';
import DashboardSettings from './DashboardSettings.jsx';
import QuickAccessCards from './QuickAccessCards.jsx';
import RecentlyVisited from './RecentlyVisited.jsx';
import QuickNoteCapture from './QuickNoteCapture.jsx';
import InboxPreview from './InboxPreview.jsx';
import ScheduledPreview from './ScheduledPreview.jsx';
import ArchivePreview from './ArchivePreview.jsx';
import { 
  DEFAULT_DASHBOARD_CONFIG, 
  PANEL_REGISTRY,
  validateDashboardConfig,
  migrateDashboardConfig
} from '../utils/dashboardPanels.js';
import { cn } from '../utils/cn.js';

const STORAGE_KEY = 'tabnapper_dashboard_config';

/**
 * Component mapping - maps panel component names to actual components
 */
const COMPONENT_MAP = {
  QuickAccessCards,
  RecentlyVisited,
  QuickNoteCapture,
  InboxPreview,
  ScheduledPreview,
  ArchivePreview
};

/**
 * ConfigurableDashboard - Main dashboard with draggable, configurable panels
 */
export default function ConfigurableDashboard({ onNavigate }) {
  const [config, setConfig] = useState(DEFAULT_DASHBOARD_CONFIG);
  const [showSettings, setShowSettings] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load dashboard config from storage
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        const savedConfig = result[STORAGE_KEY];
        
        if (savedConfig && validateDashboardConfig(savedConfig)) {
          const migratedConfig = migrateDashboardConfig(savedConfig);
          setConfig(migratedConfig);
        } else {
          setConfig(DEFAULT_DASHBOARD_CONFIG);
        }
      } catch (error) {
        console.error('[Dashboard] Error loading config:', error);
        setConfig(DEFAULT_DASHBOARD_CONFIG);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConfig();
  }, []);
  
  // Save config to storage whenever it changes
  const saveConfig = async (newConfig) => {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: newConfig });
      setConfig(newConfig);
      console.log('[Dashboard] Config saved:', newConfig);
    } catch (error) {
      console.error('[Dashboard] Error saving config:', error);
    }
  };
  
  // Render a single panel
  const renderPanel = (panelId, columnId) => {
    const panelConfig = PANEL_REGISTRY[panelId];
    if (!panelConfig) {
      console.warn(`[Dashboard] Unknown panel: ${panelId}`);
      return null;
    }
    
    const Component = COMPONENT_MAP[panelConfig.component];
    if (!Component) {
      console.warn(`[Dashboard] Component not found: ${panelConfig.component}`);
      return null;
    }
    
    // Get panel-specific settings or use defaults
    const panelSettings = {
      ...panelConfig.defaultSettings,
      ...(config.panelSettings?.[panelId] || {})
    };
    
    const handleRemove = () => {
      const newConfig = {
        ...config,
        columns: config.columns.map(col => 
          col.id === columnId 
            ? { ...col, panels: col.panels.filter(id => id !== panelId) }
            : col
        )
      };
      saveConfig(newConfig);
    };
    
    // Handle panel navigation (clicking title to go to full view)
    const handleNavigate = () => {
      if (!onNavigate) return;
      
      // Map panel IDs to view names
      const navigationMap = {
        inboxPreview: 'Inbox',
        scheduledPreview: 'All Scheduled',
        archivePreview: 'Archive'
      };
      
      const viewName = navigationMap[panelId];
      if (viewName) {
        onNavigate(viewName);
      }
    };
    
    return (
      <DashboardPanel
        key={panelId}
        panelId={panelId}
        title={panelConfig.hasOwnHeader ? null : panelConfig.name}
        icon={panelConfig.hasOwnHeader ? null : panelConfig.icon}
        editMode={editMode}
        onRemove={handleRemove}
        onNavigate={panelConfig.category === 'triage' ? handleNavigate : null}
      >
        <Component {...panelSettings} />
      </DashboardPanel>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-calm-500 dark:text-calm-400">Loading dashboard...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-calm-800 dark:text-calm-200">
            Dashboard
          </h1>
          <p className="text-sm text-calm-500 dark:text-calm-400 mt-1">
            Your personalized overview
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-calm-300 dark:border-calm-600 text-calm-700 dark:text-calm-300 hover:bg-calm-100 dark:hover:bg-calm-700 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium">Customize</span>
          </button>
        </div>
      </div>
      
      {/* Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {config.columns.map((column) => (
          <div key={column.id} className="space-y-6">
            {column.panels.length === 0 ? (
              <div 
                onClick={() => setShowSettings(true)}
                className="border-2 border-dashed border-calm-300 dark:border-calm-600 rounded-lg p-12 text-center cursor-pointer hover:border-calm-400 dark:hover:border-calm-500 transition-colors"
              >
                <Plus className="h-8 w-8 text-calm-400 dark:text-calm-500 mx-auto mb-3" />
                <p className="text-calm-500 dark:text-calm-400 text-sm">
                  Click to add panels
                </p>
              </div>
            ) : (
              column.panels.map(panelId => renderPanel(panelId, column.id))
            )}
          </div>
        ))}
      </div>
      
      {/* Settings Modal */}
      <DashboardSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentConfig={config}
        onSave={saveConfig}
      />
    </div>
  );
}
