/**
 * Search utilities for Tab Napper
 * Provides unified search across all data sources including history
 */

import { loadAppState } from './storage.js';
import { getRecentHistoryWithStatus } from './history.js';

/**
 * Search within a single text field
 */
function searchInText(text, searchTerm) {
  if (!text || !searchTerm) return false;
  return text.toLowerCase().includes(searchTerm.toLowerCase());
}

/**
 * Search within an item (title, description, url, body, summary, etc.)
 */
function searchInItem(item, searchTerm) {
  if (!searchTerm) return true;
  
  const fields = [
    item.title || '',
    item.description || '',
    item.url || '',
    item.name || '',
    item.body || '',
    item.summary || '',
    item.content || '',
    item.text || '',
    item.notes || ''
  ];
  
  return fields.some(field => searchInText(field, searchTerm));
}

/**
 * Search across all data sources with proper segmentation
 */
async function searchAllData(searchTerm) {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return [];
  }
  
  try {
    console.log(`[Tab Napper] 🔍 Starting search for: "${searchTerm}"`);
    
    // Load all data sources including extensive browsing history
    const [inbox, stashedTabs, quickAccessCards, trash] = await Promise.all([
      loadAppState('triageHub_inbox'),
      loadAppState('triageHub_stashedTabs'),
      loadAppState('triageHub_quickAccessCards'),
      loadAppState('triageHub_trash')
    ]);

    // Get browsing history separately with better error handling
    let recentHistory = [];
    try {
      console.log(`[Tab Napper] 📚 Fetching browser history for search...`);
      recentHistory = await getRecentHistoryWithStatus(5000); // Get extensive history for search
      console.log(`[Tab Napper] ✅ Retrieved ${recentHistory.length} history items`);
    } catch (historyError) {
      console.warn('[Tab Napper] ⚠️ Browser history not available:', historyError);
      // Continue with search even if history fails
    }

    const results = [];
    
    // Search inbox (highest priority)
    if (inbox && inbox.length > 0) {
      console.log(`[Tab Napper] 🔍 Searching ${inbox.length} inbox items...`);
      inbox.forEach(item => {
        if (searchInItem(item, searchTerm)) {
          results.push({
            ...item,
            source: 'inbox',
            relevance: calculateRelevance(item, searchTerm) + 10 // Inbox items get priority boost
          });
        }
      });
    }
    
    // Search stashed tabs (high priority)
    if (stashedTabs && stashedTabs.length > 0) {
      console.log(`[Tab Napper] 🔍 Searching ${stashedTabs.length} stashed items...`);
      stashedTabs.forEach(item => {
        if (searchInItem(item, searchTerm)) {
          results.push({
            ...item,
            source: 'stashedTabs',
            relevance: calculateRelevance(item, searchTerm) + 8 // Stashed items get high priority
          });
        }
      });
    }
    
    // Search quick access cards (medium priority)
    if (quickAccessCards && quickAccessCards.length > 0) {
      console.log(`[Tab Napper] 🔍 Searching ${quickAccessCards.length} quick access items...`);
      quickAccessCards.forEach(item => {
        if (searchInItem(item, searchTerm)) {
          results.push({
            ...item,
            source: 'quickAccessCards',
            relevance: calculateRelevance(item, searchTerm) + 5 // Medium priority
          });
        }
      });
    }
    
    // Search recent browsing history (lower priority but important for discovery)
    if (recentHistory && recentHistory.length > 0) {
      console.log(`[Tab Napper] 🔍 Searching ${recentHistory.length} browser history items...`);
      let historyMatches = 0;
      recentHistory.forEach(item => {
        if (searchInItem(item, searchTerm)) {
          historyMatches++;
          results.push({
            ...item,
            source: 'recentHistory',
            relevance: calculateRelevance(item, searchTerm) + 2 // History gets base priority
          });
        }
      });
      console.log(`[Tab Napper] ✅ Found ${historyMatches} matches in browser history`);
    } else {
      console.log(`[Tab Napper] ℹ️ No browser history available for search`);
    }
    
    // Search trash (lowest priority)
    if (trash && trash.length > 0) {
      console.log(`[Tab Napper] 🔍 Searching ${trash.length} trash items...`);
      trash.forEach(item => {
        if (searchInItem(item, searchTerm)) {
          results.push({
            ...item,
            source: 'trash',
            relevance: calculateRelevance(item, searchTerm) - 2 // Trash gets penalty
          });
        }
      });
    }
    
    // Sort by relevance (higher is better) - this ensures segmentation
    results.sort((a, b) => b.relevance - a.relevance);
    
    console.log(`[Tab Napper] 🎯 Search completed: ${results.length} total results`);
    
    // Log result breakdown by source
    const breakdown = results.reduce((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    }, {});
    console.log(`[Tab Napper] 📊 Results by source:`, breakdown);
    
    if (results.length > 0) {
      console.log(`[Tab Napper] 🏆 Top result: "${results[0].title}" (score: ${results[0].relevance}, source: ${results[0].source})`);
    }
    
    return results;
    
  } catch (error) {
    console.error('[Tab Napper] ❌ Error searching data:', error);
    return [];
  }
}

/**
 * Calculate relevance score for search results with proper segmentation
 */
function calculateRelevance(item, searchTerm) {
  let score = 0;
  const term = searchTerm.toLowerCase();
  
  // Title matches are most important (highest weight)
  if (item.title && item.title.toLowerCase().includes(term)) {
    score += 10;
    // Exact title match gets bonus
    if (item.title.toLowerCase() === term) {
      score += 20;
    }
    // Title starts with term gets bonus
    if (item.title.toLowerCase().startsWith(term)) {
      score += 5;
    }
  }
  
  // Body/Summary content matches (high weight for content)
  if (item.body && item.body.toLowerCase().includes(term)) {
    score += 8;
  }
  if (item.summary && item.summary.toLowerCase().includes(term)) {
    score += 8;
  }
  if (item.content && item.content.toLowerCase().includes(term)) {
    score += 8;
  }
  if (item.text && item.text.toLowerCase().includes(term)) {
    score += 6;
  }
  
  // Description matches (medium weight)
  if (item.description && item.description.toLowerCase().includes(term)) {
    score += 5;
  }
  
  // URL matches (lower weight, but still valuable)
  if (item.url && item.url.toLowerCase().includes(term)) {
    score += 3;
    // Domain matches get bonus
    try {
      const url = new URL(item.url);
      if (url.hostname.toLowerCase().includes(term)) {
        score += 2;
      }
    } catch {
      // Invalid URL, skip domain bonus
    }
  }
  
  // Notes and other text fields
  if (item.notes && item.notes.toLowerCase().includes(term)) {
    score += 4;
  }
  
  // Recent items get slight boost (but not too much to override source priority)
  if (item.timestamp) {
    const daysSinceCreated = (Date.now() - item.timestamp) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 1) score += 1;
    else if (daysSinceCreated < 7) score += 0.5;
  }
  
  // Source priority is now handled in the main search function with explicit boosts
  // Base score here, priority boosts applied in searchAllData()
  
  return score;
}

/**
 * Debounced search function
 */
function createDebouncedSearch(delay = 300) {
  let timeoutId = null;
  
  return function(searchTerm, callback) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      const results = await searchAllData(searchTerm);
      callback(results);
    }, delay);
  };
}

export {
  searchAllData,
  searchInItem,
  calculateRelevance,
  createDebouncedSearch
};