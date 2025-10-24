import React from 'react';
import { cn } from '../utils/cn.js';

/**
 * Reusable ListItem component for displaying individual items
 * Follows ADHD-friendly design principles with calm styling
 */
function ListItem({ 
  children, 
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
    'bg-white',
    'border',
    'border-calm-200',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'ease-in-out',
    'text-left'            // Ensure left alignment for buttons
  ];

  const interactiveClasses = onClick ? [
    'cursor-pointer',
    'hover:border-calm-300',
    'hover:shadow-sm',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-calm-400',
    'focus:ring-offset-2'
  ] : [];

  const stateClasses = [
    isSelected ? 'border-calm-400 bg-calm-50' : '',
    isDisabled ? 'opacity-50 cursor-not-allowed' : ''
  ];

  const allClasses = cn(
    ...baseClasses,
    ...interactiveClasses,
    ...stateClasses,
    className
  );

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={allClasses}
      onClick={!isDisabled ? onClick : undefined}
      disabled={isDisabled}
      {...props}
    >
      {children}
    </Component>
  );
}

export default ListItem;