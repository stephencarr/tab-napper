import React, { useState, useEffect } from 'react';
import { Settings, Plus, X, Save } from 'lucide-react';
import { cn } from '../utils/cn.js';
import { 
  PANEL_REGISTRY, 
  getAllPanels, 
  getPanelCategories,
  getPanelsByCategory 
} from '../utils/dashboardPanels.js';

/**
 * Dashboard Settings Modal
 * Configure which panels to show, their order, and settings
 */
export default function DashboardSettings({ 
  isOpen, 
  onClose, 
  currentConfig,
  onSave 
}) {
  const [config, setConfig] = useState(currentConfig);
  const [activeTab, setActiveTab] = useState('panels');
  
  useEffect(() => {
    if (isOpen) {
      setConfig(currentConfig);
    }
  }, [isOpen, currentConfig]);
  
  if (!isOpen) return null;
  
  // Get all panel IDs currently in use
  const activePanelIds = new Set();
  config.columns.forEach(col => {
    col.panels.forEach(panelId => activePanelIds.add(panelId));
  });
  
  // Available panels to add (not currently active)
  const availablePanels = getAllPanels().filter(panel => !activePanelIds.has(panel.id));
  
  const handleAddPanel = (panelId, columnId) => {
    setConfig(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.id === columnId 
          ? { ...col, panels: [...col.panels, panelId] }
          : col
      )
    }));
  };
  
  const handleRemovePanel = (panelId, columnId) => {
    setConfig(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.id === columnId 
          ? { ...col, panels: col.panels.filter(id => id !== panelId) }
          : col
      )
    }));
  };
  
  const handleMovePanel = (panelId, fromColumnId, toColumnId, position) => {
    setConfig(prev => {
      // Remove from source column
      const columns = prev.columns.map(col => 
        col.id === fromColumnId 
          ? { ...col, panels: col.panels.filter(id => id !== panelId) }
          : col
      );
      
      // Add to destination column at position
      return {
        ...prev,
        columns: columns.map(col => {
          if (col.id === toColumnId) {
            const panels = [...col.panels];
            panels.splice(position, 0, panelId);
            return { ...col, panels };
          }
          return col;
        })
      };
    });
  };
  
  const handleSave = () => {
    onSave(config);
    onClose();
  };
  
  const categories = getPanelCategories();
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="calm-card max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-calm-200 dark:border-calm-700">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-calm-600 dark:text-calm-400" />
            <h2 className="text-xl font-semibold text-calm-800 dark:text-calm-200">
              Dashboard Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-calm-100 dark:hover:bg-calm-700 text-calm-600 dark:text-calm-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-4 px-6 pt-4 border-b border-calm-200 dark:border-calm-700">
          <button
            onClick={() => setActiveTab('panels')}
            className={cn(
              'px-4 py-2 font-medium border-b-2 transition-colors',
              activeTab === 'panels'
                ? 'border-calm-600 dark:border-calm-400 text-calm-800 dark:text-calm-200'
                : 'border-transparent text-calm-500 dark:text-calm-400 hover:text-calm-700 dark:hover:text-calm-300'
            )}
          >
            Panel Layout
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={cn(
              'px-4 py-2 font-medium border-b-2 transition-colors',
              activeTab === 'available'
                ? 'border-calm-600 dark:border-calm-400 text-calm-800 dark:text-calm-200'
                : 'border-transparent text-calm-500 dark:text-calm-400 hover:text-calm-700 dark:hover:text-calm-300'
            )}
          >
            Add Panels
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'panels' && (
            <div className="space-y-6">
              <p className="text-sm text-calm-600 dark:text-calm-400">
                Customize your dashboard by adding, removing, or rearranging panels.
              </p>
              
              {/* Columns */}
              <div className="grid grid-cols-2 gap-6">
                {config.columns.map((column, colIndex) => (
                  <div key={column.id} className="space-y-3">
                    <h3 className="font-medium text-calm-800 dark:text-calm-200">
                      Column {colIndex + 1}
                    </h3>
                    
                    {column.panels.length === 0 ? (
                      <div className="border-2 border-dashed border-calm-300 dark:border-calm-600 rounded-lg p-8 text-center text-calm-500 dark:text-calm-400">
                        No panels in this column
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {column.panels.map((panelId) => {
                          const panel = PANEL_REGISTRY[panelId];
                          if (!panel) return null;
                          
                          const Icon = panel.icon;
                          
                          return (
                            <div
                              key={panelId}
                              className="flex items-center gap-3 p-3 rounded-lg bg-calm-100 dark:bg-calm-800 border border-calm-200 dark:border-calm-700"
                            >
                              <Icon className="h-5 w-5 text-calm-600 dark:text-calm-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-calm-800 dark:text-calm-200 truncate">
                                  {panel.name}
                                </div>
                                <div className="text-xs text-calm-500 dark:text-calm-400 truncate">
                                  {panel.description}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemovePanel(panelId, column.id)}
                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 flex-shrink-0"
                                title="Remove panel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'available' && (
            <div className="space-y-6">
              <p className="text-sm text-calm-600 dark:text-calm-400">
                Add panels to your dashboard. Click a column button to add the panel there.
              </p>
              
              {categories.map(category => {
                const panels = getPanelsByCategory(category).filter(p => !activePanelIds.has(p.id));
                if (panels.length === 0) return null;
                
                return (
                  <div key={category} className="space-y-3">
                    <h3 className="font-medium text-calm-800 dark:text-calm-200 capitalize">
                      {category}
                    </h3>
                    <div className="grid gap-3">
                      {panels.map(panel => {
                        const Icon = panel.icon;
                        
                        return (
                          <div
                            key={panel.id}
                            className="flex items-center gap-3 p-4 rounded-lg border border-calm-200 dark:border-calm-700 hover:bg-calm-50 dark:hover:bg-calm-800 transition-colors"
                          >
                            <Icon className="h-6 w-6 text-calm-600 dark:text-calm-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-calm-800 dark:text-calm-200">
                                {panel.name}
                              </div>
                              <div className="text-sm text-calm-500 dark:text-calm-400">
                                {panel.description}
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleAddPanel(panel.id, 'left')}
                                className="px-3 py-1.5 text-sm rounded-lg bg-calm-600 dark:bg-calm-500 text-white hover:bg-calm-700 dark:hover:bg-calm-600 transition-colors"
                              >
                                Column 1
                              </button>
                              <button
                                onClick={() => handleAddPanel(panel.id, 'right')}
                                className="px-3 py-1.5 text-sm rounded-lg bg-calm-600 dark:bg-calm-500 text-white hover:bg-calm-700 dark:hover:bg-calm-600 transition-colors"
                              >
                                Column 2
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              {availablePanels.length === 0 && (
                <div className="text-center py-12 text-calm-500 dark:text-calm-400">
                  All available panels are already on your dashboard
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-calm-200 dark:border-calm-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-calm-600 dark:text-calm-400 hover:bg-calm-100 dark:hover:bg-calm-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-calm-600 dark:bg-calm-500 text-white hover:bg-calm-700 dark:hover:bg-calm-600 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
