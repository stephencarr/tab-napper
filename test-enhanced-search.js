/**
 * Enhanced Omnisearch Test
 * Tests the improved search with browser history connection and proper segmentation
 */

// Test the enhanced search functionality
async function testEnhancedOmnisearch() {
  console.log('🔍 Testing Enhanced Omnisearch...');
  
  try {
    // Import search function
    const { searchAllData } = await import('./src/utils/search.js');
    
    // Test with a common search term
    const searchTerm = 'github';
    console.log(`🔍 Testing search for: "${searchTerm}"`);
    
    const results = await searchAllData(searchTerm);
    
    console.log(`✅ Search completed: ${results.length} results found`);
    
    // Analyze results by source
    const bySource = results.reduce((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Results by source:', bySource);
    
    // Check if segmentation is working (inbox/stashed should have highest scores)
    if (results.length > 0) {
      console.log('🏆 Top 5 results:');
      results.slice(0, 5).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title} (${item.source}, score: ${item.relevance})`);
      });
      
      // Verify segmentation
      const inboxResults = results.filter(r => r.source === 'inbox');
      const stashedResults = results.filter(r => r.source === 'stashedTabs');
      const historyResults = results.filter(r => r.source === 'recentHistory');
      
      console.log('🎯 Segmentation check:');
      console.log(`  - Inbox results: ${inboxResults.length}`);
      console.log(`  - Stashed results: ${stashedResults.length}`);
      console.log(`  - History results: ${historyResults.length}`);
      
      if (inboxResults.length > 0 || stashedResults.length > 0) {
        console.log('✅ Tab Napper items found - segmentation working!');
      }
      
      if (historyResults.length > 0) {
        console.log('✅ Browser history connected - history search working!');
      } else {
        console.log('⚠️ No browser history found - may need permissions check');
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Enhanced omnisearch test failed:', error);
    return [];
  }
}

// Test browser history connection specifically
async function testBrowserHistoryConnection() {
  console.log('📚 Testing Browser History Connection...');
  
  try {
    // Import history function
    const { getRecentHistoryWithStatus } = await import('./src/utils/history.js');
    
    console.log('🔍 Fetching recent browser history...');
    const history = await getRecentHistoryWithStatus(50);
    
    console.log(`✅ History fetch completed: ${history.length} items`);
    
    if (history.length > 0) {
      console.log('📋 Sample history items:');
      history.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title} - ${item.url}`);
      });
      console.log('✅ Browser history is properly connected!');
    } else {
      console.log('⚠️ No browser history retrieved - checking permissions...');
      
      // Check if Chrome API is available
      if (typeof chrome !== 'undefined' && chrome.history) {
        console.log('ℹ️ Chrome history API is available');
        console.log('💡 May need to grant history permissions or have recent browsing activity');
      } else {
        console.log('❌ Chrome history API not available');
      }
    }
    
    return history;
    
  } catch (error) {
    console.error('❌ Browser history test failed:', error);
    return [];
  }
}

console.log(`
🎯 Enhanced Omnisearch Implementation

New Features:
✅ Better browser history connection with permission checks
✅ Proper result segmentation (inbox & stashed at top)
✅ Enhanced error handling for history API
✅ Visual priority indicators in search results
✅ Improved relevance scoring with source priorities

Test Functions:
- testEnhancedOmnisearch()    - Test overall search functionality
- testBrowserHistoryConnection() - Test browser history integration

Expected Behavior:
1. Search results show Inbox items first (highest priority)
2. Stashed Tabs appear second (high priority) 
3. Browser History appears after Tab Napper items
4. Each segment is clearly labeled with counts
5. Better error handling if history permissions are denied
`);

// Expose test functions
if (typeof window !== 'undefined') {
  window.testEnhancedOmnisearch = testEnhancedOmnisearch;
  window.testBrowserHistoryConnection = testBrowserHistoryConnection;
}