import React from 'react';
import { ChevronRight } from 'lucide-react';
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
  onNavigate,
  isDragging = false
}) {
  return (
    <div 
      className={cn(
        'calm-card p-6 relative transition-all',
        isDragging && 'opacity-50 scale-95',
        className
      )}
    >
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
