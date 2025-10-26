import React, { useState, useEffect } from 'react';
import { Lightbulb, Plus, X, TrendingUp, Calendar, Clock, Pin, PinOff } from 'lucide-react';
import { generateSmartSuggestions, pinSuggestion, dismissSuggestion, getSuggestionStats, clearSuggestionsCache } from '../utils/smartSuggestions.js';
import { navigateToUrl } from '../utils/navigation.js';
import { cn } from '../utils/cn.js';

/**
 * Smart Suggestions Component
 * Displays AI-powered suggestions based on browsing patterns
 */
function SmartSuggestions({ className, onSuggestionPinned }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  // Load suggestions on component mount and when pinned items change
  useEffect(() => {
    loadSuggestions();
  }, []);

  // Refresh suggestions when pinning state changes
  useEffect(() => {
    if (onSuggestionPinned) {
      // Small delay to ensure storage has been updated
      const timeoutId = setTimeout(loadSuggestions, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [onSuggestionPinned]);

  // Expose refresh function for testing (safe version)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window._refreshSmartSuggestions = async () => {
        try {
          console.log('[Tab Napper] 🔄 Refreshing smart suggestions...');
          await loadSuggestions();
        } catch (error) {
          console.error('[Tab Napper] Error in refresh function:', error);
        }
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window._refreshSmartSuggestions;
      }
    };
  }, []);

  const loadSuggestions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[SmartSuggestions] 🔄 Loading suggestions...');
      const hasWindow = typeof window !== 'undefined';
      console.log('[SmartSuggestions] Mock data available?', hasWindow && !!window._mockHistoryData);
      if (hasWindow && window._mockHistoryData) {
        console.log('[SmartSuggestions] Mock data count:', window._mockHistoryData.length);
      }
      
      // getSuggestionStats already calls generateSmartSuggestions internally
      const suggestionStats = await getSuggestionStats();
      
      console.log('[SmartSuggestions] ✅ Got stats:', {
        totalSuggestions: suggestionStats?.totalSuggestions || 0,
        historyCount: suggestionStats?.historyItemsCount || 0,
        totalCandidates: suggestionStats?.totalCandidates || 0,
        config: suggestionStats?.config
      });
      
      if (suggestionStats && suggestionStats.suggestions.length > 0) {
        setSuggestions(suggestionStats.suggestions);
        setStats(suggestionStats);
        console.log('[SmartSuggestions] 📊 Suggestions:', suggestionStats.suggestions.map(s => ({
          title: s.title,
          score: s.score,
          daysVisited: s.daysVisited,
          daysSinceRecent: s.daysSinceRecent
        })));
      } else {
        setSuggestions([]);
        setStats(suggestionStats);
        console.log('[SmartSuggestions] ⚠️ No suggestions generated');
      }
      
    } catch (err) {
      console.error('[SmartSuggestions] ❌ Error loading smart suggestions:', err);
      setError('Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clicking on a suggestion (navigate to URL)
  const handleSuggestionClick = async (suggestion) => {
    console.log('[Tab Napper] 💡 Smart suggestion clicked:', {
      title: suggestion.title,
      url: suggestion.url,
      score: suggestion.score
    });

    try {
      const result = await navigateToUrl(suggestion.url, suggestion.title);
      
      if (result.action === 'switched') {
        console.log('[Tab Napper] ✅ Successfully switched to existing tab');
      } else if (result.action === 'created') {
        console.log('[Tab Napper] ✅ Successfully opened new tab');
      }
      
    } catch (error) {
      console.error('[Tab Napper] ❌ Error navigating to suggestion URL:', error);
    }
  };

  // Handle pinning a suggestion to quick access
  const handlePinSuggestion = async (suggestion, event) => {
    event.stopPropagation(); // Prevent triggering the click handler
    
    console.log('[Tab Napper] 📌 Pinning suggestion:', suggestion.title);
    
    try {
      const pinnedItem = await pinSuggestion(suggestion);
      
      // Remove from suggestions list
      setSuggestions(prev => prev.filter(s => s.url !== suggestion.url));
      
      // Notify parent component
      if (onSuggestionPinned) {
        onSuggestionPinned(pinnedItem);
      }
      
      console.log('[Tab Napper] ✅ Successfully pinned suggestion');
      
    } catch (error) {
      console.error('[Tab Napper] ❌ Error pinning suggestion:', error);
      setError('Failed to pin suggestion');
    }
  };

  // Handle dismissing a suggestion
  const handleDismissSuggestion = async (suggestion, event) => {
    event.stopPropagation(); // Prevent triggering the click handler
    
    console.log('[Tab Napper] 🚫 Dismissing suggestion:', suggestion.title);
    
    try {
      await dismissSuggestion(suggestion);
      
      // Remove from suggestions list
      setSuggestions(prev => prev.filter(s => s.url !== suggestion.url));
      
      console.log('[Tab Napper] ✅ Successfully dismissed suggestion');
      
    } catch (error) {
      console.error('[Tab Napper] ❌ Error dismissing suggestion:', error);
      setError('Failed to dismiss suggestion');
    }
  };

  // Get time ago string for last visit
  const getTimeAgo = (timestamp) => {
    if (!timestamp || isNaN(timestamp)) {
      return 'Recently';
    }
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 0) {
      return 'Recently';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 24) {
      return hours <= 1 ? 'Recently' : `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  // Render suggestion metrics badge
  const renderMetricsBadge = (suggestion) => {
    const { metrics } = suggestion;
    return (
      <div className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-1 rounded-full">
        <Calendar className="h-3 w-3" />
        <span>{metrics.uniqueDaysVisited}d</span>
      </div>
    );
  };

  // Render suggestion reason
  const renderSuggestionReason = (suggestion) => {
    return (
      <div className="text-xs text-calm-600 dark:text-calm-400 mt-1 flex items-center space-x-1">
        <TrendingUp className="h-3 w-3 text-emerald-500" />
        <span>{suggestion.suggestionReason}</span>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <h2 className="text-lg font-semibold text-calm-800 dark:text-calm-200">Smart Suggestions</h2>
          </div>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg animate-pulse">
              <div className="h-4 bg-emerald-200 dark:bg-emerald-800/50 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-emerald-200 dark:bg-emerald-800/50 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold text-calm-800 dark:text-calm-200">Smart Suggestions</h2>
          </div>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          <button
            onClick={loadSuggestions}
            className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-medium text-calm-900 dark:text-calm-200">Smart Suggestions</h2>
            {suggestions.length > 0 && (
              <span className="text-xs text-emerald-600 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded-full">
                {suggestions.length}
              </span>
            )}
          </div>
        </div>
        
        {/* Debug stats toggle */}
        {stats && (
          <div className="mt-3 sm:mt-0 sm:ml-4">
            <button
              onClick={() => setShowStats(!showStats)}
              className="text-xs text-calm-500 dark:text-calm-400 hover:text-calm-700 dark:hover:text-calm-200 transition-colors"
            >
              {showStats ? 'Hide' : 'Show'} Stats
            </button>
          </div>
        )}
      </div>

      {/* Debug stats */}
      {showStats && stats && (
        <div className="bg-gray-50 dark:bg-calm-800 border border-gray-200 dark:border-calm-700 rounded-lg p-3 text-xs space-y-2 text-calm-600 dark:text-calm-300">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Suggestions:</span> {stats.totalSuggestions}
            </div>
            <div>
              <span className="font-medium">Pinned:</span> {stats.totalPinnedItems}
            </div>
            <div>
              <span className="font-medium">Cooldowns:</span> {stats.activeCooldowns}
            </div>
            <div>
              <span className="font-medium">Threshold:</span> {stats.config.SUGGESTION_THRESHOLD}
            </div>
          </div>
        </div>
      )}

      {/* Suggestions list */}
      {suggestions.length === 0 ? (
        <div className="text-center py-8 text-calm-500 dark:text-calm-400">
          <Lightbulb className="h-8 w-8 mx-auto mb-3 text-emerald-300 dark:text-emerald-600" />
          <p className="text-sm font-medium mb-1">No suggestions right now</p>
          <p className="text-xs text-calm-400 dark:text-calm-500">
            Keep browsing and we'll suggest frequently visited sites
          </p>
        </div>
      ) : (
        <ul role="list" className="divide-y divide-calm-200 dark:divide-calm-700">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.url}
              onClick={() => handleSuggestionClick(suggestion)}
              className="py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer rounded-lg px-2 -mx-2 group"
            >
              <div className="flex items-center space-x-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                  {suggestion.favicon ? (
                    <img
                      src={suggestion.favicon}
                      alt=""
                      className="h-5 w-5"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Lightbulb className="h-5 w-5 text-emerald-500" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-calm-900 dark:text-calm-100 truncate">
                    {suggestion.title}
                  </p>
                  <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{suggestion.suggestionReason}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-calm-500 dark:text-calm-400">
                    <span className="truncate">
                      {suggestion.domain}
                    </span>
                    <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{getTimeAgo(suggestion.lastVisitTime)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badge & Actions */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-1 rounded-full">
                    <Calendar className="h-3 w-3" />
                    <span>{suggestion.metrics.uniqueDaysVisited}d</span>
                  </div>
                  <button
                    onClick={(e) => handlePinSuggestion(suggestion, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded"
                    title="Pin to Quick Access"
                  >
                    <Pin className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleDismissSuggestion(suggestion, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-calm-500 dark:text-calm-400 hover:text-calm-700 dark:hover:text-calm-200 hover:bg-calm-100 dark:hover:bg-calm-700/50 rounded"
                    title="Dismiss suggestion"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Refresh button */}
      {(suggestions.length > 0 || !isLoading) && (
        <div className="text-center pt-2 space-x-2">
          <button
            onClick={async () => {
              console.log('[SmartSuggestions] 🔄 Force clearing cache...');
              await clearSuggestionsCache();
              await loadSuggestions();
            }}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline transition-colors"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}

export default SmartSuggestions;