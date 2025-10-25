/**
 * Development utilities for testing Tab Napper
 * Adds sample data to test the full data pipeline
 */

import { saveAppState } from './storage.js';
import { getSuggestionStats, clearAllSuggestionData } from './smartSuggestions.js';

/**
 * Add sample data for testing purposes
 */
async function addSampleData() {
  try {
    console.log('[Tab Napper] Adding sample data for testing...');

    // Sample inbox items
    const sampleInbox = [
      {
        id: 'inbox-1',
        title: 'Research ADHD-friendly UX patterns',
        description: 'Look into best practices for designing interfaces that work well for ADHD users',
        body: 'ADHD-friendly design principles include calm color palettes, reduced cognitive load, clear visual hierarchy, and minimal distractions. Consider using consistent spacing, gentle animations, and intuitive navigation patterns.',
        url: 'https://example.com/adhd-ux',
        timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
        type: 'research'
      },
      {
        id: 'inbox-2', 
        title: 'Chrome Extension Manifest V3 Documentation',
        description: 'Review the latest updates to Manifest V3 requirements',
        summary: 'Manifest V3 introduces service workers, declarative net request API, and enhanced security. Key changes include background script replacement, new permission model, and improved content script capabilities.',
        url: 'https://developer.chrome.com/docs/extensions/mv3/',
        timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
        type: 'documentation'
      },
      {
        id: 'inbox-3',
        title: 'JavaScript Performance Optimization',
        description: 'Techniques for improving web application performance',
        content: 'Performance optimization strategies include code splitting, lazy loading, efficient DOM manipulation, debouncing user input, minimizing reflows and repaints, and optimizing JavaScript execution.',
        url: 'https://example.com/js-performance',
        timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
        type: 'learning'
      }
    ];

    // Sample stashed tabs
    const sampleStashed = [
      {
        id: 'stashed-1',
        title: 'React Hooks Best Practices',
        description: 'Comprehensive guide to using React hooks effectively',
        summary: 'React hooks enable functional components to use state and lifecycle methods. Best practices include using useState for simple state, useEffect for side effects, custom hooks for reusable logic, and proper dependency arrays.',
        url: 'https://react.dev/learn/hooks-overview',
        timestamp: Date.now() - 1000 * 60 * 60 * 24, // 24 hours ago
        type: 'learning'
      },
      {
        id: 'stashed-2',
        title: 'Chrome Extension Storage API',
        description: 'Deep dive into chrome.storage.sync and chrome.storage.local',
        body: 'Chrome storage API provides persistent storage for extensions. chrome.storage.sync synchronizes across devices while chrome.storage.local stays on device. Both support encryption and quota limits.',
        url: 'https://developer.chrome.com/docs/extensions/reference/storage/',
        timestamp: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
        type: 'documentation'
      },
      {
        id: 'stashed-3',
        title: 'MDN JavaScript Reference',
        description: 'Complete JavaScript language reference',
        content: 'MDN provides comprehensive documentation for JavaScript including syntax, built-in objects, operators, statements, functions, and modern ES6+ features like arrow functions, destructuring, and modules.',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference',
        timestamp: Date.now() - 1000 * 60 * 60 * 8, // 8 hours ago
        type: 'reference'
      },
      {
        id: 'stashed-4',
        title: 'VS Code Extension Development',
        description: 'Building extensions for Visual Studio Code',
        text: 'VS Code extensions use TypeScript and Node.js APIs. Key concepts include activation events, contribution points, commands, and the extension manifest. Extensions can add themes, languages, debuggers, and custom UI.',
        url: 'https://code.visualstudio.com/api',
        timestamp: Date.now() - 1000 * 60 * 60 * 6, // 6 hours ago
        type: 'development'
      }
    ];

    // Sample quick access cards
    const sampleQuickAccess = [
      {
        id: 'quick-1',
        title: 'GitHub - Main Repository',
        description: 'Primary development repository',
        url: 'https://github.com/stephencarr/tab-napper',
        type: 'development',
        accessCount: 15,
        lastAccessed: Date.now() - 1000 * 60 * 45 // 45 minutes ago
      },
      {
        id: 'quick-2',
        title: 'MDN Web API Documentation',
        description: 'Essential web development reference',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API',
        type: 'documentation',
        accessCount: 8,
        lastAccessed: Date.now() - 1000 * 60 * 60 * 2 // 2 hours ago
      },
      {
        id: 'quick-3',
        title: 'React Documentation',
        description: 'Official React documentation and guides',
        url: 'https://react.dev',
        type: 'documentation',
        accessCount: 12,
        lastAccessed: Date.now() - 1000 * 60 * 30 // 30 minutes ago
      },
      {
        id: 'quick-4',
        title: 'Chrome Extension Developer Guide',
        description: 'Complete guide to Chrome extension development',
        url: 'https://developer.chrome.com/docs/extensions/',
        type: 'documentation',
        accessCount: 6,
        lastAccessed: Date.now() - 1000 * 60 * 60 * 4 // 4 hours ago
      },
      {
        id: 'quick-5',
        title: 'VS Code Settings Sync',
        description: 'Sync VS Code settings across devices',
        url: 'https://code.visualstudio.com/docs/editor/settings-sync',
        type: 'tool',
        accessCount: 3,
        lastAccessed: Date.now() - 1000 * 60 * 60 * 6 // 6 hours ago
      }
    ];

    // Save sample data
    await saveAppState('triageHub_inbox', sampleInbox);
    await saveAppState('triageHub_stashedTabs', sampleStashed);
    await saveAppState('triageHub_quickAccessCards', sampleQuickAccess);

    console.log('[Tab Napper] Sample data added successfully');
    return true;
  } catch (error) {
    console.error('[Tab Napper] Error adding sample data:', error);
    return false;
  }
}

