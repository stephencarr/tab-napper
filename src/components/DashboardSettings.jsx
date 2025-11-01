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
  const [draggedItem, setDraggedItem] = useState(null);
  
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
  
  const handleDragStart = (e, panelId, columnId) => {
    setDraggedItem({ panelId, columnId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', panelId);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e, targetColumnId, targetIndex) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    const { panelId, columnId: sourceColumnId } = draggedItem;
    
    setConfig(prev => {
      const newColumns = prev.columns.map(col => ({
        ...col,
        panels: [...col.panels]
      }));
      
      // Remove from source column
      const sourceCol = newColumns.find(col => col.id === sourceColumnId);
      const sourceIndex = sourceCol.panels.indexOf(panelId);
      sourceCol.panels.splice(sourceIndex, 1);
      
      // Add to target column at target index
      const targetCol = newColumns.find(col => col.id === targetColumnId);
      
      // Adjust target index if dropping in same column
      let adjustedIndex = targetIndex;
      if (sourceColumnId === targetColumnId && sourceIndex < targetIndex) {
        adjustedIndex--;
      }
      
      targetCol.panels.splice(adjustedIndex, 0, panelId);
      
      return { ...prev, columns: newColumns };
    });
    
    setDraggedItem(null);
  };
  
  const handleDragEnd = () => {
    setDraggedItem(null);
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
                    
                    <div 
                      className={cn(
                        'min-h-[200px] rounded-lg p-2 transition-colors',
                        column.panels.length === 0 && 'border-2 border-dashed border-calm-300 dark:border-calm-600'
                      )}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, column.id, column.panels.length)}
                    >
                      {column.panels.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center text-calm-500 dark:text-calm-400 py-12">
                          Drag panels here
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {column.panels.map((panelId, index) => {
                            const panel = PANEL_REGISTRY[panelId];
                            if (!panel) return null;
                            
                            const Icon = panel.icon;
                            const isDragging = draggedItem?.panelId === panelId;
                            
                            return (
                              <div key={panelId}>
                                <div
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, panelId, column.id)}
                                  onDragEnd={handleDragEnd}
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, column.id, index)}
                                  className={cn(
                                    'flex items-center gap-3 p-3 rounded-lg bg-calm-100 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 cursor-move transition-all',
                                    isDragging && 'opacity-40 scale-95',
                                    !isDragging && 'hover:shadow-md hover:border-calm-300 dark:hover:border-calm-600'
                                  )}
                                >
                                  <div className="text-calm-400 dark:text-calm-500 flex-shrink-0">
                                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                                      <circle cx="4" cy="4" r="1.5"/>
                                      <circle cx="12" cy="4" r="1.5"/>
                                      <circle cx="4" cy="8" r="1.5"/>
                                      <circle cx="12" cy="8" r="1.5"/>
                                      <circle cx="4" cy="12" r="1.5"/>
                                      <circle cx="12" cy="12" r="1.5"/>
                                    </svg>
                                  </div>
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
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
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
