/**
 * Smart Suggestions Algorithm for Tab Napper
 * 
 * Advanced algorithm that analyzes browsing patterns to suggest frequently accessed items
 * based on daily visit frequency, recency, and consistency patterns.
 */

import { loadAppState, saveAppState } from './storage.js';
import { debugLog, debugError } from './debug.js';

// Configuration constants
const SUGGESTION_CONFIG = {
  ANALYSIS_WINDOW_DAYS: 14,           // Look back 14 days for more relevant patterns
  MIN_DAILY_VISITS: 2,                // Minimum days visited to be considered
  MIN_TOTAL_VISITS: 5,                // Minimum total visits required
  RECENCY_DECAY_DAYS: 3,              // Days after which recency weight decays (shorter window)
  COOLDOWN_PERIOD_DAYS: 7,            // Days before unpinned items can be suggested again
  MAX_SUGGESTIONS: 5,                 // Maximum number of suggestions to show
  SUGGESTION_THRESHOLD: 0.35,         // Minimum score to be suggested
  CONSISTENCY_WEIGHT: 0.35,           // Weight for daily visit consistency
  RECENCY_WEIGHT: 0.40,               // Weight for recent activity (increased)
  FREQUENCY_WEIGHT: 0.25,             // Weight for overall frequency
  CACHE_DURATION_MS: 60 * 60 * 1000,  // 1 hour cache duration
};

// Cache for smart suggestions
let suggestionsCache = null;
let cacheTimestamp = 0;

/**
 * Load cache from persistent storage
 */
async function loadCacheFromStorage() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['smartSuggestions_cache', 'smartSuggestions_cacheTime']);
      if (result.smartSuggestions_cache && result.smartSuggestions_cacheTime) {
        suggestionsCache = result.smartSuggestions_cache;
        cacheTimestamp = result.smartSuggestions_cacheTime;
        debugLog('Suggestions', 'Loaded suggestions cache from storage');
      }
    }
  } catch (error) {
    debugLog('Suggestions', 'Could not load cache from storage:', error);
  }
}

/**
 * Save cache to persistent storage
 */
async function saveCacheToStorage() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && suggestionsCache) {
      await chrome.storage.local.set({
        'smartSuggestions_cache': suggestionsCache,
        'smartSuggestions_cacheTime': cacheTimestamp
      });
      debugLog('Suggestions', 'Saved suggestions cache to storage');
    }
  } catch (error) {
    debugLog('Suggestions', 'Could not save cache to storage:', error);
  }
}

/**
 * Lightweight history fetch for SmartSuggestions
 * Only gets what we need without status indicators
 */
async function getLightweightHistory(maxResults = 500) {
  if (typeof chrome === 'undefined' || !chrome.history) {
    console.log('[SmartSuggestions] Chrome history API not available');
    return [];
  }
  
  try {
    const historyItems = await new Promise((resolve, reject) => {
      chrome.history.search(
        {
          text: '',
          maxResults: maxResults,
          startTime: Date.now() - (SUGGESTION_CONFIG.ANALYSIS_WINDOW_DAYS * 24 * 60 * 60 * 1000)
        },
        (results) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(results);
          }
        }
      );
    });
    
    // Filter out unwanted URLs
    const excludePatterns = [
      'chrome://', 'chrome-extension://', 'moz-extension://',
      'data:', 'blob:', 'javascript:'
    ];
    
    return historyItems.filter(item => 
      !excludePatterns.some(pattern => item.url.startsWith(pattern)) &&
      item.title && item.title.trim().length > 0
    );
    
  } catch (error) {
    console.error('[SmartSuggestions] Error fetching lightweight history:', error);
    return [];
  }
}

/**
 * Calculate daily visit metrics for a URL
 */
