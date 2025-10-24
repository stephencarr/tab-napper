/**
 * Smart Suggestions Algorithm for Tab Napper
 * 
 * Advanced algorithm that analyzes browsing patterns to suggest frequently accessed items
 * based on daily visit frequency, recency, and consistency patterns.
 */

import { loadAppState, saveAppState } from './storage.js';
import { getRecentHistoryWithStatus } from './history.js';
import { debugLog, debugError } from './debug.js';

// Configuration constants
const SUGGESTION_CONFIG = {
  ANALYSIS_WINDOW_DAYS: 30,           // Look back 30 days for pattern analysis
  MIN_DAILY_VISITS: 2,                // Minimum days visited to be considered (lowered for testing)
  RECENCY_DECAY_DAYS: 7,              // Days after which recency weight decays
  COOLDOWN_PERIOD_DAYS: 7,            // Days before unpinned items can be suggested again
  MAX_SUGGESTIONS: 4,                 // Maximum number of suggestions to show
  SUGGESTION_THRESHOLD: 0.4,          // Minimum score to be suggested (lowered for testing)
  CONSISTENCY_WEIGHT: 0.4,            // Weight for daily visit consistency
  RECENCY_WEIGHT: 0.3,                // Weight for recent activity
  FREQUENCY_WEIGHT: 0.3,              // Weight for overall frequency
};

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
  if (!metrics || metrics.uniqueDaysVisited < SUGGESTION_CONFIG.MIN_DAILY_VISITS) {
    return 0;
  }
  
  // Normalize scores to 0-1 range
  const normalizedConsistency = Math.min(1, metrics.consistency * 2); // Cap at 50% daily visits
  const normalizedRecency = metrics.recency;
  const normalizedFrequency = Math.min(1, metrics.frequency / 10); // Cap at 10 visits per day
  
  // Weighted score calculation
  const score = (
    normalizedConsistency * SUGGESTION_CONFIG.CONSISTENCY_WEIGHT +
    normalizedRecency * SUGGESTION_CONFIG.RECENCY_WEIGHT +
    normalizedFrequency * SUGGESTION_CONFIG.FREQUENCY_WEIGHT
  );
  
  debugLog('Suggestions', `Score for ${metrics.url}: ${score.toFixed(3)} (consistency: ${normalizedConsistency.toFixed(2)}, recency: ${normalizedRecency.toFixed(2)}, frequency: ${normalizedFrequency.toFixed(2)})`);
  
  return score;
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
      pinnedHistory: {},     // { url: timestamp_when_first_pinned }
      suggestionHistory: {}  // { url: times_suggested }
    };
    return metadata;
  } catch (error) {
    debugError('Suggestions', 'Error loading suggestion metadata:', error);
    return { unpinnedItems: {}, pinnedHistory: {}, suggestionHistory: {} };
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
 * Check if an item is in cooldown period after being unpinned
 */
function isInCooldown(url, metadata) {
  const unpinnedTime = metadata.unpinnedItems[normalizeUrl(url)];
  if (!unpinnedTime) return false;
  
  const now = Date.now();
  const cooldownPeriod = SUGGESTION_CONFIG.COOLDOWN_PERIOD_DAYS * 24 * 60 * 60 * 1000;
  return (now - unpinnedTime) < cooldownPeriod;
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
 */
export async function generateSmartSuggestions() {
  try {
    debugLog('Suggestions', 'Starting smart suggestion generation...');
    
    // Get recent browsing history (extended window for pattern analysis)
    const historyItems = await getRecentHistoryWithStatus(1000);
    if (historyItems.length === 0) {
      debugLog('Suggestions', 'No history items available for analysis');
      return [];
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
    
    return suggestions;
    
  } catch (error) {
    debugError('Suggestions', 'Error generating smart suggestions:', error);
    return [];
  }
}

/**
 * Generate human-readable reason for suggestion
 */
function generateSuggestionReason(metrics) {
  const { uniqueDaysVisited, daysSinceRecent, frequency } = metrics;
  
  if (uniqueDaysVisited >= 10 && daysSinceRecent <= 1) {
    return `Visited ${uniqueDaysVisited} days recently - daily habit detected`;
  } else if (uniqueDaysVisited >= 5 && frequency >= 3) {
    return `Visited ${uniqueDaysVisited} days with high activity`;
  } else if (daysSinceRecent === 0 && frequency >= 2) {
    return `Very active today with consistent usage`;
  } else if (uniqueDaysVisited >= 7) {
    return `Regularly visited over ${uniqueDaysVisited} days`;
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
    
    debugLog('Suggestions', `Successfully unpinned: ${itemToUnpin.title}`);
    return itemToUnpin;
    
  } catch (error) {
    debugError('Suggestions', 'Error unpinning item:', error);
    throw error;
  }
}

/**
 * Get suggestion statistics for debugging
 */
export async function getSuggestionStats() {
  try {
    const historyItems = await getRecentHistoryWithStatus(1000);
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
    
    console.log('[Smart Suggestions] ✅ All suggestion data cleared');
    return true;
  } catch (error) {
    console.error('[Smart Suggestions] ❌ Error clearing suggestion data:', error);
    return false;
  }
}