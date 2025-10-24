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
 * Search across all data sources
 */
async function searchAllData(searchTerm) {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return [];
  }
  
  try {
    // Load all data sources including browsing history
    const [inbox, stashedTabs, quickAccessCards, trash, recentHistory] = await Promise.all([
      loadAppState('triageHub_inbox'),
      loadAppState('triageHub_stashedTabs'),
      loadAppState('triageHub_quickAccessCards'),
      loadAppState('triageHub_trash'),
      getRecentHistoryWithStatus(10000) // Get extensive history for comprehensive search
    ]);
    
    const results = [];
    
    // Search inbox
    if (inbox) {
      inbox.forEach(item => {
        if (searchInItem(item, searchTerm)) {
          results.push({
            ...item,
            source: 'inbox',
            relevance: calculateRelevance(item, searchTerm)
          });
        }
      });
    }
    
    // Search stashed tabs
    if (stashedTabs) {
      stashedTabs.forEach(item => {
        if (searchInItem(item, searchTerm)) {
          results.push({
            ...item,
            source: 'stashedTabs',
            relevance: calculateRelevance(item, searchTerm)
          });
        }
      });
    }
    
    // Search quick access cards
    if (quickAccessCards) {
      quickAccessCards.forEach(item => {
        if (searchInItem(item, searchTerm)) {
          results.push({
            ...item,
            source: 'quickAccessCards',
            relevance: calculateRelevance(item, searchTerm)
          });
        }
      });
    }
    
    // Search trash
    if (trash) {
      trash.forEach(item => {
        if (searchInItem(item, searchTerm)) {
          results.push({
            ...item,
            source: 'trash',
            relevance: calculateRelevance(item, searchTerm)
          });
        }
      });
    }
    
    // Search recent browsing history
    if (recentHistory && recentHistory.length > 0) {
      console.log(`[Tab Napper] Searching ${recentHistory.length} recent history items for "${searchTerm}"`);
      recentHistory.forEach(item => {
        if (searchInItem(item, searchTerm)) {
          console.log(`[Tab Napper] Found history match: "${item.title}"`);
          results.push({
            ...item,
            source: 'recentHistory',
            relevance: calculateRelevance(item, searchTerm)
          });
        }
      });
    } else {
      console.log(`[Tab Napper] No recent history available for search`);
    }
    
    // Sort by relevance (higher is better)
    results.sort((a, b) => b.relevance - a.relevance);
    
    console.log(`[Tab Napper] Search for "${searchTerm}" returned ${results.length} results from all sources`);
    if (results.length > 0) {
      console.log(`[Tab Napper] Top result: "${results[0].title}" (score: ${results[0].relevance}, source: ${results[0].source})`);
    }
    return results;
    
  } catch (error) {
    console.error('[Tab Napper] Error searching data:', error);
    return [];
  }
}

/**
 * Calculate relevance score for search results
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
  
  // Recent items get slight boost
  if (item.timestamp) {
    const daysSinceCreated = (Date.now() - item.timestamp) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 1) score += 2;
    else if (daysSinceCreated < 7) score += 1;
  }
  
  // Source priority (inbox > stashed > quick access > trash)
  switch (item.source) {
    case 'inbox': score += 3; break;
    case 'stashedTabs': score += 2; break;
    case 'quickAccessCards': score += 1; break;
    case 'trash': score -= 1; break;
  }
  
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