function calculateDailyVisitMetrics(url, historyItems) {
  const now = Date.now();
  const analysisWindow = SUGGESTION_CONFIG.ANALYSIS_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const cutoffTime = now - analysisWindow;
  
  // Filter history items for this URL within the analysis window
  const urlItems = historyItems.filter(item => 
    normalizeUrl(item.url) === normalizeUrl(url) && 
    item.lastVisitTime >= cutoffTime
  );
  
  if (urlItems.length === 0) {
    return null;
  }
  
  // Group visits by day
  const visitsByDay = new Map();
  urlItems.forEach(item => {
    const dayKey = new Date(item.lastVisitTime).toDateString();
    if (!visitsByDay.has(dayKey)) {
      visitsByDay.set(dayKey, []);
    }
    visitsByDay.get(dayKey).push(item);
  });
  
  const uniqueDaysVisited = visitsByDay.size;
  const totalVisits = urlItems.length;
  const mostRecentVisit = Math.max(...urlItems.map(item => item.lastVisitTime));
  const oldestVisit = Math.min(...urlItems.map(item => item.lastVisitTime));
  
  // Calculate consistency score (how regularly visited)
  const daysSinceOldest = Math.ceil((now - oldestVisit) / (24 * 60 * 60 * 1000));
  const consistency = daysSinceOldest > 0 ? uniqueDaysVisited / daysSinceOldest : 0;
  
  // Calculate recency score (how recently accessed)
  const daysSinceRecent = Math.ceil((now - mostRecentVisit) / (24 * 60 * 60 * 1000));
  const recency = Math.max(0, 1 - (daysSinceRecent / SUGGESTION_CONFIG.RECENCY_DECAY_DAYS));
  
  // Calculate frequency score (average visits per day)
  const frequency = totalVisits / Math.max(1, uniqueDaysVisited);
  
  return {
    url,
    uniqueDaysVisited,
    totalVisits,
    mostRecentVisit,
    daysSinceRecent,
    consistency,
    recency,
    frequency,
    visitsByDay: Array.from(visitsByDay.entries()).map(([day, visits]) => ({
      day,
      count: visits.length
    }))
  };
}

/**
 * Calculate smart suggestion score
 */
function calculateSuggestionScore(metrics) {
  if (!metrics || 
      metrics.uniqueDaysVisited < SUGGESTION_CONFIG.MIN_DAILY_VISITS ||
      metrics.totalVisits < SUGGESTION_CONFIG.MIN_TOTAL_VISITS) {
    return 0;
  }
  
  // Boost score for items visited very recently
  const recencyBoost = metrics.daysSinceRecent === 0 ? 1.2 : 1.0;
  
  // Normalize scores to 0-1 range
  const normalizedConsistency = Math.min(1, metrics.consistency * 3); // More aggressive consistency scoring
  const normalizedRecency = metrics.recency;
  
  // Frequency: favor items with 3-15 visits per day (typical work usage)
  const avgVisitsPerDay = metrics.totalVisits / Math.max(1, metrics.uniqueDaysVisited);
  const normalizedFrequency = Math.min(1, avgVisitsPerDay / 8);
  
  // Weighted score calculation with recency boost
  const baseScore = (
    normalizedConsistency * SUGGESTION_CONFIG.CONSISTENCY_WEIGHT +
    normalizedRecency * SUGGESTION_CONFIG.RECENCY_WEIGHT +
    normalizedFrequency * SUGGESTION_CONFIG.FREQUENCY_WEIGHT
  );
  
  const score = baseScore * recencyBoost;
  
  debugLog('Suggestions', `Score for ${metrics.url}: ${score.toFixed(3)} (consistency: ${normalizedConsistency.toFixed(2)}, recency: ${normalizedRecency.toFixed(2)}, frequency: ${normalizedFrequency.toFixed(2)}, boost: ${recencyBoost})`);
  
  return Math.min(1, score); // Cap at 1.0
}

/**
 * Get items that are currently pinned to quick access
 */
