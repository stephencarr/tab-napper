/**
 * Development utilities for testing Triage Hub
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
        url: 'https://example.com/adhd-ux',
        timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
        type: 'research'
      },
      {
        id: 'inbox-2', 
        title: 'Chrome Extension Manifest V3 Documentation',
        description: 'Review the latest updates to Manifest V3 requirements',
        url: 'https://developer.chrome.com/docs/extensions/mv3/',
        timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
        type: 'documentation'
      }
    ];

    // Sample stashed tabs
    const sampleStashed = [
      {
        id: 'stashed-1',
        title: 'React Hooks Best Practices',
        description: 'Comprehensive guide to using React hooks effectively',
        url: 'https://example.com/react-hooks',
        timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        type: 'learning'
      }
    ];

    // Sample quick access cards (encrypted in sync storage)
    const sampleQuickAccess = [
      {
        id: 'quick-1',
        title: 'Daily Standup Notes',
        description: 'Quick access to today\'s standup meeting notes',
        url: 'https://example.com/standup',
        type: 'meeting'
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