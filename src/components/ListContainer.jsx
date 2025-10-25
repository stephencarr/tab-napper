import React from 'react';
import { Inbox, FileText } from 'lucide-react';
import { cn } from '../utils/cn.js';
import StashCard from './StashCard.jsx';

/**
 * Reusable ListContainer component for displaying lists of items
 * Gracefully handles empty states with ADHD-friendly messaging
 */
function ListContainer({
  title,
  items = [],
  emptyMessage = "No items yet",
  emptyDescription,
  icon: Icon,
  className,
  onItemClick,
  onItemAction, // New prop for FidgetControl actions
  renderItem,
  children,
  triageButton, // New prop for adding a triage button
  showFidgetControls = true, // New prop to enable/disable fidget controls
  ...props
}) {
  // Default item renderer with unified StashCard component
  const defaultRenderItem = (item, index) => (
    <StashCard
      key={item.id || index}
      item={item}
      onItemClick={onItemClick}
      onItemAction={onItemAction}
      showFidgetControls={showFidgetControls}
    />
  );

  const isEmpty = !items || items.length === 0;

  return (
    <div className={cn('space-y-4', className)} {...props}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {Icon && <Icon className="h-5 w-5 text-calm-600 dark:text-calm-400" />}
            <h2 className="text-lg font-semibold text-calm-800 dark:text-calm-200">{title}</h2>
            {!isEmpty && (
              <span className="text-sm text-calm-500 bg-calm-100 dark:bg-calm-800 dark:text-calm-400 px-2 py-1 rounded-full">
                {items.length}
              </span>
            )}
          </div>
          {/* Triage Button */}
          {triageButton && !isEmpty && (
            <div className="flex items-center">
              {triageButton}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="space-y-3 w-full">
        {isEmpty ? (
          /* Empty State */
          <div className="text-center py-12 px-6">
            <div className="mx-auto w-16 h-16 bg-calm-100 dark:bg-calm-800 rounded-full flex items-center justify-center mb-4">
              {Icon ? (
                <Icon className="h-8 w-8 text-calm-400 dark:text-calm-500" />
              ) : (
                <Inbox className="h-8 w-8 text-calm-400 dark:text-calm-500" />
              )}
            </div>
            <p className="text-calm-600 dark:text-calm-300 font-medium mb-2">{emptyMessage}</p>
            {emptyDescription && (
              <p className="text-calm-500 dark:text-calm-400 text-sm max-w-sm mx-auto leading-relaxed">
                {emptyDescription}
              </p>
            )}
          </div>
        ) : (
          /* Items List */
          <>
            {children || items.map((item, index) => 
              renderItem ? renderItem(item, index) : defaultRenderItem(item, index)
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ListContainer;