async function getPinnedItems() {
  try {
    const quickAccessCards = await loadAppState('triageHub_quickAccessCards') || [];
    return quickAccessCards.map(item => normalizeUrl(item.url));
  } catch (error) {
    debugError('Suggestions', 'Error loading pinned items:', error);
    return [];
  }
}

/**
  * Get metadata about unpinned items and cooldown periods
  */
 async function getSuggestionMetadata() {
   try {
     const metadata = await loadAppState('triageHub_suggestionMetadata') || {
       unpinnedItems: {},     // { url: timestamp_when_unpinned }
       dismissedItems: {},    // { url: timestamp_when_dismissed }
       pinnedHistory: {},     // { url: timestamp_when_first_pinned }
       suggestionHistory: {}  // { url: times_suggested }
     };
     return metadata;
   } catch (error) {
     debugError('Suggestions', 'Error loading suggestion metadata:', error);
     return { unpinnedItems: {}, dismissedItems: {}, pinnedHistory: {}, suggestionHistory: {} };
   }
 }

/**
 * Save suggestion metadata
 */
async function saveSuggestionMetadata(metadata) {
  try {
    await saveAppState('triageHub_suggestionMetadata', metadata);
  } catch (error) {
    debugError('Suggestions', 'Error saving suggestion metadata:', error);
  }
}

/**
 * Check if an item is in cooldown period after being unpinned or dismissed
 */
function isInCooldown(url, metadata) {
  const normalizedUrl = normalizeUrl(url);
  const unpinnedTime = metadata.unpinnedItems[normalizedUrl];
  const dismissedTime = metadata.dismissedItems?.[normalizedUrl];
  
  const now = Date.now();
  const cooldownPeriod = SUGGESTION_CONFIG.COOLDOWN_PERIOD_DAYS * 24 * 60 * 60 * 1000;
  
  // Check if unpinned and still in cooldown
  if (unpinnedTime && (now - unpinnedTime) < cooldownPeriod) {
    return true;
  }
  
  // Check if dismissed and still in cooldown
  if (dismissedTime && (now - dismissedTime) < cooldownPeriod) {
    return true;
  }
  
  return false;
}

/**
 * Normalize URL for comparison
 */
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    // Remove common tracking parameters and fragments
    urlObj.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'].forEach(param => {
      urlObj.searchParams.delete(param);
    });
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Extract domain and title information from history items
 */
