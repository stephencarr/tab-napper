/**
 * Tab Napper - Background Service Worker
 * Handles tab lifecycle events including note tab closure and re-triage
 */

console.log('[Tab Napper] Background service worker loaded');

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


// Track note tabs so we know their URLs when they close
const noteTabTracker = new Map(); // Map<tabId, noteId>

// Listen for tab updates to track note tabs
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    // Only care about complete loads
    if (changeInfo.status !== 'complete') return;
    
    const noteId = extractNoteId(tab.url);
    
    if (noteId) {
      // This is a note tab, track it
      noteTabTracker.set(tabId, noteId);
      console.log('[Tab Napper] Tracking note tab:', tabId, 'with noteId:', noteId);
    } else {
      // Not a note tab, remove from tracker if it was there
      noteTabTracker.delete(tabId);
    }
  } catch (error) {
    console.error('[Tab Napper] Error in tab update handler:', error);
  }
});

// Now we can properly handle tab removal with tracked data
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
    }
  } catch (error) {
    console.error('[Tab Napper] Error in tab removal handler:', error);
  }
});

console.log('[Tab Napper] Background service worker ready - monitoring note tabs');

/**
 * Handle scheduled reminders/follow-ups/reviews
 * When an alarm fires, move the item back to inbox for re-triage
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    console.log('[Tab Napper] Alarm fired:', alarm.name);
    
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
    
  } catch (error) {
    console.error('[Tab Napper] Error handling alarm:', error);
  }
});

console.log('[Tab Napper] Alarm listener registered for scheduled reminders');