/**
 * Clear all sample data for testing purposes
 */
async function clearSampleData() {
  try {
    console.log('[Tab Napper] Clearing sample data...');
    
    // Clear all storage buckets
    await saveAppState('triageHub_inbox', []);
    await saveAppState('triageHub_stashedTabs', []);
    await saveAppState('triageHub_trash', []);
    await saveAppState('triageHub_quickAccessCards', []);
    
    // Clear mock history from window
    if (typeof window !== 'undefined') {
      delete window._mockHistoryData;
    }
    
    // Clear mock history from extension storage
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.remove(['tabNapper_mockHistory']);
        console.log('[Tab Napper] 🗑️ Cleared mock data from extension storage');
      }
    } catch (error) {
      console.warn('[Tab Napper] Could not clear mock data from storage:', error);
    }

    // Clear all smart suggestion data
    await clearAllSuggestionData();

    console.log('[Tab Napper] Sample data cleared');
    return true;
  } catch (error) {
    console.error('[Tab Napper] Error clearing sample data:', error);
    return false;
  }
}

/**
 * Generate realistic browsing history for testing smart suggestions
 */
async function generateTestBrowsingHistory() {
  try {
    console.log('[Tab Napper] Generating test browsing history for smart suggestions...');
    
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Generate visits for popular developer sites over the last 30 days
    const testSites = [
      {
        url: 'https://stackoverflow.com/questions/tagged/javascript',
        title: 'javascript - Stack Overflow',
        dailyVisits: 15, // Very frequent - should score high
        daysActive: 28,  // Almost daily
        lastVisit: now - (2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        url: 'https://github.com/microsoft/vscode',
        title: 'microsoft/vscode: Visual Studio Code',
        dailyVisits: 8,
        daysActive: 20,
        lastVisit: now - (1 * 60 * 60 * 1000) // 1 hour ago
      },
      {
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        title: 'JavaScript | MDN',
        dailyVisits: 12,
        daysActive: 25,
        lastVisit: now - (30 * 60 * 1000) // 30 minutes ago
      },
      {
        url: 'https://react.dev/learn',
        title: 'Learn React',
        dailyVisits: 6,
        daysActive: 18,
        lastVisit: now - (4 * 60 * 60 * 1000) // 4 hours ago
      },
      {
        url: 'https://tailwindcss.com/docs',
        title: 'Tailwind CSS Documentation',
        dailyVisits: 4,
        daysActive: 22,
        lastVisit: now - (1 * oneDay) // 1 day ago
      },
      {
        url: 'https://example.com/old-site',
        title: 'Old Site - High Count But Ancient',
        dailyVisits: 50, // High count but old
        daysActive: 5,
        lastVisit: now - (20 * oneDay) // 20 days ago - should score low due to recency
      }
    ];
    
    // Generate mock history entries
    const mockHistory = [];
    
    testSites.forEach((site, siteIndex) => {
      // Generate visits across multiple days
      for (let day = 0; day < site.daysActive; day++) {
        const dayTimestamp = now - (day * oneDay);
        
        // Add multiple visits per day (random between 1 and dailyVisits)
        const visitsThisDay = Math.floor(Math.random() * site.dailyVisits) + 1;
        
        for (let visit = 0; visit < visitsThisDay; visit++) {
          // Random time within the day
          const randomTime = dayTimestamp - Math.floor(Math.random() * oneDay);
          
          mockHistory.push({
            id: `mock-${siteIndex}-${day}-${visit}`,
            url: site.url,
            title: site.title,
            lastVisitTime: day === 0 && visit === 0 ? site.lastVisit : randomTime,
            visitCount: 1,
            typedCount: visit === 0 ? 1 : 0 // First visit of day is typed
          });
        }
      }
    });
    
    // Sort by most recent first
    mockHistory.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
    
    console.log(`[Tab Napper] Generated ${mockHistory.length} mock history entries`);
    console.log('[Tab Napper] Sites that should score high for suggestions:');
    testSites.slice(0, 4).forEach(site => {
      console.log(`  - ${site.title} (${site.daysActive}d active, ${site.dailyVisits} daily visits)`);
    });
    
    // Store in multiple ways for persistence
    if (typeof window !== 'undefined') {
      window._mockHistoryData = mockHistory;
      
      // Also store in extension storage for persistence
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ 'tabNapper_mockHistory': mockHistory });
          console.log('[Tab Napper] 💾 Mock data also stored in extension storage');
        }
      } catch (error) {
        console.warn('[Tab Napper] Could not store in extension storage:', error);
      }
      
      // Clear any cached history data so mock data will be used
      if (window._clearHistoryCache) {
        try {
          window._clearHistoryCache();
          console.log('[Tab Napper] 🔄 Cleared history cache to use mock data');
        } catch (error) {
          console.warn('[Tab Napper] Error clearing cache:', error);
        }
      }
      
      // Also clear any suggestion caches that might exist
      if (window._clearSuggestionCache) {
        try {
          window._clearSuggestionCache();
          console.log('[Tab Napper] 🔄 Cleared suggestion cache');
        } catch (error) {
          console.warn('[Tab Napper] Error clearing suggestion cache:', error);
        }
      }
      
      console.log('[Tab Napper] Mock history stored in window._mockHistoryData');
      console.log(`[Tab Napper] Stored ${mockHistory.length} entries`);
      console.log('[Tab Napper] Sample entry:', mockHistory[0]);
      console.log('[Tab Napper] 💡 Now click "Test Smart Suggestions" to see results!');
      
      // Verify it was stored correctly
      if (window._mockHistoryData && window._mockHistoryData.length > 0) {
        console.log(`[Tab Napper] ✅ Verification: ${window._mockHistoryData.length} entries stored successfully`);
      } else {
        console.error('[Tab Napper] ❌ Verification failed: mock data not properly stored');
      }
    } else {
      console.error('[Tab Napper] ❌ Window object not available, cannot store mock data');
    }
    
    return mockHistory;
    
  } catch (error) {
    console.error('[Tab Napper] Error generating test browsing history:', error);
    
    // Ensure we don't break the UI - return empty array
    if (typeof window !== 'undefined') {
      window._mockHistoryData = [];
    }
    
    return [];
  }
}

