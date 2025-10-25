/**
 * Debug History Fetching
 * Helper script to test and debug browser history retrieval
 */

// Debug function to check raw Chrome history API
async function debugChromeHistory() {
  console.log('🔍 Debug: Testing Chrome History API directly...');
  
  if (typeof chrome === 'undefined' || !chrome.history) {
    console.error('❌ Chrome history API not available');
    return;
  }
  
  try {
    // Test different time windows
    const timeWindows = [
      { name: '1 day', ms: 1 * 24 * 60 * 60 * 1000 },
      { name: '7 days', ms: 7 * 24 * 60 * 60 * 1000 },
      { name: '30 days', ms: 30 * 24 * 60 * 60 * 1000 },
      { name: '90 days', ms: 90 * 24 * 60 * 60 * 1000 },
      { name: '1 year', ms: 365 * 24 * 60 * 60 * 1000 }
    ];
    
    for (const window of timeWindows) {
      console.log(`\n📅 Testing ${window.name} window...`);
      
      const historyItems = await new Promise((resolve, reject) => {
        chrome.history.search(
          {
            text: '',
            maxResults: 10000,
            startTime: Date.now() - window.ms
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
      
      console.log(`  ✅ Found ${historyItems.length} items in ${window.name}`);
      
      if (historyItems.length > 0) {
        const oldestItem = historyItems[historyItems.length - 1];
        const newestItem = historyItems[0];
        
        console.log(`  📊 Date range:`);
        console.log(`    Newest: ${new Date(newestItem.lastVisitTime).toLocaleString()}`);
        console.log(`    Oldest: ${new Date(oldestItem.lastVisitTime).toLocaleString()}`);
        
        // Show sample URLs
        console.log(`  📝 Sample items:`);
        historyItems.slice(0, 3).forEach((item, index) => {
          console.log(`    ${index + 1}. ${item.title} - ${item.url}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing Chrome history:', error);
  }
}

// Debug function to check Tab Napper's history wrapper
async function debugTabNapperHistory() {
  console.log('\n🔍 Debug: Testing Tab Napper history wrapper...');
  
  try {
    // Import our history function
    const { getRecentHistoryWithStatus } = await import('./src/utils/history.js');
    
    // Test different request sizes
    const requestSizes = [100, 1000, 5000, 25000];
    
    for (const size of requestSizes) {
      console.log(`\n📊 Testing request for ${size} items...`);
      
      const startTime = Date.now();
      const history = await getRecentHistoryWithStatus(size);
      const duration = Date.now() - startTime;
      
      console.log(`  ✅ Retrieved ${history.length} items in ${duration}ms`);
      
      if (history.length > 0) {
        const withStatus = history.filter(item => item.isCurrentlyOpen || item.isPreviouslyStashed);
        console.log(`  📋 Items with status indicators: ${withStatus.length}`);
        
        console.log(`  📝 Sample items:`);
        history.slice(0, 3).forEach((item, index) => {
          const date = new Date(item.lastVisitTime).toLocaleDateString();
          console.log(`    ${index + 1}. ${item.title} (${date}) - ${item.url}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing Tab Napper history:', error);
  }
}

// Debug function to search for specific terms
async function debugHistorySearch(searchTerm = 'github') {
  console.log(`\n🔍 Debug: Searching history for "${searchTerm}"...`);
  
  try {
    // Import search function
    const { searchAllData } = await import('./src/utils/search.js');
    
    console.log(`🔍 Testing search for: "${searchTerm}"`);
    const results = await searchAllData(searchTerm);
    
    console.log(`✅ Search completed: ${results.length} total results`);
    
    // Filter just history results
    const historyResults = results.filter(r => r.source === 'recentHistory');
    console.log(`📚 History results: ${historyResults.length}`);
    
    if (historyResults.length > 0) {
      console.log(`📝 History matches:`);
      historyResults.slice(0, 10).forEach((item, index) => {
        const date = new Date(item.lastVisitTime).toLocaleDateString();
        console.log(`  ${index + 1}. ${item.title} (${date}, score: ${item.relevance}) - ${item.url}`);
      });
    } else {
      console.log(`⚠️ No history results found for "${searchTerm}"`);
      
      // Try a direct Chrome API search for comparison
      if (typeof chrome !== 'undefined' && chrome.history) {
        console.log(`🔍 Testing direct Chrome search for "${searchTerm}"...`);
        
        const directResults = await new Promise((resolve, reject) => {
          chrome.history.search(
            {
              text: searchTerm,
              maxResults: 100,
              startTime: Date.now() - (365 * 24 * 60 * 60 * 1000) // 1 year
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
        
        console.log(`  📊 Direct Chrome search found ${directResults.length} items`);
        if (directResults.length > 0) {
          directResults.slice(0, 5).forEach((item, index) => {
            const date = new Date(item.lastVisitTime).toLocaleDateString();
            console.log(`    ${index + 1}. ${item.title} (${date}) - ${item.url}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing history search:', error);
  }
}

console.log(`
🔧 History Debug Tools

Available Functions:
- debugChromeHistory()           - Test raw Chrome History API with different time windows
- debugTabNapperHistory()        - Test Tab Napper's history wrapper function
- debugHistorySearch('term')     - Test search functionality for specific terms

Example Usage:
debugChromeHistory()
debugTabNapperHistory()
debugHistorySearch('github')
debugHistorySearch('youtube')

This will help identify:
1. How much history Chrome is actually returning
2. What time ranges are being used
3. Whether the issue is in retrieval or search filtering
4. Performance of different request sizes
`);

// Expose functions globally
if (typeof window !== 'undefined') {
  window.debugChromeHistory = debugChromeHistory;
  window.debugTabNapperHistory = debugTabNapperHistory;
  window.debugHistorySearch = debugHistorySearch;
}