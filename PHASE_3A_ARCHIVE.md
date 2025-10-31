# Phase 3A: Archive List Implementation

## 🎯 Overview
Add an "Archive" list as the primary way to mark items as "done" while keeping them accessible. This addresses the confusion about how to mark completed items and provides a clear workflow.

## ✨ What We're Building

### The Archive List
**Purpose**: Long-term storage for completed/done items that you want to keep for reference.

**Key Features**:
- New "Archive" tab in sidebar (between Scheduled and Trash)
- "Mark as Done" action moves items to Archive
- Archive items are searchable and accessible
- Can unarchive items back to Inbox or Scheduled
- Archive count badge in sidebar
- Optional: Auto-archive old completed items after X days

## 🔄 User Workflow

### Current Problem
```
❌ Users don't know how to mark items as "done"
❌ "Scheduled" list feels like a todo list but has no completion action
❌ Trash feels wrong for completed items
❌ No way to keep completed items for reference
```

### New Workflow
```
1. Item in Inbox → Triage decision
2. Schedule it → Goes to "Scheduled" list
3. Complete it → "Mark as Done" → Goes to "Archive"
4. OR Delete it → Goes to "Trash"

Archive:
- Contains completed items
- Searchable and browseable
- Can be permanently deleted from Archive if needed
- Can be unarchived if task needs to be reopened
```

## 📊 UI Changes

### Sidebar Navigation
```
Before:
- Dashboard
- Inbox (64)
- All Scheduled (4)
- Trash (12)

After:
- Dashboard  
- Inbox (64)
- All Scheduled (4)
- Archive (127)       ← NEW!
- Trash (12)
```

### Archive Tab
```
┌─────────────────────────────────────────────────┐
│ Archive                            [🔄 Refresh]  │
│ Completed and archived items                    │
├─────────────────────────────────────────────────┤
│                                                  │
│ [Card] Project X - Completed 2 days ago        │
│ [Card] Meeting Notes - Completed 1 week ago    │
│ [Card] Research Task - Completed 2 weeks ago   │
│                                                  │
│ Actions: [Unarchive] [Delete Permanently]      │
└─────────────────────────────────────────────────┘
```

### New Action Buttons

#### On Inbox/Scheduled Items:
```
[Schedule] [Archive] [Delete]
            ↑ NEW
```

#### On Archive Items:
```
[Unarchive to Inbox] [Unarchive to Scheduled] [Delete]
```

### FidgetControl Updates
Add "Mark as Done" / "Archive" option in the dropdown menu.

## 🛠️ Technical Implementation

### 1. Storage Key
```javascript
// src/utils/storageKeys.js
export const STORAGE_KEYS = {
  INBOX: 'triageHub_inbox',
  SCHEDULED: 'triageHub_scheduled',
  ARCHIVE: 'triageHub_archive',        // ← NEW
  TRASH: 'triageHub_trash',
  COMPLETED: 'triageHub_completed',
};
```

### 2. Data Structure
```javascript
// Archive items have:
{
  id: 'inbox-xxx',
  archivedAt: 1234567890,     // Timestamp when archived
  archivedFrom: 'scheduled',  // Where it came from (inbox/scheduled)
  completedAt: 1234567890,    // Same as archivedAt for semantics
  originalTimestamp: xxx,     // Original creation time
  // ... all other fields
}
```

### 3. New Functions

#### storage.js
```javascript
export async function moveToArchive(item) {
  // Add archival metadata
  // Move from source list to archive
  // Update reactive store
}

export async function unarchiveItem(item, destination = 'inbox') {
  // Remove archival metadata  
  // Move back to inbox or scheduled
  // Update reactive store
}
```

#### App.jsx State
```javascript
const [archiveData, setArchiveData] = useState([]);

// In loadAllAppData
const archive = result[STORAGE_KEYS.ARCHIVE] || [];
setArchiveData(archive);
```

### 4. Component Changes

#### Layout.jsx - Add Archive Tab
```jsx
<button onClick={() => setCurrentView('Archive')}>
  <Archive className="h-5 w-5" />
  <span>Archive</span>
  {archiveCount > 0 && <Badge>{archiveCount}</Badge>}
</button>
```

#### StashManagerView.jsx - Add Archive Case
```jsx
case 'archive':
  return {
    items: sortByTimestamp(archiveData || []),
    title: 'Archive',
    description: 'Completed and archived items',
    emptyMessage: 'Archive is empty',
    emptyDescription: 'Completed items will appear here.'
  };
```

#### FidgetControl.jsx - Add Archive Actions
```jsx
// Add "Mark as Done" option
<MenuItem onClick={() => handleArchive(item)}>
  <Archive /> Mark as Done
</MenuItem>

// For archive view, add unarchive options
<MenuItem onClick={() => handleUnarchive(item, 'inbox')}>
  <Inbox /> Unarchive to Inbox
</MenuItem>
```

### 5. Search Integration
Archive items should appear in search results with "(Archived)" tag.

### 6. Quick Access Integration  
Archive items can be added to Quick Access (with archived indicator).

## 🎨 Visual Design

### Archive Icon
Use `<Archive />` from lucide-react - box with lid open.

### Archive Badge Color
```css
/* Completed/archived items */
bg-blue-100 dark:bg-blue-900/30
text-blue-700 dark:text-blue-400
border-blue-200 dark:border-blue-800
```

### Archived Status Badge
```jsx
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
  <Archive className="h-3 w-3" />
  <span>Archived</span>
</span>
```

## 📝 User Messaging

### Confirmation Messages
- "Archived" (when archiving)
- "Unarchived to Inbox" / "Unarchived to Scheduled"
- "Permanently deleted from Archive"

### Empty State
```
📦 Archive is empty

Your completed items will appear here.
Archived items remain searchable and can be unarchived at any time.
```

## 🔍 Success Criteria

- [x] Archive tab appears in sidebar with count badge
- [x] "Mark as Done" / "Archive" action available on items
- [x] Archive view shows archived items sorted by completion date
- [x] Can unarchive items back to Inbox or Scheduled
- [x] Archive items appear in search with "(Archived)" indicator
- [x] Archive items can be added to Quick Access
- [x] Archive items can be permanently deleted
- [x] Duplicate detection/cleanup works with Archive
- [x] Open tab detection works with Archive
- [x] All existing features still work

## 🚀 Implementation Steps

1. **Storage Setup**
   - Add ARCHIVE storage key
   - Create moveToArchive() function
   - Create unarchiveItem() function
   - Update loadAllAppData() to load archive

2. **UI Components**
   - Add Archive tab to Layout sidebar
   - Update StashManagerView to handle 'archive' case
   - Add Archive icon and styling
   - Update FidgetControl with archive actions

3. **Integration**
   - Update search to include archive items
   - Update duplicate detection to include archive
   - Update open tab detection to include archive
   - Ensure archive items can be added to Quick Access

4. **Polish**
   - Add confirmation messages
   - Add archive badges/indicators
   - Update empty states
   - Add tooltips/help text

## 💡 Future Enhancements (Not in Phase 3A)

- Auto-archive scheduled items X days after completion
- Archive export (download as JSON/CSV)
- Archive statistics (completion rate, etc.)
- Archive filtering (by date, type, etc.)
- Bulk archive operations

---

**Ready to implement!** 🎉