/**
 * Test smart suggestions algorithm
 */
async function testSmartSuggestions() {
  try {
    console.log('[Tab Napper] Testing smart suggestions algorithm...');
    
    // First, let's see if we have any history data
    console.log('[Tab Napper] Checking for mock history data...');
    console.log('[Tab Napper] window object available:', typeof window !== 'undefined');
    console.log('[Tab Napper] window._mockHistoryData exists:', typeof window !== 'undefined' && window._mockHistoryData !== undefined);
    
    if (typeof window !== 'undefined' && window._mockHistoryData) {
      console.log(`[Tab Napper] Found ${window._mockHistoryData.length} mock history entries`);
      console.log('[Tab Napper] Sample entry:', window._mockHistoryData[0]);
    } else {
      console.log('[Tab Napper] No mock history data found');
      console.log('[Tab Napper] 💡 TIP: Run TriageHub_generateTestHistory() first to generate test data');
    }
    
    const stats = await getSuggestionStats();
    if (stats) {
      console.log('[Tab Napper] Smart Suggestions Stats:', stats);
      
      if (stats.suggestions.length > 0) {
        console.log('[Tab Napper] Top suggestions:');
        stats.suggestions.forEach((suggestion, index) => {
          console.log(`  ${index + 1}. ${suggestion.title}`);
          console.log(`     Score: ${suggestion.score.toFixed(3)}, Days: ${suggestion.daysVisited}, Recent: ${suggestion.daysSinceRecent}d ago`);
          console.log(`     Reason: ${suggestion.reason}`);
        });
      } else {
        console.log('[Tab Napper] No suggestions generated.');
        console.log('[Tab Napper] Debug info:');
        console.log('  - Total candidates analyzed:', stats.totalCandidates);
        console.log('  - History items count:', stats.historyItemsCount);
        console.log('  - Already pinned items count:', stats.alreadyPinnedCount);
        console.log('  - Analysis window (days):', stats.analysisWindowDays);
      }
    } else {
      console.log('[Tab Napper] Failed to get suggestion stats');
    }
    
  } catch (error) {
    console.error('[Tab Napper] Error testing smart suggestions:', error);
  }
}

