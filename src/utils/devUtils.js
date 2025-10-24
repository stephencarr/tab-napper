/**
 * Development utilities for testing Tab Napper
 * Adds sample data to test the full data pipeline
 */

import { saveAppState } from './storage.js';

/**
 * Add sample data for testing purposes
 */
async function addSampleData() {
  try {
    console.log('[Triage Hub] Adding sample data for testing...');

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
        timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
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

    // Sample quick access cards (encrypted in sync storage)
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

    console.log('[Triage Hub] Sample data added successfully');
    return true;
  } catch (error) {
    console.error('[Triage Hub] Error adding sample data:', error);
    return false;
  }
}

/**
 * Clear all sample data
 */
async function clearSampleData() {
  try {
    console.log('[Triage Hub] Clearing sample data...');
    
    await saveAppState('triageHub_inbox', []);
    await saveAppState('triageHub_stashedTabs', []);
    await saveAppState('triageHub_trash', []);
    await saveAppState('triageHub_quickAccessCards', []);

    console.log('[Triage Hub] Sample data cleared');
    return true;
  } catch (error) {
    console.error('[Triage Hub] Error clearing sample data:', error);
    return false;
  }
}

// Expose functions globally for easy testing in console
if (typeof window !== 'undefined') {
  window.TriageHub_addSampleData = addSampleData;
  window.TriageHub_clearSampleData = clearSampleData;
}

export {
  addSampleData,
  clearSampleData
};