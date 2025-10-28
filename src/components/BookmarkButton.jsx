import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { bookmarkItem, unbookmarkItem, isBookmarked } from '../utils/bookmarks.js';
import { cn } from '../utils/cn.js';

/**
 * BookmarkButton Component
 * Reusable button to bookmark/unbookmark items
 * Follows Tailwind UI best practices for icon buttons
 * 
 * @param {Object} item - Item to bookmark (must have url and title)
 * @param {string} size - Size variant: 'sm' | 'md' | 'lg'
 * @param {Function} onBookmarkChange - Callback when bookmark state changes
 */
export default function BookmarkButton({ 
  item, 
  size = 'md',
  onBookmarkChange,
  className 
}) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check bookmark status on mount and when item changes
  useEffect(() => {
    let isMounted = true;
    
    if (item?.url) {
      isBookmarked(item.url).then(result => {
        if (isMounted) {
          setBookmarked(result);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [item?.url]);

  const handleClick = async (e) => {
    e.stopPropagation(); // Prevent triggering parent click handlers
    
    if (!item?.url || loading) return;

    setLoading(true);
    try {
      if (bookmarked) {
        await unbookmarkItem(item.url);
        setBookmarked(false);
      } else {
        await bookmarkItem(item);
        setBookmarked(true);
      }
      
      // Notify parent component
      if (onBookmarkChange) {
        onBookmarkChange(!bookmarked);
      }
    } catch (error) {
      console.error('[BookmarkButton] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Size variants
  const sizeClasses = {
    sm: 'h-6 w-6 p-1',
    md: 'h-8 w-8 p-1.5',
    lg: 'h-10 w-10 p-2'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-md',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        
        // Size
        sizeClasses[size],
        
        // Colors - bookmarked state
        bookmarked ? [
          'text-amber-500 hover:text-amber-600',
          'bg-amber-50 hover:bg-amber-100',
          'dark:text-amber-400 dark:hover:text-amber-300',
          'dark:bg-amber-950 dark:hover:bg-amber-900',
          'focus:ring-amber-500'
        ] : [
          // Colors - not bookmarked
          'text-gray-400 hover:text-amber-500',
          'bg-gray-100 hover:bg-amber-50',
          'dark:text-gray-500 dark:hover:text-amber-400',
          'dark:bg-gray-800 dark:hover:bg-amber-950',
          'focus:ring-gray-500'
        ],
        
        // Disabled state
        loading && 'opacity-50 cursor-not-allowed',
        
        className
      )}
      title={bookmarked ? 'Remove from Quick Access' : 'Add to Quick Access'}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <Star 
        className={cn(
          iconSizes[size],
          bookmarked && 'fill-current',
          loading && 'animate-pulse'
        )}
      />
    </button>
  );
}
