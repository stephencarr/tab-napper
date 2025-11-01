import React from 'react';
import { GripVertical, X, ChevronRight } from 'lucide-react';
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
  onNavigate,
  isDragging = false,
  dragHandleProps = {}
}) {
  return (
    <div 
      className={cn(
        'calm-card p-6 relative transition-all',
        isDragging && 'opacity-50 scale-95',
        className
      )}
    >
      {/* Remove Button */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
          title="Remove panel"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      
      {/* Panel Header */}
      {(title || Icon) && (
        <div 
          className={cn(
            'flex items-center gap-2 mb-4',
            onNavigate && 'cursor-pointer hover:text-calm-700 dark:hover:text-calm-300 transition-colors'
          )}
          onClick={onNavigate}
          title={onNavigate ? 'Click to view full page' : undefined}
        >
          {Icon && <Icon className="h-5 w-5 text-calm-600 dark:text-calm-400" />}
          {title && (
            <h2 className="text-lg font-semibold text-calm-800 dark:text-calm-200">
              {title}
            </h2>
          )}
          {onNavigate && (
            <ChevronRight className="h-4 w-4 text-calm-400 opacity-60" />
          )}
        </div>
      )}
      
      {/* Panel Content */}
      <div>
        {children}
      </div>
    </div>
  );
}