function extractItemInfo(url, historyItems) {
  const normalizedUrl = normalizeUrl(url);
  const matchingItem = historyItems.find(item => normalizeUrl(item.url) === normalizedUrl);
  
  if (!matchingItem) return null;
  
  try {
    const urlObj = new URL(url);
    return {
      url: url,
      title: matchingItem.title || urlObj.hostname,
      domain: urlObj.hostname,
      favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=16`,
      lastVisitTime: matchingItem.lastVisitTime
    };
  } catch {
    return {
      url: url,
      title: matchingItem.title || 'Unknown',
      domain: 'unknown',
      favicon: null,
      lastVisitTime: matchingItem.lastVisitTime
    };
  }
}

/**
 * Generate smart suggestions based on browsing history
 * Uses 1-hour persistent caching to improve performance
 */
export async function generateSmartSuggestions() {
  try {
    const now = Date.now();
    
    // Load cache from storage if not already in memory
    if (!suggestionsCache) {
      await loadCacheFromStorage();
    }
    
    // Check if we have valid cached suggestions
    if (suggestionsCache && (now - cacheTimestamp) < SUGGESTION_CONFIG.CACHE_DURATION_MS) {
      debugLog('Suggestions', `Using cached smart suggestions (${Math.round((now - cacheTimestamp) / 60000)} minutes old)`);
      return suggestionsCache;
    }
    
    debugLog('Suggestions', 'Generating fresh smart suggestions...');
    
    // Get recent browsing history (lightweight for pattern analysis)
    const historyItems = await getLightweightHistory(500);
    if (historyItems.length === 0) {
      debugLog('Suggestions', 'No history items available for analysis');
      const emptyResult = [];
      // Cache empty result too to avoid repeated failed attempts
      suggestionsCache = emptyResult;
      cacheTimestamp = now;
      await saveCacheToStorage();
      return emptyResult;
    }
    
    debugLog('Suggestions', `Analyzing ${historyItems.length} history items`);
    
    // Get currently pinned items and suggestion metadata
    const [pinnedUrls, metadata] = await Promise.all([
      getPinnedItems(),
      getSuggestionMetadata()
    ]);
    
    debugLog('Suggestions', `Found ${pinnedUrls.length} pinned items`);
    
    // Group history by URL and calculate metrics
    const urlGroups = new Map();
    historyItems.forEach(item => {
      const normalizedUrl = normalizeUrl(item.url);
      if (!urlGroups.has(normalizedUrl)) {
        urlGroups.set(normalizedUrl, []);
      }
      urlGroups.get(normalizedUrl).push(item);
    });
    
    debugLog('Suggestions', `Found ${urlGroups.size} unique URLs to analyze`);
    
    // Calculate suggestion scores for each URL
    const candidates = [];
    let processed = 0;
    let skippedPinned = 0;
    let skippedCooldown = 0;
    let skippedLowScore = 0;
    let skippedMinDays = 0;
    
    for (const [url, items] of urlGroups) {
      processed++;
      
      // Skip if already pinned
      if (pinnedUrls.includes(url)) {
        skippedPinned++;
        continue;
      }
      
      // Skip if in cooldown period
      if (isInCooldown(url, metadata)) {
        skippedCooldown++;
        continue;
      }
      
      // Calculate metrics and score
      const metrics = calculateDailyVisitMetrics(url, historyItems);
      if (!metrics) {
        skippedMinDays++;
        continue;
      }
      
      const score = calculateSuggestionScore(metrics);
      if (score < SUGGESTION_CONFIG.SUGGESTION_THRESHOLD) {
        skippedLowScore++;
        continue;
      }
      
      const itemInfo = extractItemInfo(url, historyItems);
      if (itemInfo) {
        candidates.push({
          ...itemInfo,
          score,
          metrics,
          suggestionReason: generateSuggestionReason(metrics)
        });
      }
    }
    
    debugLog('Suggestions', `Results: ${candidates.length} candidates from ${processed} URLs (${skippedPinned} pinned, ${skippedCooldown} cooldown, ${skippedMinDays} insufficient days, ${skippedLowScore} low score)`);
    
    // Sort by score and take top suggestions
    const suggestions = candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, SUGGESTION_CONFIG.MAX_SUGGESTIONS);
    
    debugLog('Suggestions', `Generated ${suggestions.length} suggestions from ${candidates.length} candidates`);
    
    // Cache the results
    suggestionsCache = suggestions;
    cacheTimestamp = now;
    await saveCacheToStorage();
    
    return suggestions;
    
  } catch (error) {
    debugError('Suggestions', 'Error generating smart suggestions:', error);
    // Don't cache errors - let it retry next time
    return [];
  }
}

/**
 * Generate human-readable reason for suggestion
 */
function generateSuggestionReason(metrics) {
  const { uniqueDaysVisited, daysSinceRecent, totalVisits } = metrics;
  const avgVisitsPerDay = totalVisits / Math.max(1, uniqueDaysVisited);
  
  if (daysSinceRecent === 0 && uniqueDaysVisited >= 5) {
    return `Active today - visited ${uniqueDaysVisited} days this week`;
  } else if (daysSinceRecent === 0 && avgVisitsPerDay >= 3) {
    return `Very active today - ${Math.round(avgVisitsPerDay)} visits per day`;
  } else if (uniqueDaysVisited >= 7 && avgVisitsPerDay >= 3) {
    return `Daily habit - ${uniqueDaysVisited} days, ${Math.round(avgVisitsPerDay)} visits/day`;
  } else if (uniqueDaysVisited >= 5 && daysSinceRecent <= 1) {
    return `Frequent recent use - ${uniqueDaysVisited} days this week`;
  } else if (avgVisitsPerDay >= 5) {
    return `High activity - ${Math.round(avgVisitsPerDay)} visits per day`;
  } else if (uniqueDaysVisited >= 3) {
    return `Regular visits over ${uniqueDaysVisited} days`;
  } else {
    return `Frequently accessed with good consistency`;
  }
}

/**
 * Pin a suggestion to quick access
 */
export async function pinSuggestion(suggestion) {
  try {
    debugLog('Suggestions', `Pinning suggestion: ${suggestion.title}`);
    
    // Get current quick access items
    const quickAccessCards = await loadAppState('triageHub_quickAccessCards') || [];
    
    // Create new quick access item
    const newItem = {
      id: `quick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: suggestion.title,
      description: `Smart suggestion - ${suggestion.suggestionReason}`,
      url: suggestion.url,
      type: 'smart-suggestion',
      accessCount: 1,
      lastAccessed: Date.now(),
      pinnedAt: Date.now(),
      suggestionScore: suggestion.score
    };
    
    // Add to quick access
    await saveAppState('triageHub_quickAccessCards', [...quickAccessCards, newItem]);
    
    // Update suggestion metadata
    const metadata = await getSuggestionMetadata();
    metadata.pinnedHistory[normalizeUrl(suggestion.url)] = Date.now();
    await saveSuggestionMetadata(metadata);
    
    // Clear suggestions cache since pinning affects future suggestions
    await clearSuggestionsCache();
    
    debugLog('Suggestions', `Successfully pinned: ${suggestion.title}`);
    return newItem;
    
  } catch (error) {
    debugError('Suggestions', 'Error pinning suggestion:', error);
    throw error;
  }
}

