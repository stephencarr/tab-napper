# Performance Fixes - CPU Spike on Tab Napper Load

## Problem Summary

Tab Napper was experiencing significant CPU spikes when loading, causing the browser to freeze briefly. Multiple heavy operations were running simultaneously on startup.

## Root Causes Identified

### 1. **Overlapping History API Calls**
- `SmartSuggestions` component: 1000ms delay, fetching 300 history items
- `RecentlyVisited` component: 800ms delay, fetching 250 history items (50 * 5)
- **Result**: Both components hitting Chrome's history API within 200ms of each other

### 2. **Excessive Data Processing**
- `SmartSuggestions` analyzing up to 100 URLs synchronously
- Complex score calculations running on main thread
- Each URL requires daily visit metrics, consistency scores, and frequency analysis

### 3. **Background Script Overhead**
- Querying ALL tabs on startup synchronously
- Processing all tabs immediately in a single batch
- No rate limiting or batching

### 4. **Large Data Fetches**
- History API calls requesting 300+ items
- Over-provisioning data that wasn't all needed

## Fixes Applied

### 1. **Staggered Component Loading** ⏱️

**SmartSuggestions.jsx:**
```diff
- }, 1000); // 1 second delay
+ }, 3000); // 3 second delay to prioritize inbox/stashed items
```

**RecentlyVisited.jsx:**
```diff
- }, 800); // 800ms to reduce startup load
+ }, 1500); // 1500ms to avoid overlap with SmartSuggestions
```

**Impact**: Reduces concurrent Chrome API calls from 2 to sequential loading

### 2. **Reduced Data Fetching** 📉

**smartSuggestions.js - History Fetch:**
```diff
- maxResults: Math.min(maxResults, 300), // 300 results
+ maxResults: Math.min(maxResults, 200), // 200 results for faster performance
```

**smartSuggestions.js - URL Processing:**
```diff
- const MAX_URLS_TO_PROCESS = 100; // Safety limit
+ const MAX_URLS_TO_PROCESS = 50; // Reduced for faster processing
```

**RecentlyVisited.jsx - Fetch Budget:**
```diff
- const searchBudget = Math.max(50, maxItems * 5); // 5x multiplier
+ const searchBudget = Math.max(50, maxItems * 3); // 3x multiplier
```

**Impact**: 
- 33% reduction in history items fetched by SmartSuggestions (300→200)
- 50% reduction in URLs analyzed (100→50)
- 40% reduction in RecentlyVisited fetch (250→150)

### 3. **Timeout Improvements** ⚡

**smartSuggestions.js:**
```diff
- setTimeout(() => reject(new Error('History fetch timeout')), 5000)
+ setTimeout(() => reject(new Error('History fetch timeout')), 3000)
```

**Impact**: Faster failure detection prevents hanging on slow history queries

### 4. **Batched Background Processing** 🔄

**background.js:**
```diff
- tabs.forEach(tab => trackTab(tab));
- console.log('[Tab Napper] Tracking', tabs.length, 'existing tabs');
+ // Process tabs in smaller batches to avoid blocking
+ const batchSize = 20;
+ let processed = 0;
+ 
+ function processBatch() {
+   const batch = tabs.slice(processed, processed + batchSize);
+   batch.forEach(tab => trackTab(tab));
+   processed += batchSize;
+   
+   if (processed < tabs.length) {
+     // Schedule next batch asynchronously
+     setTimeout(processBatch, 100);
+   } else {
+     console.log('[Tab Napper] Tracking', tabs.length, 'existing tabs');
+   }
+ }
+ 
+ processBatch();
```

**Impact**: Spreads tab tracking load over time instead of blocking startup

## Performance Impact Summary

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| SmartSuggestions delay | 1.0s | 3.0s | Deferred |
| RecentlyVisited delay | 0.8s | 1.5s | Better spacing |
| History fetch (Smart) | 300 items | 200 items | -33% |
| URL analysis limit | 100 URLs | 50 URLs | -50% |
| History fetch (Recent) | 250 items | 150 items | -40% |
| Timeout duration | 5s | 3s | -40% |
| Tab tracking | Synchronous | Batched (20/100ms) | Async |

## Testing Checklist

- [ ] Load extension with 50+ open tabs
- [ ] Monitor CPU usage in Chrome Task Manager
- [ ] Check for smooth initial load (no freeze)
- [ ] Verify SmartSuggestions still generates relevant results
- [ ] Verify RecentlyVisited shows recent items
- [ ] Test with large browsing history (1000+ items)
- [ ] Verify background script captures tab closures correctly

## Expected Behavior

**Before:**
- CPU spike to 100% for 2-3 seconds
- Browser UI freeze
- All components trying to load simultaneously

**After:**
- Gradual CPU usage increase
- No UI freeze
- Components load sequentially:
  1. 0-1s: Core app initialization, inbox/stashed tabs
  2. 1.5s: RecentlyVisited starts loading
  3. 3s: SmartSuggestions starts loading
- Background tab tracking spreads over ~500ms for 100 tabs

## Future Optimization Opportunities

1. **Web Workers**: Move SmartSuggestions analysis to a Web Worker
2. **Incremental Rendering**: Show first 5 suggestions immediately, load rest progressively
3. **IndexedDB Caching**: Cache processed history analysis for faster subsequent loads
4. **Virtual Scrolling**: For RecentlyVisited when showing 50+ items
5. **Request Throttling**: Implement exponential backoff for Chrome API calls

## Notes

- Changes maintain feature parity - no functionality removed
- All delays are perceptible but reasonable for a dashboard widget
- SmartSuggestions has 1-hour cache, so 3s delay only happens on first load
- Background script still tracks all tabs, just spreads the work

---

**Version**: 0.7.1 (performance improvements)  
**Date**: 2025-10-28  
**Related Issue**: CPU spike on Tab Napper load
