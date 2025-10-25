import React from 'react';
import { cn } from '../utils/cn.js';

/**
 * Reusable ListItem component for displaying individual items
 * Follows ADHD-friendly design principles with calm styling
 * Supports both children pattern and structured props pattern
 */
function ListItem({ 
  children, 
  title,
  subtitle,
  icon,
  badge,
  actions,
  onClick, 
  className,
  isSelected = false,
  isDisabled = false,
  ...props 
}) {
  const baseClasses = [
    'group',
    'w-full',              // Ensure full width
    'p-4',
    'bg-white dark:bg-calm-800',
    'border',
    'border-calm-200 dark:border-calm-700',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'ease-in-out',
    'text-left'            // Ensure left alignment for buttons
  ];

  const interactiveClasses = onClick ? [
    'cursor-pointer',
    'hover:border-calm-300 dark:hover:border-calm-600',
    'hover:shadow-sm',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-calm-400 dark:focus:ring-calm-500',
    'focus:ring-offset-2 dark:focus:ring-offset-calm-800'
  ] : [];

  const stateClasses = [
    isSelected ? 'border-calm-400 bg-calm-50 dark:bg-calm-750' : '',
    isDisabled ? 'opacity-50 cursor-not-allowed' : ''
  ];

  const allClasses = cn(
    ...baseClasses,
    ...interactiveClasses,
    ...stateClasses,
    className
  );

  const Component = onClick ? 'button' : 'div';

  // Render structured content if title prop is provided, otherwise use children
  const content = title ? (
    <div className="flex items-start space-x-3 w-full">
      {/* Icon */}
      {icon && (
        <div className="flex-shrink-0 mt-1">
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-calm-800 dark:text-calm-200 truncate">
            {title}
          </h3>
          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            {badge && badge}
            {actions && actions}
          </div>
        </div>
        
        {subtitle && (
          <div className="text-xs text-calm-500 dark:text-calm-400">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  ) : children;

  return (
    <Component
      className={allClasses}
      onClick={!isDisabled ? onClick : undefined}
      disabled={isDisabled}
      {...props}
    >
      {content}
    </Component>
  );
}

export default ListItem;