/**
 * Unpin an item from quick access
 */
export async function unpinItem(itemId) {
  try {
    debugLog('Suggestions', `Unpinning item: ${itemId}`);
    
    // Get current quick access items
    const quickAccessCards = await loadAppState('triageHub_quickAccessCards') || [];
    const itemToUnpin = quickAccessCards.find(item => item.id === itemId);
    
    if (!itemToUnpin) {
      throw new Error('Item not found in quick access');
    }
    
    // Remove from quick access
    const updatedCards = quickAccessCards.filter(item => item.id !== itemId);
    await saveAppState('triageHub_quickAccessCards', updatedCards);
    
    // Update suggestion metadata to start cooldown
    const metadata = await getSuggestionMetadata();
    metadata.unpinnedItems[normalizeUrl(itemToUnpin.url)] = Date.now();
    await saveSuggestionMetadata(metadata);
    
    // Clear suggestions cache since unpinning affects future suggestions
    await clearSuggestionsCache();
    
    debugLog('Suggestions', `Successfully unpinned: ${itemToUnpin.title}`);
    return itemToUnpin;
    
  } catch (error) {
    debugError('Suggestions', 'Error unpinning item:', error);
    throw error;
  }
}

/**
 * Dismiss a suggestion (puts it in cooldown without unpinning anything)
 */
export async function dismissSuggestion(suggestion) {
  try {
    debugLog('Suggestions', `Dismissing suggestion: ${suggestion.title}`);
    
    // Update suggestion metadata to start cooldown
    const metadata = await getSuggestionMetadata();
    if (!metadata.dismissedItems) {
      metadata.dismissedItems = {};
    }
    metadata.dismissedItems[normalizeUrl(suggestion.url)] = Date.now();
    await saveSuggestionMetadata(metadata);
    
    // Clear suggestions cache since dismissing affects future suggestions
    await clearSuggestionsCache();
    
    debugLog('Suggestions', `Successfully dismissed: ${suggestion.title}`);
    return true;
    
  } catch (error) {
    debugError('Suggestions', 'Error dismissing suggestion:', error);
    throw error;
  }
}

