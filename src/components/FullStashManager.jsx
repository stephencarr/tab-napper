import React, { useState, useEffect } from 'react';
import { Archive, ArrowRight, Layers, Settings } from 'lucide-react';
import { loadAppState } from '../utils/storage.js';
import { cn } from '../utils/cn.js';

/**
 * full scheduled Manager Button Component
 * Provides navigation to the full scheduled management interface
 */
function FullStashManager({ className, onNavigate }) {
  const [scheduledCount, setStashCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load stash statistics
  useEffect(() => {
    loadStashStats();
  }, []);

  const loadStashStats = async () => {
    try {
      setIsLoading(true);
      
      // Load scheduled tabs
      const scheduledTabs = await loadAppState('triageHub_scheduled') || [];
      setStashCount(scheduledTabs.length);
      
      // Calculate unique categories
      const categories = new Set(scheduledTabs.map(item => item.type).filter(Boolean));
      setCategoryCount(categories.size);
      
      console.log(`[Tab Napper] Scheduled stats loaded: ${scheduledTabs.length} items, ${categories.size} categories`);
      
    } catch (error) {
      console.error('[Tab Napper] Error loading stash stats:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClick = () => {
    console.log('[Tab Napper] 📁 full scheduled Manager clicked');
    
    // For now, we'll just log the action
    // In a future implementation, this could:
    // - Open a modal with full scheduled management
    // - Navigate to a separate stash management page
    // - Expand the current stash section
    
    if (onNavigate) {
      onNavigate('stash-manager');
    } else {
      // Default behavior: log the intended action
      console.log('[Tab Napper] full scheduled Manager would open here');
      console.log('[Tab Napper] Future implementation: Modal or dedicated stash management view');
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <button
        onClick={handleClick}
        className="w-full group relative overflow-hidden bg-gradient-to-r from-calm-600 to-calm-700 hover:from-calm-700 hover:to-calm-800 text-white rounded-lg p-4 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        
        {/* Content */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Archive className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-sm">full scheduled Manager</h3>
              <p className="text-xs text-calm-200 group-hover:text-white transition-colors">
                Organize & manage all scheduled items
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-calm-200 group-hover:text-white transition-colors">
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </div>

        {/* Subtle shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
      </button>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-calm-50 dark:bg-calm-800 border border-calm-200 dark:border-calm-700 rounded-lg p-3">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Layers className="h-4 w-4 text-calm-500 dark:text-calm-400" />
            <span className="text-xs font-medium text-calm-600 dark:text-calm-300">Stashed</span>
          </div>
          <div className="text-lg font-bold text-calm-900 dark:text-calm-100">
            {isLoading ? '...' : scheduledCount}
          </div>
          <div className="text-xs text-calm-500 dark:text-calm-400">items</div>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Settings className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-300">Categories</span>
          </div>
          <div className="text-lg font-bold text-amber-900 dark:text-amber-100">
            {isLoading ? '...' : categoryCount}
          </div>
          <div className="text-xs text-amber-500 dark:text-amber-400">types</div>
        </div>
      </div>

      {/* Helper text */}
      <div className="text-center">
        <p className="text-xs text-calm-500 dark:text-calm-400 leading-relaxed">
          Access advanced stash organization, bulk operations, and detailed item management
        </p>
      </div>
    </div>
  );
}

export default FullStashManager;