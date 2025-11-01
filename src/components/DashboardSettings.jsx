import React, { useState, useEffect } from 'react';
import { Settings, X, Save } from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../utils/cn.js';
import { 
  PANEL_REGISTRY, 
  getAllPanels, 
  getPanelCategories,
  getPanelsByCategory 
} from '../utils/dashboardPanels.js';
import GripIcon from './GripIcon.jsx';

/**
 * DraggedPanelOverlay - Component for rendering the dragged panel in overlay
 */
function DraggedPanelOverlay({ panelId }) {
  const panel = PANEL_REGISTRY[panelId];
  if (!panel) return null;
  const Icon = panel.icon;
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-calm-100 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 shadow-lg opacity-90">
      <div className="text-calm-400 dark:text-calm-500 flex-shrink-0">
        <GripIcon />
      </div>
      <Icon className="h-5 w-5 text-calm-600 dark:text-calm-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-calm-800 dark:text-calm-200 truncate">
          {panel.name}
        </div>
      </div>
    </div>
  );
}

/**
 * Droppable Column Component
 */
function DroppableColumn({ column, children, colIndex }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });
  
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-calm-800 dark:text-calm-200">
        Column {colIndex + 1}
      </h3>
      
      <div 
        ref={setNodeRef}
        className={cn(
          'min-h-[200px] rounded-lg p-3 transition-all',
          isOver && 'ring-2 ring-calm-400 dark:ring-calm-500 bg-calm-50 dark:bg-calm-800',
          column.panels.length === 0 && 'border-2 border-dashed border-calm-300 dark:border-calm-600 flex items-center justify-center'
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Sortable Panel Item
 */
function SortablePanel({ panelId, onRemove }) {
  const panel = PANEL_REGISTRY[panelId];
  if (!panel) return null;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: panelId });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const Icon = panel.icon;
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg bg-calm-100 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 transition-all',
        isDragging && 'opacity-50 shadow-lg z-50'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="text-calm-400 dark:text-calm-500 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripIcon />
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
        onClick={onRemove}
        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 flex-shrink-0"
        title="Remove panel"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

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
  const [activeId, setActiveId] = useState(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
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
  
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };
  
  const handleDragOver = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    // Find containers
    const activeColumn = config.columns.find(col => col.panels.includes(activeId));
    const overColumn = config.columns.find(col => 
      col.panels.includes(overId) || col.id === overId
    );
    
    if (!activeColumn || !overColumn) return;
    if (activeColumn.id === overColumn.id) return; // Same container
    
    // Move item to new container during drag
    setConfig(prev => {
      const newColumns = prev.columns.map(col => ({
        ...col,
        panels: [...col.panels]
      }));
      
      const activeCol = newColumns.find(c => c.id === activeColumn.id);
      const overCol = newColumns.find(c => c.id === overColumn.id);
      
      const activeIndex = activeCol.panels.indexOf(activeId);
      const [movedItem] = activeCol.panels.splice(activeIndex, 1);
      
      // Insert into new position
      const overIndex = overCol.panels.indexOf(overId);
      if (overIndex === -1) {
        overCol.panels.push(movedItem);
      } else {
        overCol.panels.splice(overIndex, 0, movedItem);
      }
      
      return { ...prev, columns: newColumns };
    });
  };
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    setActiveId(null);
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    const activeColumn = config.columns.find(col => col.panels.includes(activeId));
    const overColumn = config.columns.find(col => 
      col.panels.includes(overId) || col.id === overId
    );
    
    if (!activeColumn || !overColumn) return;
    
    const activeIndex = activeColumn.panels.indexOf(activeId);
    const overIndex = overColumn.panels.indexOf(overId);
    
    if (activeColumn.id === overColumn.id) {
      // Same column - reorder
      if (activeIndex !== overIndex) {
        setConfig(prev => {
          const newColumns = prev.columns.map(col => {
            if (col.id === activeColumn.id) {
              return {
                ...col,
                panels: arrayMove(col.panels, activeIndex, overIndex)
              };
            }
            return col;
          });
          return { ...prev, columns: newColumns };
        });
      }
    }
    // Cross-column move was already handled in handleDragOver
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-2 gap-6">
                  {config.columns.map((column, colIndex) => (
                    <DroppableColumn key={column.id} column={column} colIndex={colIndex}>
                      {column.panels.length === 0 ? (
                        <div className="text-center text-calm-500 dark:text-calm-400 text-sm">
                          Drag panels here or add from "Add Panels" tab
                        </div>
                      ) : (
                        <SortableContext
                          items={column.panels}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {column.panels.map((panelId) => (
                              <SortablePanel
                                key={panelId}
                                panelId={panelId}
                                onRemove={() => handleRemovePanel(panelId, column.id)}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      )}
                    </DroppableColumn>
                  ))}
                </div>
                <DragOverlay>
                  {activeId ? <DraggedPanelOverlay panelId={activeId} /> : null}
                </DragOverlay>
              </DndContext>
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