/**
 * Get suggestion statistics for debugging
 */
export async function getSuggestionStats() {
  try {
    const historyItems = await getLightweightHistory(500);
    const metadata = await getSuggestionMetadata();
    const pinnedItems = await getPinnedItems();
    const suggestions = await generateSmartSuggestions();
    
    const now = Date.now();
    const cooldownPeriod = SUGGESTION_CONFIG.COOLDOWN_PERIOD_DAYS * 24 * 60 * 60 * 1000;
    
    const activeCooldowns = Object.entries(metadata.unpinnedItems)
      .filter(([url, timestamp]) => (now - timestamp) < cooldownPeriod)
      .length;
    
    return {
      totalSuggestions: suggestions.length,
      totalPinnedItems: pinnedItems.length,
      activeCooldowns,
      totalUnpinnedItems: Object.keys(metadata.unpinnedItems).length,
      historyItemsCount: historyItems.length,
      totalCandidates: new Set(historyItems.map(item => normalizeUrl(item.url))).size,
      alreadyPinnedCount: pinnedItems.length,
      analysisWindowDays: SUGGESTION_CONFIG.ANALYSIS_WINDOW_DAYS,
      config: SUGGESTION_CONFIG,
      suggestions: suggestions.map(s => ({
        title: s.title,
        url: s.url,
        domain: s.domain,
        score: s.score,
        reason: s.suggestionReason,
        daysVisited: s.metrics.uniqueDaysVisited,
        daysSinceRecent: s.metrics.daysSinceRecent,
        lastVisitTime: s.metrics.mostRecentVisit, // Add timestamp for UI
        metrics: s.metrics // Include full metrics object for UI
      }))
    };
  } catch (error) {
    debugError('Suggestions', 'Error getting suggestion stats:', error);
    return null;
  }
}

/**
 * Clear all smart suggestion data including metadata and pinned items
 * @returns {Promise<boolean>} Success status
 */
export async function clearAllSuggestionData() {
  try {
    console.log('[Smart Suggestions] 🗑️ Clearing all suggestion data...');
    
    // Clear suggestion metadata
    await saveSuggestionMetadata({});
    
    // Clear pinned items by getting them and unpinning each
    const pinnedItems = await getPinnedItems();
    for (const item of pinnedItems) {
      await unpinItem(item.id);
    }
    
    // Clear from extension storage if available
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.remove(['triageHub_suggestionMetadata']);
      chrome.storage.local.remove(['triageHub_suggestionMetadata']);
    }
    
    // Clear the suggestions cache
    await clearSuggestionsCache();
    
    console.log('[Smart Suggestions] ✅ All suggestion data cleared');
    return true;
  } catch (error) {
    console.error('[Smart Suggestions] ❌ Error clearing suggestion data:', error);
    return false;
  }
}

/**
 * Clear the suggestions cache to force fresh generation
 */
export async function clearSuggestionsCache() {
  suggestionsCache = null;
  cacheTimestamp = 0;
  
  // Clear from persistent storage too
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.remove(['smartSuggestions_cache', 'smartSuggestions_cacheTime']);
    }
  } catch (error) {
    debugLog('Suggestions', 'Could not clear cache from storage:', error);
  }
  
  debugLog('Suggestions', 'Suggestions cache cleared from memory and storage');
}

/**
 * Get cache info for debugging
 */
export function getCacheInfo() {
  const now = Date.now();
  const age = cacheTimestamp ? now - cacheTimestamp : null;
  const isValid = suggestionsCache && age && age < SUGGESTION_CONFIG.CACHE_DURATION_MS;
  
  return {
    hasCachedData: !!suggestionsCache,
    cacheAge: age,
    cacheValidFor: isValid ? SUGGESTION_CONFIG.CACHE_DURATION_MS - age : 0,
    isValid: isValid,
    cacheDuration: SUGGESTION_CONFIG.CACHE_DURATION_MS
  };
}