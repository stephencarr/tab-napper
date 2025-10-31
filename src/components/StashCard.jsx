import React, { useState, useMemo, useEffect } from 'react';
import { FileText, RotateCcw, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '../utils/cn.js';
import FidgetControl from './FidgetControl.jsx';
import { navigateToUrl, openNoteEditor, findOpenTab } from '../utils/navigation.js';
import { getDetailedScheduledTime } from '../utils/schedule.js';

/**
 * Unified StashCard Component
 * Structured card layout with proper Tailwind UI list styling
 */
function StashCard({ 
  item,
  onItemClick,
  onItemAction,
  showFidgetControls = true,
  isTrashView = false,
  isArchiveView = false,
  isScheduledView = false,
  isCurrentlyOpen = false,
  // Bulk actions support
  showCheckbox = false,
  isSelected = false,
  onToggleSelect,
  className
}) {
  // Track whether we're showing reschedule controls for scheduled items
  const [showingReschedule, setShowingReschedule] = useState(false);
  // Track celebration animation for marking done
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Reset reschedule state when item changes
  useEffect(() => {
    setShowingReschedule(false);
    setShowCelebration(false);
  }, [item.id]);
  
  // Check if item is scheduled (memoized for performance)
  const isScheduled = useMemo(
    () => item.scheduledFor && !showingReschedule,
    [item.scheduledFor, showingReschedule]
  );
  
  // Check if scheduled item is past due
  const isPastDue = useMemo(
    () => isScheduled && item.scheduledFor < Date.now(),
    [isScheduled, item.scheduledFor]
  );
  // Get favicon or fallback
  const getFavicon = (url) => {
    if (!url) return null;
    try {
      const domain = new URL(url).hostname;
      return (
        <img 
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
          alt=""
          className="w-5 h-5 flex-shrink-0"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      );
    } catch {
      return null;
    }
  };

  // Get time ago string
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently added';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Get domain from URL
  const getDomain = (url) => {
    if (!url) return 'No URL';
    try {
      return new URL(url).hostname;
    } catch {
      return 'Invalid URL';
    }
  };

  // Handle navigation
  const handleNavigate = async (e) => {
    // Don't navigate if clicking on action buttons
    if (
      e &&
      (e.defaultPrevented ||
        e.target.tagName === 'BUTTON' ||
        (e.target.closest('button') && e.target.closest('button') !== e.currentTarget))
    ) {
      return;
    }
    
    if (isNote) {
      // Open note editor
      console.log('[Tab Napper] Opening note:', item.title, item.id);
      try {
        await openNoteEditor(item.id);
      } catch (error) {
        console.error('[Tab Napper] Error opening note:', error);
      }
    } else if (item.url) {
      // Phase 2: Smart navigation - switch to tab if already open
      if (isCurrentlyOpen) {
        console.log('[Tab Napper] 🔄 Tab already open, switching to it:', item.title);
        try {
          const openTab = await findOpenTab(item.url);
          if (openTab) {
            await chrome.tabs.update(openTab.id, { active: true });
            await chrome.windows.update(openTab.windowId, { focused: true });
            console.log('[Tab Napper] ✅ Switched to existing tab');
            return;
          }
        } catch (error) {
          console.error('[Tab Napper] Error switching to tab, falling back to navigation:', error);
        }
      }
      
      // Regular navigation (opens new tab or reuses existing)
      console.log('[Tab Napper] Navigating to:', item.title);
      try {
        await navigateToUrl(item.url, item.title);
      } catch (error) {
        console.error('[Tab Napper] Error navigating:', error);
      }
    }
  };

  // Special handling for notes
  const isNote = item.type === 'note';
  
  // Check if item is archived (has archivedAt timestamp)
  const isArchived = useMemo(() => !!item.archivedAt, [item.archivedAt]);
  
  // Get icon - use note icon for notes, favicon for tabs
  const getIcon = () => {
    if (isNote) {
      return <FileText className="w-5 h-5 text-calm-600 dark:text-calm-400" />;
    }
    return getFavicon(item.url) || <div className="w-5 h-5 bg-calm-300 dark:bg-calm-600 rounded" />;
  };

  // Get tags array
  const getTags = () => {
    if (item.tags && Array.isArray(item.tags)) {
      return item.tags;
    }
    if (item.category) {
      return [item.category];
    }
    if (item.type && item.type !== 'tab') {
      return [item.type];
    }
    return [];
  };

  const tags = getTags();

  return (
    <div 
      className={cn(
        "flex items-start justify-between w-full group cursor-pointer hover:bg-calm-50 dark:hover:bg-calm-800/50 -mx-4 px-4 py-3 rounded-lg transition-colors relative",
        isSelected && "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500",
        className
      )}
      onClick={handleNavigate}
    >
      {/* Celebration Animation Overlay */}
      {showCelebration && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-50/95 to-emerald-100/95 dark:from-green-900/70 dark:to-emerald-800/70 rounded-lg z-10 backdrop-blur-sm">
          <div className="relative">
            <div className="text-6xl animate-celebrate">🎉</div>
            {/* Confetti particles */}
            <div className="absolute top-0 left-0 text-2xl animate-confetti" style={{ animationDelay: '0ms' }}>✨</div>
            <div className="absolute top-0 right-0 text-2xl animate-confetti" style={{ animationDelay: '100ms' }}>⭐</div>
            <div className="absolute bottom-0 left-0 text-2xl animate-confetti" style={{ animationDelay: '200ms' }}>💫</div>
            <div className="absolute bottom-0 right-0 text-2xl animate-confetti" style={{ animationDelay: '150ms' }}>✨</div>
          </div>
        </div>
      )}
      
      {/* Left side: Icon + Content */}
      <div className="flex items-start space-x-3 flex-1 min-w-0">
        {/* Icon or Checkbox (on hover/selection) */}
        <div 
          className="flex-shrink-0 mt-1 relative w-5 h-5"
          onClick={(e) => {
            if (showCheckbox) {
              e.stopPropagation();
              onToggleSelect?.(item.id);
            }
          }}
        >
          {/* Favicon - hidden on group hover when checkbox enabled */}
          <div className={cn(
            "absolute inset-0 transition-opacity",
            showCheckbox && "group-hover:opacity-0",
            showCheckbox && isSelected && "opacity-0"
          )}>
            {getIcon()}
          </div>
          
          {/* Checkbox - shown on group hover or when selected */}
          {showCheckbox && (
            <div className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity",
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 focus:ring-offset-0 cursor-pointer"
              />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title with Active Tab Indicator */}
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-calm-900 dark:text-calm-100 truncate group-hover:text-calm-700 dark:group-hover:text-calm-200">
              {item.title || item.name || 'Untitled'}
            </p>
            {isCurrentlyOpen && !isNote && (
              <span 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                title="This tab is currently open in your browser"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Active</span>
              </span>
            )}
          </div>
          
          {/* URL/Domain */}
          <p className="text-sm text-calm-600 dark:text-calm-400 truncate">
            {isNote 
              ? `Note • ${typeof item.wordCount === 'number' ? item.wordCount : 0} words`
              : getDomain(item.url)
            }
          </p>
          
          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-md bg-calm-100 dark:bg-calm-750 px-2 py-1 text-xs font-medium text-calm-700 dark:text-calm-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Timestamp */}
          <p className="mt-1 text-xs text-calm-500 dark:text-calm-400">
            {getTimeAgo(item.timestamp || item.createdAt)}
          </p>
        </div>
      </div>

      {/* Right side: Actions */}
      {isTrashView ? (
        /* Trash view: Show only Restore button */
        <div 
          className="flex-shrink-0 ml-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              console.log('[Tab Napper] Restoring item from trash:', item.title);
              if (onItemAction) {
                onItemAction('restore', item);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-calm-300 dark:border-calm-600 bg-white dark:bg-calm-800 text-calm-700 dark:text-calm-300 hover:bg-calm-50 dark:hover:bg-calm-750 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Restore
          </button>
        </div>
      ) : isArchiveView && showingReschedule ? (
        /* Archive view rescheduling: Show fidget controls without Mark Done (already done!) */
        <div 
          className="flex-shrink-0 ml-4 flex flex-col items-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <FidgetControl
            item={item}
            onAction={(action, item, actionData) => {
              // Archive items can only be rescheduled, not marked done again
              if (onItemAction) {
                onItemAction(action, item, actionData);
              }
              setShowingReschedule(false);
            }}
            showMarkDone={false}
            className="w-full"
          />
          <button
            onClick={() => {
              console.log('[Tab Napper] Canceling reschedule:', item.title);
              setShowingReschedule(false);
            }}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-calm-300 dark:border-calm-600 bg-white dark:bg-calm-800 text-calm-600 dark:text-calm-400 hover:bg-calm-50 dark:hover:bg-calm-750 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : isArchiveView ? (
        /* Archive view: Show Reschedule button (items are already done, don't show Mark Done) */
        <div 
          className="flex-shrink-0 ml-4 flex flex-col items-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              console.log('[Tab Napper] Rescheduling archived item:', item.title);
              setShowingReschedule(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-calm-300 dark:border-calm-600 bg-white dark:bg-calm-800 text-calm-700 dark:text-calm-300 hover:bg-calm-50 dark:hover:bg-calm-750 transition-colors"
          >
            <Clock className="h-4 w-4" />
            Reschedule
          </button>
        </div>
      ) : showingReschedule ? (
        /* Scheduled view rescheduling: Show fidget controls with Mark Done and cancel option */
        <div 
          className="flex-shrink-0 ml-4 flex flex-col items-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <FidgetControl
            item={item}
            onAction={(action, item, actionData) => {
              // Show celebration when marking done
              if (action === 'mark_done') {
                setShowCelebration(true);
                setTimeout(() => {
                  if (onItemAction) {
                    onItemAction(action, item, actionData);
                  }
                  // Hide celebration after action completes
                  setTimeout(() => setShowCelebration(false), 500);
                }, 800);
              } else {
                // After action is taken, hide reschedule controls
                if (onItemAction) {
                  onItemAction(action, item, actionData);
                }
              }
              setShowingReschedule(false);
            }}
            showMarkDone={true}
            className="w-full"
          />
          <button
            onClick={() => {
              console.log('[Tab Napper] Canceling reschedule:', item.title);
              setShowingReschedule(false);
            }}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-calm-300 dark:border-calm-600 bg-white dark:bg-calm-800 text-calm-600 dark:text-calm-400 hover:bg-calm-50 dark:hover:bg-calm-750 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : isScheduled ? (
        /* Scheduled item: Show scheduled time and reschedule button */
        <div 
          className="flex-shrink-0 ml-4 flex flex-col items-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 text-sm">
            {isPastDue ? (
              <AlertCircle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            ) : (
              <Clock className="h-4 w-4 text-calm-500 dark:text-calm-400" />
            )}
            <span className={cn(
              "font-medium",
              isPastDue 
                ? "text-orange-700 dark:text-orange-400" 
                : "text-calm-700 dark:text-calm-300"
            )}>
              {getDetailedScheduledTime(item.scheduledFor)}
            </span>
          </div>
          <button
            onClick={() => {
              console.log('[Tab Napper] Rescheduling item:', item.title);
              setShowingReschedule(true);
            }}
            className={cn(
              "inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
              isPastDue
                ? "border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                : "border-calm-300 dark:border-calm-600 bg-white dark:bg-calm-800 text-calm-600 dark:text-calm-400 hover:bg-calm-50 dark:hover:bg-calm-750"
            )}
          >
            {isPastDue ? 'Reschedule Now' : 'Reschedule'}
          </button>
        </div>
      ) : showFidgetControls ? (
        /* Normal view (Inbox): Show fidget controls to schedule items - NO Mark Done */
        <div 
          className="flex-shrink-0 ml-4"
          onClick={(e) => e.stopPropagation()}
        >
          <FidgetControl
            item={item}
            onAction={(action, item, actionData) => {
              // Inbox items can only be scheduled, not marked done
              if (onItemAction) {
                onItemAction(action, item, actionData);
              }
            }}
            showMarkDone={false}
            className="w-full"
          />
        </div>
      ) : null}
    </div>
  );
}

export default StashCard;