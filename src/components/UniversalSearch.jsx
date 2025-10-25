import React, { useEffect, useRef, useState } from 'react';
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
  variant = 'large', // 'large' | 'compact'
  isLoading = false, // optional external trigger to display loading shimmer animation
  ...props 
}) {
  const inputRef = useRef(null);
  const [shimmer, setShimmer] = useState(false);

  // Simple auto-focus with delay for browser extensions
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // One-shot shimmer on mount to draw attention
  useEffect(() => {
    setShimmer(true);
    const t = setTimeout(() => setShimmer(false), 1200);
    return () => clearTimeout(t);
  }, []);
  
  // Optionally allow a one-shot shimmer when external loading starts
  useEffect(() => {
    if (isLoading) {
      setShimmer(true);
      const t = setTimeout(() => setShimmer(false), 1000);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

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

  const size = variant === 'compact' 
    ? { iconPad: 'pl-3', inputPad: 'pl-10 pr-10', py: 'py-2', text: 'text-sm', radius: 'rounded-full' }
    : { iconPad: 'pl-4', inputPad: 'pl-12 pr-12', py: 'py-4', text: 'text-lg', radius: 'rounded-full' };

  return (
    <div className={cn('relative w-full', className)} {...props}>
      {/* Gradient outline wrapper (static, no spin) */}
      <div
        className={cn(
          'relative p-[2px]',
          size.radius,
          'bg-[conic-gradient(from_180deg,rgba(255,98,0,0.9),rgba(255,185,0,0.9),rgba(255,98,0,0.9))]'
        )}
      >
        {/* Inner container */}
        <div className={cn('relative', size.radius, 'bg-white dark:bg-calm-900 shadow-sm')}> 
          {/* Optional inside shimmer sweep (non-intrusive) */}
          {shimmer && (
            <div className="absolute inset-0 rounded-full pointer-events-none overflow-hidden" aria-hidden="true">
              <div className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] animate-[shimmer-sweep_1.2s_linear_1] rounded-full" />
            </div>
          )}
          {/* Search Icon */}
          <div className={cn('absolute inset-y-0 left-0 flex items-center pointer-events-none', size.iconPad)}>
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
              'w-full',
              size.inputPad,
              size.py,
              size.text,
              'bg-transparent',
              size.radius,
              // Remove default borders; rely on gradient shell
              'border-0 focus:outline-none',
              
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
      </div>
    </div>
  );
}

export default React.memo(UniversalSearch);