/**
 * List all active Chrome alarms for debugging
 */
async function listActiveAlarms() {
  if (typeof chrome === 'undefined' || !chrome.alarms) {
    console.warn('[Tab Napper] Chrome alarms API not available');
    return;
  }
  
  try {
    chrome.alarms.getAll((alarms) => {
      console.log(`[Tab Napper] Active alarms: ${alarms.length}`);
      
      if (alarms.length === 0) {
        console.log('[Tab Napper] No active alarms found');
        console.log('[Tab Napper] 💡 TIP: Schedule some items to see alarms here');
        return;
      }
      
      const now = Date.now();
      alarms.forEach((alarm, index) => {
        const scheduledTime = alarm.scheduledTime;
        const timeUntil = scheduledTime - now;
        const minutesUntil = Math.floor(timeUntil / 60000);
        const hoursUntil = Math.floor(minutesUntil / 60);
        
        console.log(`\n${index + 1}. ${alarm.name}`);
        console.log(`   Scheduled for: ${new Date(scheduledTime).toLocaleString()}`);
        
        if (timeUntil < 0) {
          console.log(`   ⚠️ OVERDUE by ${Math.abs(minutesUntil)} minutes`);
        } else if (minutesUntil < 60) {
          console.log(`   ⏰ Fires in ${minutesUntil} minutes`);
        } else {
          console.log(`   ⏰ Fires in ${hoursUntil} hours (${minutesUntil} minutes)`);
        }
        
        if (alarm.periodInMinutes) {
          console.log(`   🔄 Repeats every ${alarm.periodInMinutes} minutes`);
        }
      });
    });
  } catch (error) {
    console.error('[Tab Napper] Error listing alarms:', error);
  }
}

/**
 * Test the notification system
 */
async function testNotification() {
  if (typeof chrome === 'undefined' || !chrome.notifications) {
    console.warn('[Tab Napper] Chrome notifications API not available');
    return;
  }
  
  try {
    console.log('[Tab Napper] Creating test notification...');
    
    const notificationOptions = {
      type: 'basic',
      iconUrl: '/icons/icon128.svg',
      title: 'Tab Napper Test Notification',
      message: 'This is a test notification. It should be sticky and require interaction.',
      priority: 2,
      requireInteraction: true,
      buttons: [
        { title: 'Open Tab Napper' },
        { title: 'Dismiss' }
      ]
    };
    
    chrome.notifications.create('test-notification', notificationOptions, (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error('[Tab Napper] ❌ Error creating notification:', chrome.runtime.lastError);
      } else {
        console.log('[Tab Napper] ✅ Test notification created:', notificationId);
        console.log('[Tab Napper] Check your system notifications!');
      }
    });
  } catch (error) {
    console.error('[Tab Napper] Error testing notification:', error);
  }
}

/**
 * Test alarm system by creating a test alarm that fires in 10 seconds
 */
async function testAlarm() {
  if (typeof chrome === 'undefined' || !chrome.alarms) {
    console.warn('[Tab Napper] Chrome alarms API not available');
    return;
  }
  
  try {
    console.log('[Tab Napper] Creating test alarm (fires in 10 seconds)...');
    
    chrome.alarms.create('test-alarm', {
      delayInMinutes: 0.167 // 10 seconds
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('[Tab Napper] ❌ Error creating test alarm:', chrome.runtime.lastError);
      } else {
        console.log('[Tab Napper] ✅ Test alarm created');
        console.log('[Tab Napper] Watch the console for alarm firing in ~10 seconds');
        console.log('[Tab Napper] You should also see a notification when it fires');
      }
    });
  } catch (error) {
    console.error('[Tab Napper] Error creating test alarm:', error);
  }
}

// Expose functions globally for easy testing in console
if (typeof window !== 'undefined') {
  window.TriageHub_addSampleData = addSampleData;
  window.TriageHub_clearSampleData = clearSampleData;
  window.TriageHub_generateTestHistory = generateTestBrowsingHistory;
  window.TriageHub_testSmartSuggestions = testSmartSuggestions;
  window.TriageHub_listAlarms = listActiveAlarms;
  window.TriageHub_testNotification = testNotification;
  window.TriageHub_testAlarm = testAlarm;
}

export {
  addSampleData,
  clearSampleData,
  generateTestBrowsingHistory,
  testSmartSuggestions,
  listActiveAlarms,
  testNotification,
  testAlarm
};