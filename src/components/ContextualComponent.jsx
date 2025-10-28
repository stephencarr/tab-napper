import React, { useState, useEffect } from 'react';
import { AlertTriangle, Eye, EyeOff, ExternalLink, X } from 'lucide-react';
import { getCurrentlyOpenTabs } from '../utils/history.js';
import { navigateToUrl } from '../utils/navigation.js';
import { useReactiveStorage } from '../utils/reactiveStorage.js';
import { debugLog, debugError } from '../utils/debug.js';
import { cn } from '../utils/cn.js';
import ListItem from './ListItem.jsx';

/**
 * Contextual Component for the Right Column
 * Shows relevant stashed items when current open tabs match stashed content
 */
function ContextualComponent({ className }) {
  const [contextualItem, setContextualItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [error, setError] = useState(null);
  
  // Watch for changes in stashed tabs to update contextual matches
  const { data: stashedTabs } = useReactiveStorage('triageHub_stashedTabs', []);

  // Load contextual data on component mount and when stashed tabs change
  useEffect(() => {
    loadContextualMatch();
    
    // PERFORMANCE: Increased to 5 minutes to reduce CPU usage
    // This feature queries all open tabs and runs matching algorithm
    const interval = setInterval(loadContextualMatch, 300000); // Every 5 minutes (was 2 minutes)
    
    return () => clearInterval(interval);
  }, [stashedTabs]); // Add stashedTabs as dependency

  const loadContextualMatch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get currently open tabs
      const openTabs = await getCurrentlyOpenTabs();
      
      // Use reactive stashed tabs data
      const currentStashedTabs = stashedTabs || [];
      
      debugLog('Contextual', `Matching - Open tabs: ${openTabs.length}, Stashed tabs: ${currentStashedTabs.length}`);
      
      if (openTabs.length === 0 || currentStashedTabs.length === 0) {
        debugLog('Contextual', `No contextual matches possible - openTabs: ${openTabs.length}, stashedTabs: ${currentStashedTabs.length}`);
        setContextualItem(null);
        setIsLoading(false);
        return;
      }
      
      // Find contextual matches based on domain or keywords
      const contextualMatch = findContextualMatch(openTabs, currentStashedTabs);
      
      if (contextualMatch) {
        debugLog('Contextual', `Found match: ${contextualMatch.title} (${contextualMatch.matchReason}, score: ${contextualMatch.contextScore})`);
      } else {
        debugLog('Contextual', 'No contextual matches found');
      }
      
      setContextualItem(contextualMatch);
      
    } catch (err) {
      debugError('Contextual', 'Error loading contextual match:', err);
      setError('Failed to load contextual suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  // Find a relevant stashed item based on currently open tabs
  const findContextualMatch = (openTabs, stashedTabs) => {
    debugLog('Contextual', 'Starting contextual matching...');
    
    // Get domains and keywords from open tabs
    const openDomains = new Set();
    const openKeywords = new Set();
    
    openTabs.forEach(url => {
      try {
        const urlObj = new URL(url);
        openDomains.add(urlObj.hostname);
        
        // Extract keywords from URL and domain
        const pathKeywords = urlObj.pathname
          .split('/')
          .filter(segment => segment.length > 2)
          .map(segment => segment.toLowerCase());
        
        const domainKeywords = urlObj.hostname
          .split('.')
          .filter(segment => segment.length > 2 && segment !== 'www' && segment !== 'com' && segment !== 'org')
          .map(segment => segment.toLowerCase());
        
        [...pathKeywords, ...domainKeywords].forEach(keyword => {
          openKeywords.add(keyword);
        });
        
      } catch (error) {
        console.warn('[Tab Napper] Invalid URL in open tabs:', url);
      }
    });
    
    debugLog('Contextual', `Open domains: ${openDomains.size}, Open keywords: ${openKeywords.size}`);
    
    // Score stashed items for relevance
    const scoredItems = stashedTabs.map(item => {
      let score = 0;
      let matchReason = '';
      
      try {
        const itemUrl = new URL(item.url);
        const itemDomain = itemUrl.hostname;
        
        // Exact domain match (highest score)
        if (openDomains.has(itemDomain)) {
          score += 100;
          matchReason = `Same domain: ${itemDomain}`;
        }
        
        // Related domain (medium score)
        const itemDomainParts = itemDomain.split('.');
        for (const openDomain of openDomains) {
          const openDomainParts = openDomain.split('.');
          const commonParts = itemDomainParts.filter(part => openDomainParts.includes(part));
          if (commonParts.length > 1) {
            score += 50;
            matchReason = `Related domain: ${itemDomain} ↔ ${openDomain}`;
          }
        }
        
        // Keyword matches in URL or title
        const itemKeywords = [
          ...itemUrl.pathname.split('/').filter(s => s.length > 2),
          ...itemDomain.split('.').filter(s => s.length > 2),
          ...item.title.toLowerCase().split(/\s+/).filter(s => s.length > 2)
        ].map(s => s.toLowerCase());
        
        let keywordMatches = 0;
        itemKeywords.forEach(keyword => {
          if (openKeywords.has(keyword)) {
            keywordMatches++;
            score += 10;
          }
        });
        
        if (keywordMatches > 0 && !matchReason) {
          matchReason = `${keywordMatches} keyword match${keywordMatches > 1 ? 'es' : ''}`;
        }
        
      } catch (error) {
        console.warn('[Tab Napper] Invalid URL in stashed item:', item.url, error);
      }
      
      return {
        ...item,
        contextScore: score,
        matchReason
      };
    });
    
    debugLog('Contextual', `Scored ${scoredItems.length} items for contextual matching`);
    
    // Return the highest scoring item if score > 0
    const bestMatch = scoredItems
      .filter(item => item.contextScore > 0)
      .sort((a, b) => b.contextScore - a.contextScore)[0];
    
    if (bestMatch) {
      debugLog('Contextual', `Best match: ${bestMatch.title} (score: ${bestMatch.contextScore})`);
    }
    
    return bestMatch || null;
  };

  // Handle clicking on the contextual item
  const handleContextualClick = async (item) => {
    console.log('[Tab Napper] 🎯 Contextual item clicked:', {
      title: item.title,
      url: item.url,
      matchReason: item.matchReason
    });

    try {
      const result = await navigateToUrl(item.url, item.title);
      
      if (result.action === 'switched') {
        console.log('[Tab Napper] ✅ Successfully switched to existing tab');
      } else if (result.action === 'created') {
        console.log('[Tab Napper] ✅ Successfully opened new tab');
      }
      
    } catch (error) {
      console.error('[Tab Napper] ❌ Error navigating to contextual URL:', error);
    }
  };

  // Handle dismissing the contextual suggestion
  const handleDismiss = () => {
    setIsDismissed(true);
    setContextualItem(null);
  };

  // Handle showing/hiding dismissed suggestions
  const handleToggleDismissed = () => {
    if (isDismissed) {
      setIsDismissed(false);
      loadContextualMatch();
    } else {
      setIsDismissed(true);
      setContextualItem(null);
    }
  };

  // Get favicon URL
  const getFaviconUrl = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return null;
    }
  };

  // If loading and no item yet, show loading state
  if (isLoading && !contextualItem) {
    return null; // Don't show loading for contextual component
  }

  // If error, show minimal error state
  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          Unable to load contextual suggestions
        </div>
      </div>
    );
  }

  // If no contextual item and not dismissed, don't render
  if (!contextualItem && !isDismissed) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-medium text-calm-900 dark:text-calm-200">Stashed Context</h3>
        </div>
        <button
          onClick={handleToggleDismissed}
          className="p-1 text-calm-400 hover:text-calm-600 dark:hover:text-calm-300 transition-colors"
          title={isDismissed ? "Show contextual suggestions" : "Hide contextual suggestions"}
        >
          {isDismissed ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Contextual Item */}
      {contextualItem && !isDismissed && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Did you need this?
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-amber-400 dark:text-amber-500 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
              title="Dismiss suggestion"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          
          <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
            {contextualItem.matchReason}
          </p>

          <ListItem
            title={contextualItem.title}
            subtitle={
              <div className="flex items-center justify-between text-xs text-calm-600 dark:text-calm-400">
                <span className="truncate">
                  {contextualItem.description || 'No description'}
                </span>
                <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                  Stashed
                </span>
              </div>
            }
            icon={
              contextualItem.url ? (
                <img
                  src={getFaviconUrl(contextualItem.url)}
                  alt=""
                  className="h-4 w-4"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )
            }
            onClick={() => {
              console.log(`[Tab Napper] Contextual item clicked: ${contextualItem.title}`);
              handleContextualClick(contextualItem);
            }}
            className="hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-300 dark:border-amber-800/50 transition-colors cursor-pointer bg-white dark:bg-calm-800"
            badge={
              <div className="flex items-center space-x-1 text-xs text-amber-700 dark:text-amber-200 bg-amber-200 dark:bg-amber-800/50 px-2 py-1 rounded-full">
                <ExternalLink className="h-3 w-3" />
                <span>Open</span>
              </div>
            }
          />
        </div>
      )}

      {/* Dismissed state */}
      {isDismissed && (
        <div className="text-center py-4 text-calm-400 dark:text-calm-500">
          <EyeOff className="h-6 w-6 mx-auto mb-2" />
          <p className="text-xs">Contextual suggestions hidden</p>
        </div>
      )}
    </div>
  );
}

export default ContextualComponent;