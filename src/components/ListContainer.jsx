import React from 'react';
import { Inbox, FileText } from 'lucide-react';
import { cn } from '../utils/cn.js';
import ListItem from './ListItem.jsx';

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
  renderItem,
  children,
  ...props
}) {
  // Default item renderer if none provided
  const defaultRenderItem = (item, index) => (
    <ListItem 
      key={item.id || index}
      onClick={onItemClick ? () => onItemClick(item, index) : undefined}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-calm-800 truncate">
            {item.title || item.name || 'Untitled'}
          </p>
          {item.description && (
            <p className="text-sm text-calm-600 mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
          {item.url && (
            <p className="text-xs text-calm-500 mt-1 truncate">
              {item.url}
            </p>
          )}
        </div>
        {item.timestamp && (
          <div className="text-xs text-calm-400">
            {new Date(item.timestamp).toLocaleDateString()}
          </div>
        )}
      </div>
    </ListItem>
  );

  const isEmpty = !items || items.length === 0;

  return (
    <div className={cn('space-y-4', className)} {...props}>
      {/* Header */}
      {title && (
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="h-5 w-5 text-calm-600" />}
          <h2 className="text-lg font-semibold text-calm-800">{title}</h2>
          {!isEmpty && (
            <span className="text-sm text-calm-500 bg-calm-100 px-2 py-1 rounded-full">
              {items.length}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="space-y-3 w-full">
        {isEmpty ? (
          /* Empty State */
          <div className="text-center py-12 px-6">
            <div className="mx-auto w-16 h-16 bg-calm-100 rounded-full flex items-center justify-center mb-4">
              {Icon ? (
                <Icon className="h-8 w-8 text-calm-400" />
              ) : (
                <Inbox className="h-8 w-8 text-calm-400" />
              )}
            </div>
            <p className="text-calm-600 font-medium mb-2">{emptyMessage}</p>
            {emptyDescription && (
              <p className="text-calm-500 text-sm max-w-sm mx-auto leading-relaxed">
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