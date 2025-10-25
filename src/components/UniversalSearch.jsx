import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../utils/cn.js';

/**
 * Universal Search Bar component for Tab Napper
 * Large, horizontal search with auto-focus and ADHD-friendly design
 */
function UniversalSearch({ 
  value, 
  onChange, 
  onClear,
  placeholder = "Search all your tabs, notes, and items...",
  className,
  autoFocus = true,
  ...props 
}) {
  const inputRef = useRef(null);

  // Simple auto-focus with delay for browser extensions
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    // ESC to clear search
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={cn('relative w-full', className)} {...props}>
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-calm-400 dark:text-calm-500" />
      </div>

      {/* Search Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          // Base styles
          'w-full',
          'pl-12 pr-12',
          'py-4',
          'text-lg',
          'bg-white dark:bg-calm-800',
          'border',
          'border-calm-200 dark:border-calm-700',
          'rounded-xl',
          'shadow-sm',
          
          // Focus styles
          'focus:outline-none',
          'focus:ring-2',
          'focus:ring-calm-400 dark:focus:ring-calm-500',
          'focus:border-calm-400 dark:focus:border-calm-500',
          
          // Hover styles
          'hover:border-calm-300 dark:hover:border-calm-600',
          
          // Transition
          'transition-all',
          'duration-200',
          
          // Typography
          'placeholder:text-calm-400 dark:placeholder:text-calm-500',
          'text-calm-800 dark:text-calm-200'
        )}
      />

      {/* Clear Button */}
      {value && (
        <button
          onClick={handleClear}
          className={cn(
            'absolute inset-y-0 right-0 pr-4 flex items-center',
            'text-calm-400 dark:text-calm-500 hover:text-calm-600 dark:hover:text-calm-300',
            'transition-colors duration-200',
            'focus:outline-none focus:text-calm-600 dark:focus:text-calm-300'
          )}
          aria-label="Clear search"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Search hint */}
      {!value && (
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <span className="text-xs text-calm-400 dark:text-calm-500 hidden sm:inline">
            Press ESC to clear
          </span>
        </div>
      )}
    </div>
  );
}

export default UniversalSearch;