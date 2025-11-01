import React from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '../utils/cn.js';

/**
 * DashboardPanel - Wrapper component for all dashboard panels
 * Provides consistent styling, drag-and-drop, and settings integration
 */
export default function DashboardPanel({
  panelId,
  title,
  icon: Icon,
  children,
  className,
  onRemove,
  isDragging = false,
  dragHandleProps = {},
  editMode = false
}) {
  return (
    <div 
      className={cn(
        'calm-card p-6 relative transition-all',
        isDragging && 'opacity-50 scale-95',
        editMode && 'ring-2 ring-calm-400 dark:ring-calm-500',
        className
      )}
    >
      {/* Edit Mode Controls */}
      {editMode && (
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          {/* Drag Handle */}
          <button
            className="p-1 rounded hover:bg-calm-100 dark:hover:bg-calm-700 cursor-grab active:cursor-grabbing"
            {...dragHandleProps}
            title="Drag to reorder"
          >
            <GripVertical className="h-5 w-5 text-calm-400" />
          </button>
          
          {/* Remove Button */}
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
              title="Remove panel"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
      
      {/* Panel Header */}
      {(title || Icon) && (
        <div className="flex items-center gap-2 mb-4">
          {Icon && <Icon className="h-5 w-5 text-calm-600 dark:text-calm-400" />}
          {title && (
            <h2 className="text-lg font-semibold text-calm-800 dark:text-calm-200">
              {title}
            </h2>
          )}
        </div>
      )}
      
      {/* Panel Content */}
      <div className={editMode ? 'pointer-events-none opacity-60' : ''}>
        {children}
      </div>
    </div>
  );
}
