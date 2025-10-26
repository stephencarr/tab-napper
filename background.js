/**
 * Tab Napper - Background Service Worker
 * Handles tab lifecycle events including:
 * - Regular tab closures (capture to inbox)
 * - Note tab closure and re-triage
 * - Scheduled reminders
 */

console.log('[Tab Napper] Background service worker loaded');

// Track all tabs so we know their information when they close
const tabTracker = new Map(); // Map<tabId, tabInfo>
const noteTabTracker = new Map(); // Map<tabId, noteId>

/**
 * Normalize URL for deduplication
 */
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    // Remove fragment and common tracking parameters
    urlObj.hash = '';
    urlObj.searchParams.delete('utm_source');
    urlObj.searchParams.delete('utm_medium');
    urlObj.searchParams.delete('utm_campaign');
    urlObj.searchParams.delete('fbclid');
    urlObj.searchParams.delete('gclid');
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Capture a closed tab to the inbox with deduplication
 */
async function captureClosedTab(tabInfo) {
  try {
    console.log('[Tab Napper] 🎯 Capturing closed tab:', tabInfo.title);
    console.log('[Tab Napper] 📍 URL:', tabInfo.url);
    
    const normalizedUrl = normalizeUrl(tabInfo.url);
    
    // Load all collections
    const result = await chrome.storage.local.get(['triageHub_inbox', 'triageHub_stashedTabs', 'triageHub_trash']);
    const triageInbox = result.triageHub_inbox || [];
    const stashedTabs = result.triageHub_stashedTabs || [];
    const trash = result.triageHub_trash || [];
    
    let removedFrom = [];
    
    // Remove duplicates from inbox
    const inboxDuplicates = triageInbox.filter(item => normalizeUrl(item.url || '') === normalizedUrl);
    if (inboxDuplicates.length > 0) {
      const cleanedInbox = triageInbox.filter(item => normalizeUrl(item.url || '') !== normalizedUrl);
      await chrome.storage.local.set({ triageHub_inbox: cleanedInbox });
      removedFrom.push(`inbox (${inboxDuplicates.length})`);
    }
    
    // Remove duplicates from stashed tabs
    const stashedDuplicates = stashedTabs.filter(item => normalizeUrl(item.url || '') === normalizedUrl);
    if (stashedDuplicates.length > 0) {
      const cleanedStashed = stashedTabs.filter(item => normalizeUrl(item.url || '') !== normalizedUrl);
      await chrome.storage.local.set({ triageHub_stashedTabs: cleanedStashed });
      removedFrom.push(`stashed (${stashedDuplicates.length})`);
    }
    
    // Remove duplicates from trash
    const trashDuplicates = trash.filter(item => normalizeUrl(item.url || '') === normalizedUrl);
    if (trashDuplicates.length > 0) {
      const cleanedTrash = trash.filter(item => normalizeUrl(item.url || '') !== normalizedUrl);
      await chrome.storage.local.set({ triageHub_trash: cleanedTrash });
      removedFrom.push(`trash (${trashDuplicates.length})`);
    }
    
    if (removedFrom.length > 0) {
      console.log('[Tab Napper] ✅ Removed duplicates from:', removedFrom.join(', '));
    }
    
    // Create new inbox item
    const inboxItem = {
      id: `inbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: tabInfo.title || 'Untitled',
      description: `Captured from ${new URL(tabInfo.url).hostname}`,
      url: tabInfo.url,
      timestamp: Date.now(),
      type: 'captured-tab',
      source: 'capture',
      favicon: tabInfo.favIconUrl || null
    };
    
    // Add to beginning of inbox
    const updatedInbox = await chrome.storage.local.get(['triageHub_inbox']);
    const currentInbox = updatedInbox.triageHub_inbox || [];
    const newInbox = [inboxItem, ...currentInbox];
    
    await chrome.storage.local.set({ triageHub_inbox: newInbox });
    
    console.log('[Tab Napper] ✅ Tab captured to inbox:', inboxItem.title);
    
  } catch (error) {
    console.error('[Tab Napper] ❌ Error capturing tab:', error);
  }
}

/**
 * Track tab information for capture when closed
 */
function trackTab(tab) {
  if (tab.url && 
      !tab.url.startsWith('chrome://') && 
      !tab.url.startsWith('chrome-extension://') &&
      !tab.url.startsWith('about:')) {
    tabTracker.set(tab.id, {
      id: tab.id,
      url: tab.url,
      title: tab.title || 'Untitled',
      favIconUrl: tab.favIconUrl || null,
      lastUpdated: Date.now()
    });
  }
}

/**
 * Extract note ID from a note.html URL
 * @param {string} url - The tab URL
 * @returns {string|null} - The note ID or null if not a note URL
 */
function extractNoteId(url) {
  try {
    const urlObj = new URL(url);
    // Check if this is a note.html page
    if (!urlObj.pathname.endsWith('note.html')) {
      return null;
    }
    // Extract the 'id' parameter
    const noteId = urlObj.searchParams.get('id');
    return noteId;
  } catch (e) {
    console.error('[Tab Napper] Error parsing URL:', e);
    return null;
  }
}

/**
 * Re-triage a note by moving it from triageHub_notes to triageHub_inbox
 * @param {string} noteId - The note ID to re-triage
 */
async function retriageNote(noteId) {
  try {
    console.log('[Tab Napper] Re-triaging note:', noteId);

    // Load current data
    const result = await chrome.storage.local.get(['triageHub_notes', 'triageHub_inbox']);
    const notes = result.triageHub_notes || [];
    const inbox = result.triageHub_inbox || [];

    // Find the note in either the notes collection or the inbox (quick notes may live in inbox only)
    const note = notes.find(n => n.id === noteId) || inbox.find(n => n.id === noteId);
    
    if (!note) {
      console.log('[Tab Napper] Note not found in storage:', noteId);
      return;
    }

    // Check if note is already in inbox (avoid duplicates)
    const alreadyInInbox = inbox.some(item => item.id === noteId);
    if (alreadyInInbox) {
      console.log('[Tab Napper] Note already in inbox, skipping re-triage');
      return;
    }

    // Add note to beginning of inbox for re-triage
    const updatedInbox = [note, ...inbox];
    // Remove the note from triageHub_notes
    const updatedNotes = notes.filter(n => n.id !== noteId);

    // Save updated inbox and notes
    await chrome.storage.local.set({ triageHub_inbox: updatedInbox, triageHub_notes: updatedNotes });

    console.log('[Tab Napper] ✓ Note re-triaged to inbox:', note.title);
  } catch (error) {
    console.error('[Tab Napper] Error re-triaging note:', error);
  }
}

// (Removed unused isNoteTab helper)

// Initialize tab tracking on startup
chrome.tabs.query({}, (tabs) => {
  if (chrome.runtime.lastError) {
    console.error('[Tab Napper] Error querying tabs on startup:', chrome.runtime.lastError.message);
    return;
  }
  tabs.forEach(tab => trackTab(tab));
  console.log('[Tab Napper] Tracking', tabs.length, 'existing tabs');
});

// Track new tabs when created
chrome.tabs.onCreated.addListener((tab) => {
  trackTab(tab);
});

// Track note tabs so we know their URLs when they close

// Listen for tab updates to track both regular tabs and note tabs
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    // Only care about complete loads
    if (changeInfo.status !== 'complete') return;
    
    // Check if this is a note tab
    const noteId = extractNoteId(tab.url);
    
    if (noteId) {
      // This is a note tab, track it separately
      noteTabTracker.set(tabId, noteId);
      console.log('[Tab Napper] Tracking note tab:', tabId, 'with noteId:', noteId);
    } else {
      // Regular tab - track for capture
      trackTab(tab);
      // Remove from note tracker if it was there
      noteTabTracker.delete(tabId);
    }
  } catch (error) {
    console.error('[Tab Napper] Error in tab update handler:', error);
  }
});

// Handle tab removal - capture regular tabs, re-triage notes
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  try {
    // Check if this was a note tab
    const noteId = noteTabTracker.get(tabId);
    
    if (noteId) {
      console.log('[Tab Napper] Note tab closed:', tabId, 'noteId:', noteId);
      
      // Re-triage the note back to inbox
      await retriageNote(noteId);
      
      // Clean up tracker
      noteTabTracker.delete(tabId);
    } else {
      // Check if this was a regular tracked tab
      const trackedTab = tabTracker.get(tabId);
      
      if (trackedTab && trackedTab.url) {
        console.log('[Tab Napper] 🚫 Regular tab closed:', trackedTab.title);
        
        // Capture the closed tab to inbox
        await captureClosedTab(trackedTab);
        
        // Clean up tracker
        tabTracker.delete(tabId);
      }
    }
  } catch (error) {
    console.error('[Tab Napper] Error in tab removal handler:', error);
  }
});

console.log('[Tab Napper] Background service worker ready - monitoring all tabs and scheduled reminders');

/**
 * Handle scheduled reminders/follow-ups/reviews
 * When an alarm fires, move the item back to inbox and show a notification
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    console.log('[Tab Napper] ⏰ Alarm fired:', alarm.name);
    
    // Handle test alarms
    if (alarm.name === 'test-alarm') {
      console.log('[Tab Napper] ✅ Test alarm fired successfully!');
      
      // Create test notification
      chrome.notifications.create('test-alarm-notification', {
        type: 'basic',
        // Omit iconUrl - Chrome will use the extension's default icon from manifest
        title: 'Tab Napper Test Alarm',
        message: 'Test alarm fired successfully! The alarm system is working.',
        priority: 2,
        requireInteraction: true,
        buttons: [
          { title: 'Great!' },
          { title: 'Dismiss' }
        ]
      });
      return;
    }
    
    // Parse alarm name: tabNapper_{action}_{itemId}
    if (!alarm.name.startsWith('tabNapper_')) {
      return; // Not our alarm
    }
    
    const parts = alarm.name.split('_');
    if (parts.length < 3) {
      console.warn('[Tab Napper] Invalid alarm name format:', alarm.name);
      return;
    }
    
    const action = parts[1]; // remind_me, follow_up, or review
    const itemId = parts.slice(2).join('_'); // Rejoin in case ID contains underscores
    
    console.log('[Tab Napper] Processing scheduled reminder:', { action, itemId });
    
    // Load current data
    const result = await chrome.storage.local.get(['triageHub_stashedTabs', 'triageHub_inbox']);
    const stashedTabs = result.triageHub_stashedTabs || [];
    const inbox = result.triageHub_inbox || [];
    
    // Find the item in stashed tabs
    const item = stashedTabs.find(i => i.id === itemId);
    
    if (!item) {
      console.log('[Tab Napper] Item not found in stashed tabs:', itemId);
      return;
    }
    
    // Check if item is already in inbox (avoid duplicates)
    const alreadyInInbox = inbox.some(i => i.id === itemId);
    if (alreadyInInbox) {
      console.log('[Tab Napper] Item already in inbox, skipping:', itemId);
      return;
    }
    
    // Remove the scheduled reminder data from the item
    const retriagedItem = { ...item };
    delete retriagedItem.scheduledFor;
    delete retriagedItem.scheduledAction;
    delete retriagedItem.scheduledWhen;
    
    // Add to beginning of inbox for re-triage
    const updatedInbox = [retriagedItem, ...inbox];
    
    // Remove from stashed tabs
    const updatedStashed = stashedTabs.filter(i => i.id !== itemId);
    
    // Save updated data
    await chrome.storage.local.set({
      triageHub_inbox: updatedInbox,
      triageHub_stashedTabs: updatedStashed
    });
    
    console.log('[Tab Napper] ✓ Item re-triaged from scheduled reminder:', item.title);
    
    // Create a sticky notification
    const actionLabel = action === 'remind_me' ? 'Reminder' : 
                       action === 'follow_up' ? 'Follow-up' : 'Review';
    
    const notificationOptions = {
      type: 'basic',
      // Omit iconUrl - Chrome will use the extension's default icon from manifest
      title: `Tab Napper ${actionLabel}`,
      message: item.title || 'Scheduled item ready for review',
      priority: 2, // High priority
      requireInteraction: true, // Make it sticky - user must dismiss
      buttons: [
        { title: 'Open Tab Napper' },
        { title: 'Dismiss' }
      ]
    };
    
    // Create the notification
    console.log('[Tab Napper] Creating notification for:', itemId);
    chrome.notifications.create(`reminder-${itemId}`, notificationOptions, (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error('[Tab Napper] ❌ Error creating notification:', chrome.runtime.lastError);
      } else {
        console.log('[Tab Napper] ✅ Notification created successfully:', notificationId);
      }
    });
    
  } catch (error) {
    console.error('[Tab Napper] Error handling alarm:', error);
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  console.log('[Tab Napper] Notification button clicked:', notificationId, buttonIndex);
  
  if (buttonIndex === 0) {
    // "Open Tab Napper" button clicked
    chrome.action.openPopup().catch(() => {
      // If popup can't be opened, try opening the new tab page
      chrome.tabs.create({ url: 'chrome://newtab' });
    });
  }
  
  // Clear the notification
  chrome.notifications.clear(notificationId);
});

// Handle notification clicks (clicking the body of the notification)
chrome.notifications.onClicked.addListener((notificationId) => {
  console.log('[Tab Napper] Notification clicked:', notificationId);
  
  // Open Tab Napper
  chrome.action.openPopup().catch(() => {
    chrome.tabs.create({ url: 'chrome://newtab' });
  });
  
  // Clear the notification
  chrome.notifications.clear(notificationId);
});

console.log('[Tab Napper] Alarm listener registered for scheduled reminders');

// Debug utility: List all active alarms (useful for troubleshooting)
chrome.alarms.getAll((alarms) => {
  if (alarms.length > 0) {
    console.log('[Tab Napper] Active alarms on startup:', alarms.length);
    alarms.forEach(alarm => {
      console.log(`  - ${alarm.name} scheduled for:`, new Date(alarm.scheduledTime));
    });
  } else {
    console.log('[Tab Napper] No active alarms found on startup');
  }
});
