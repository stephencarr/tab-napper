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
 * Get human-readable label for item type
 */
function getItemTypeLabel(item) {
  if (item.type === 'note') return '📝 Note';
  if (item.type === 'captured-tab') return '🔗 Captured Tab';
  if (item.url && item.url.includes('bookmark')) return '🔖 Bookmark';
  if (item.url) return '🌐 Tab';
  return '📄 Item';
}

/**
 * Deduplicate items in a collection, keeping only the most recent
 */
function deduplicateItems(items) {
  const urlMap = new Map();
  const notesAndOthers = []; // Items without URLs (notes, etc.)
  
  // Separate items with URLs from notes/items without URLs
  items.forEach(item => {
    if (!item.url) {
      // Notes and other items without URLs - keep all of them
      notesAndOthers.push(item);
      return;
    }
    
    const normalized = normalizeUrl(item.url);
    if (!urlMap.has(normalized)) {
      urlMap.set(normalized, []);
    }
    urlMap.get(normalized).push(item);
  });
  
  // For each URL, keep only the most recent item
  const deduplicated = [...notesAndOthers]; // Start with all notes
  urlMap.forEach((duplicates, url) => {
    if (duplicates.length === 1) {
      deduplicated.push(duplicates[0]);
    } else {
      // Sort by timestamp (most recent first)
      const sorted = duplicates.sort((a, b) => {
        const timeA = a.timestamp || a.capturedAt || a.stashedAt || 0;
        const timeB = b.timestamp || b.capturedAt || b.stashedAt || 0;
        return timeB - timeA;
      });
      // Keep the most recent
      deduplicated.push(sorted[0]);
      console.log(`[Tab Napper] 🧹 Removed ${sorted.length - 1} duplicate(s) of: ${sorted[0].title}`);
    }
  });
  
  return deduplicated;
}

/**
 * Clean up duplicates across all collections
 */
