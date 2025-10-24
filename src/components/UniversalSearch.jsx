import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../utils/cn.js';

/**
 * Universal Search Bar component for Triage Hub
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

  // Auto-focus on mount with delay to ensure DOM is ready
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Small delay to ensure the component is fully mounted
      const focusTimeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      return () => clearTimeout(focusTimeout);
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
        <Search className="h-5 w-5 text-calm-400" />
      </div>

      {/* Search Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          // Base styles
          'w-full',
          'pl-12 pr-12',
          'py-4',
          'text-lg',
          'bg-white',
          'border',
          'border-calm-200',
          'rounded-xl',
          'shadow-sm',
          
          // Focus styles
          'focus:outline-none',
          'focus:ring-2',
          'focus:ring-calm-400',
          'focus:border-calm-400',
          
          // Hover styles
          'hover:border-calm-300',
          
          // Transition
          'transition-all',
          'duration-200',
          
          // Typography
          'placeholder:text-calm-400',
          'text-calm-800'
        )}
      />

      {/* Clear Button */}
      {value && (
        <button
          onClick={handleClear}
          className={cn(
            'absolute inset-y-0 right-0 pr-4 flex items-center',
            'text-calm-400 hover:text-calm-600',
            'transition-colors duration-200',
            'focus:outline-none focus:text-calm-600'
          )}
          aria-label="Clear search"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Search hint */}
      {!value && (
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <span className="text-xs text-calm-400 hidden sm:inline">
            Press ESC to clear
          </span>
        </div>
      )}
    </div>
  );
}

export default UniversalSearch;