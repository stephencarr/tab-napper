import React from 'react';
import { Trash2, Archive, Calendar, X, CheckSquare } from 'lucide-react';
import { cn } from '../utils/cn.js';

/**
 * Bulk Action Bar
 * Shows when items are selected, provides quick bulk operations
 */
function BulkActionBar({ 
  selectedCount, 
  totalCount,
  onSelectAll, 
  onClearSelection, 
  onTrash,
  onArchive,
  onSchedule,
  currentView,
  className 
}) {
  if (selectedCount === 0) return null;
  
  const allSelected = selectedCount === totalCount;
  
  return (
    <div className={cn(
      'sticky top-0 z-10 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
      'border-b-2 border-blue-700 dark:border-blue-800',
      'px-4 py-3 shadow-lg',
      'flex items-center justify-between gap-4',
      'animate-in slide-in-from-top duration-200',
      className
    )}>
      {/* Left: Selection info */}
      <div className="flex items-center gap-3">
        <CheckSquare className="h-5 w-5 text-white" />
        <span className="text-white font-medium">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </span>
        
        {!allSelected && (
          <button
            onClick={onSelectAll}
            className="text-xs text-blue-100 hover:text-white underline"
          >
            Select all {totalCount}
          </button>
        )}
      </div>
      
      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Trash */}
        {currentView !== 'Trash' && (
          <button
            onClick={onTrash}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-md transition-colors"
            title="Move to Trash"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-sm font-medium">Trash</span>
          </button>
        )}
        
        {/* Archive */}
        {currentView !== 'Archive' && (
          <button
            onClick={onArchive}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-md transition-colors"
            title="Move to Archive"
          >
            <Archive className="h-4 w-4" />
            <span className="text-sm font-medium">Archive</span>
          </button>
        )}
        
        {/* Schedule (only from Inbox) */}
        {currentView === 'Inbox' && (
          <button
            onClick={onSchedule}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-md transition-colors"
            title="Move to Scheduled"
          >
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Schedule</span>
          </button>
        )}
        
        {/* Clear */}
        <button
          onClick={onClearSelection}
          className="flex items-center gap-1 px-2 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
          <span className="text-sm">Clear</span>
        </button>
      </div>
    </div>
  );
}

export default BulkActionBar;
