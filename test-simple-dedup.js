/**
 * Simple Deduplication Test
 * Tests the new gateway-level deduplication approach
 */

// Test the simple deduplication at capture time
async function testSimpleDeduplication() {
  console.log('🧪 Testing Simple Gateway Deduplication...');
  
  const testUrl = 'https://example.com/test-page';
  const testTitle = 'Test Page';
  
  try {
    // Step 1: Capture the same URL multiple times
    console.log('📥 Capturing URL first time...');
    await window.tabNapperCapture.captureUrl(testUrl, testTitle + ' - First');
    
    console.log('📥 Capturing URL second time (should remove first)...');
    await window.tabNapperCapture.captureUrl(testUrl, testTitle + ' - Second');
    
    console.log('📥 Capturing URL third time (should remove second)...');
    await window.tabNapperCapture.captureUrl(testUrl, testTitle + ' - Third');
    
    // Step 2: Check that only one entry exists
    console.log('🔍 Checking storage for duplicates...');
    
    // This would require access to chrome.storage to verify
    console.log('✅ Test completed! Check the debug console for deduplication logs.');
    console.log('💡 Expected: Only "Test Page - Third" should exist in inbox');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

console.log(`
🎯 Simple Deduplication Implementation

The new approach:
1. ✅ When a tab is captured, check ALL collections (inbox, stashed, trash)
2. ✅ Remove ANY existing entries with the same normalized URL
3. ✅ Add the new entry to inbox with latest data

Benefits:
- Much simpler logic (no complex cross-collection analysis)
- Happens at the gateway (capture time)
- Throws away old entries, keeps new ones
- Works consistently regardless of where duplicates exist

Test: testSimpleDeduplication()
`);

// Expose test function
if (typeof window !== 'undefined') {
  window.testSimpleDeduplication = testSimpleDeduplication;
}