async function cleanupDuplicates() {
  console.log('[Tab Napper] 🧹 Starting periodic duplicate cleanup...');

  try {
    const collections = {
      triageHub_inbox: 'Inbox',
      triageHub_scheduled: 'Scheduled',
      triageHub_archive: 'Archive',
      triageHub_trash: 'Trash'
    };
    const keys = Object.keys(collections);
    const result = await chrome.storage.local.get(keys);
    
    let changed = false;

    for (const key of keys) {
      const items = result[key];
      if (items && items.length > 0) {
        const originalCount = items.length;
        const cleaned = deduplicateItems(items);
        if (cleaned.length !== originalCount) {
          await chrome.storage.local.set({ [key]: cleaned });
          console.log(`[Tab Napper] 🧹 ${collections[key]}: ${originalCount} → ${cleaned.length} items`);
          changed = true;
        }
      }
    }
    
    if (changed) {
      console.log('[Tab Napper] ✅ Duplicate cleanup complete');
    } else {
      console.log('[Tab Napper] ✅ No duplicates found');
    }
  } catch (error) {
    console.error('[Tab Napper] ❌ Error during duplicate cleanup:', error);
  }
}

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
    const result = await chrome.storage.local.get(['triageHub_inbox', 'triageHub_scheduled', 'triageHub_trash']);
    const triageInbox = result.triageHub_inbox || [];
    const scheduledData = result.triageHub_scheduled || [];
    const trash = result.triageHub_trash || [];
    
    let removedFrom = [];
    
    // Remove duplicates from inbox
    const inboxDuplicates = triageInbox.filter(item => normalizeUrl(item.url || '') === normalizedUrl);
    if (inboxDuplicates.length > 0) {
      const cleanedInbox = triageInbox.filter(item => normalizeUrl(item.url || '') !== normalizedUrl);
      await chrome.storage.local.set({ triageHub_inbox: cleanedInbox });
      removedFrom.push(`inbox (${inboxDuplicates.length})`);
    }
    
    // Remove duplicates from scheduled tabs
    const scheduledDuplicates = scheduledData.filter(item => normalizeUrl(item.url || '') === normalizedUrl);
    if (scheduledDuplicates.length > 0) {
      const cleanedScheduled = scheduledData.filter(item => normalizeUrl(item.url || '') !== normalizedUrl);
      await chrome.storage.local.set({ triageHub_scheduled: cleanedScheduled });
      removedFrom.push(`scheduled (${scheduledDuplicates.length})`);
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
      description: (() => {
        try {
          return `Captured from ${new URL(tabInfo.url).hostname}`;
        } catch {
          return `Captured from unknown site`;
        }
      })(),
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

// Initialize tab tracking on startup (batched to reduce initial load)
chrome.tabs.query({}, (tabs) => {
  if (chrome.runtime.lastError) {
    console.error('[Tab Napper] Error querying tabs on startup:', chrome.runtime.lastError.message);
    return;
  }
  
  // Process tabs in smaller batches to avoid blocking
  const batchSize = 20;
  let processed = 0;
  
  function processBatch() {
    const batch = tabs.slice(processed, processed + batchSize);
    batch.forEach(tab => trackTab(tab));
    processed += batchSize;
    
    if (processed < tabs.length) {
      // Schedule next batch asynchronously
      setTimeout(processBatch, 100);
    } else {
      console.log('[Tab Napper] Tracking', tabs.length, 'existing tabs');
    }
  }
  
  processBatch();
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
    // Check if this was the pinned Tab Napper tab
    const result = await chrome.storage.local.get(['tabNapper_pinnedTabId']);
    const pinnedTabId = result.tabNapper_pinnedTabId;
    
    if (pinnedTabId === tabId) {
      console.log('[Tab Napper] Pinned Tab Napper tab closed, resetting flag');
      await chrome.storage.local.set({
        tabNapper_hasPinnedTab: false,
        tabNapper_pinnedTabId: null
      });
    }
    
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

console.log('[Tab Napper] Background service worker ready - monitoring all tabs and scheduled reminders, follow-ups, and reviews');

/**
 * Handle scheduled reminders/follow-ups/reviews
 * When an alarm fires, move the item back to inbox and show a notification
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    console.log('[Tab Napper] ⏰ Alarm fired:', alarm.name);
    
    // Handle periodic duplicate cleanup
    if (alarm.name === 'cleanup-duplicates') {
      console.log('[Tab Napper] Running periodic duplicate cleanup...');
      await cleanupDuplicates();
      return;
    }
    
    // Handle test alarms
    if (alarm.name === 'test-alarm') {
      console.log('[Tab Napper] ✅ Test alarm fired successfully!');
      
      // Simple 1x1 transparent PNG as data URI (minimal valid icon)
      const iconDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      // Create test notification
      chrome.notifications.create('test-alarm-notification', {
        type: 'basic',
        iconUrl: iconDataUri,
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
    
    // Parse alarm name: tabNapper::{action}::{itemId}
    const alarmNameRegex = /^tabNapper::(remind_me|follow_up|review)::(.+)$/;
    const match = alarm.name.match(alarmNameRegex);
    if (!match) {
      console.warn('[Tab Napper] Invalid alarm name format:', alarm.name);
      return;
    }
    const action = match[1]; // e.g., remind_me, follow_up, review
    const itemId = match[2]; // e.g., inbox-123
    
    console.log('[Tab Napper] Processing scheduled reminder:', { action, itemId });
    
    // Load current data
    const result = await chrome.storage.local.get(['triageHub_scheduled', 'triageHub_inbox']);
    const scheduledData = result.triageHub_scheduled || [];
    const inbox = result.triageHub_inbox || [];
    
    // Find the item in scheduled tabs
    const item = scheduledData.find(i => i.id === itemId);
    
    if (!item) {
      console.log('[Tab Napper] Item not found in scheduled tabs:', itemId);
      return;
    }
    
    // Check if item is already in inbox (avoid duplicates)
    const alreadyInInbox = inbox.some(i => i.id === itemId);
    if (alreadyInInbox) {
      console.log('[Tab Napper] Item already in inbox, skipping:', itemId);
      return;
    }
    
    // Remove the scheduled reminder data from the item
    const { scheduledFor, scheduledAction, scheduledWhen, ...retriagedItem } = item;
    
    // Add to beginning of inbox for re-triage
    const updatedInbox = [retriagedItem, ...inbox];
    
    // Remove from scheduled tabs
    const updatedScheduled = scheduledData.filter(i => i.id !== itemId);
    
    // Save updated data
    await chrome.storage.local.set({
      triageHub_inbox: updatedInbox,
      triageHub_scheduled: updatedScheduled
    });
    
    console.log('[Tab Napper] ✓ Item re-triaged from scheduled reminder:', item.title);
    
    // Create an enhanced notification with action buttons
    const actionLabel = action === 'remind_me' ? 'Reminder' : 
                       action === 'follow_up' ? 'Follow-up' : 'Review';
    
    // Simple 1x1 transparent PNG as data URI (minimal valid icon)
    const iconDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    // Get item preview (first 80 chars)
    const preview = item.content || item.description || item.title || '';
    const truncatedPreview = preview.length > 80 ? preview.substring(0, 80) + '...' : preview;
    
    const notificationOptions = {
      type: 'basic',
      iconUrl: iconDataUri,
      title: `⏰ ${actionLabel}: ${item.title || 'Scheduled Item'}`,
      message: truncatedPreview || 'Ready for review',
      contextMessage: getItemTypeLabel(item), // Shows item type below message
      priority: 2, // High priority
      requireInteraction: true, // Make it sticky - user must dismiss
      buttons: [
        { title: 'Open Now' },
        { title: 'Snooze 15m' }
      ]
    };
    
    // Store notification context for button actions
    await chrome.storage.local.set({
      [`notification_context_${itemId}`]: {
        itemId,
        item,
        action,
        createdAt: Date.now()
      }
    });
    
    // Create the notification
    console.log('[Tab Napper] Creating enhanced notification for:', itemId);
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
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  console.log('[Tab Napper] Notification button clicked:', notificationId, buttonIndex);
  
  // Extract itemId from notificationId (format: "reminder-{itemId}")
  const itemId = notificationId.replace('reminder-', '');
  
  // Get notification context
  const contextKey = `notification_context_${itemId}`;
  const result = await chrome.storage.local.get([contextKey]);
  const context = result[contextKey];
  
  if (!context) {
    console.warn('[Tab Napper] No context found for notification:', notificationId);
    chrome.notifications.clear(notificationId);
    return;
  }
  
  if (buttonIndex === 0) {
    // "Open Now" button clicked
    console.log('[Tab Napper] Opening item:', itemId);
    
    if (context.item.url) {
      // Open the URL in a new tab
      chrome.tabs.create({ url: context.item.url, active: true });
    } else {
      // Open Tab Napper to show the note
      chrome.tabs.create({ url: 'chrome://newtab' });
    }
    
    // Clean up notification context
    await chrome.storage.local.remove([contextKey]);
    
  } else if (buttonIndex === 1) {
    // "Snooze 15m" button clicked
    console.log('[Tab Napper] Snoozing item for 15 minutes:', itemId);
    
    // Re-schedule the alarm for 15 minutes from now
    const snoozeTime = Date.now() + (15 * 60 * 1000); // 15 minutes
    const alarmName = `tabNapper::${context.action}::${itemId}`;
    
    chrome.alarms.create(alarmName, {
      when: snoozeTime
    });
    
    // Update the scheduled time in storage
    const storageResult = await chrome.storage.local.get(['triageHub_inbox', 'triageHub_scheduled']);
    const inbox = storageResult.triageHub_inbox || [];
    const scheduled = storageResult.triageHub_scheduled || [];
    
    // Find and update the item
    const inboxIndex = inbox.findIndex(i => i.id === itemId);
    const scheduledIndex = scheduled.findIndex(i => i.id === itemId);
    
    if (inboxIndex !== -1) {
      inbox[inboxIndex].scheduledFor = snoozeTime;
      inbox[inboxIndex].scheduledWhen = 'In 15 minutes';
      // Move back to scheduled if it was retriaged
      scheduled.unshift(inbox[inboxIndex]);
      inbox.splice(inboxIndex, 1);
    } else if (scheduledIndex !== -1) {
      scheduled[scheduledIndex].scheduledFor = snoozeTime;
      scheduled[scheduledIndex].scheduledWhen = 'In 15 minutes';
    }
    
    await chrome.storage.local.set({
      triageHub_inbox: inbox,
      triageHub_scheduled: scheduled
    });
    
    console.log('[Tab Napper] ✓ Item snoozed for 15 minutes');
    
    // Show a brief confirmation notification
    chrome.notifications.create('snooze-confirmation', {
      type: 'basic',
      iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      title: '⏰ Snoozed for 15 minutes',
      message: context.item.title || 'Item snoozed',
      priority: 0,
      requireInteraction: false
    });
    
    // Auto-clear the confirmation after 3 seconds
    setTimeout(() => {
      chrome.notifications.clear('snooze-confirmation');
    }, 3000);
  }
  
  // Clear the original notification
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

// (Auto-pin reset logic consolidated into main tab removal listener above)

// =============================================================================
// PERIODIC DEDUPLICATION
// =============================================================================

// Run cleanup immediately on startup
console.log('[Tab Napper] 🚀 Running initial duplicate cleanup...');
cleanupDuplicates();

// Set up periodic cleanup using chrome.alarms (every 5 minutes)
// This frequency balances data hygiene with performance for large datasets
try {
  chrome.alarms.create('cleanup-duplicates', {
    periodInMinutes: 5
  });
  console.log('[Tab Napper] ⏰ Scheduled periodic duplicate cleanup (every 5 minutes)');
} catch (error) {
  console.error('[Tab Napper] ❌ Failed to create cleanup alarm:', error);
}
// Note: The cleanup alarm is handled by the existing chrome.alarms.onAlarm listener above
