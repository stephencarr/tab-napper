# Phase 3A: Comprehensive Renaming - "Stashed" → "Scheduled"

## 🎯 Overview
This phase implements a comprehensive renaming of "Stashed" terminology to "Scheduled" throughout the entire codebase, making the app's purpose clearer and more intuitive for users managing ADHD-friendly tab workflows.

## 🔄 What Changed

### Storage Layer
- **New Storage Key**: `triageHub_scheduled` (replaces `triageHub_stashedTabs`)
- **Centralized Constants**: Created `src/utils/storageKeys.js` with all storage keys
- **Migration System**: Automatic migration from old key to new key on app load
- **Legacy Support**: Old key kept for backward compatibility during migration

### Data Model
- **Property Renamed**: `stashedTabs` → `scheduled` throughout app state
- **Prop Renamed**: `stashedTabs` → `scheduledData` in components
- **Variable Renaming**: All `stashedTabs`, `updatedStashed`, `cleanedStashed` variables renamed

### UI/UX Changes
- **"All Stashed"** → **"All Scheduled"** (main navigation tab)
- **"Stashed Tabs"** → **"Scheduled"** (search results, labels)
- **"Full Stash Manager"** → **"Full Scheduled Manager"**
- **Filter values**: `'stashed'` → `'scheduled'`
- **Confirmation messages**: "Moved to Stash" → "Scheduled"

### Component Updates
| Component | Changes |
|-----------|---------|
| `Layout.jsx` | Sidebar tab renamed |
| `StashManagerView.jsx` | Title, filters, prop names updated |
| `FullStashManager.jsx` | Button text and variables renamed |
| `SearchResults.jsx` | Segment labels updated |
| `FidgetControl.jsx` | Confirmation message updated |
| `ContextualComponent.jsx` | Data property renamed |
| `RecentlyVisited.jsx` | Reactive storage key updated |
| `DevPanel.jsx` | Test data labels updated |

### Utility Functions
| File | Changes |
|------|---------|
| `storage.js` | Storage keys, return properties, dedup logging |
| `search.js` | Variable names and property access |
| `capture.js` | `findDuplicateInStashed` → `findDuplicateInScheduled` |
| `history.js` | `getStashedUrls` → `getScheduledUrls` |
| `devUtils.js` | Sample data variable names |
| `reactiveStore.js` | Storage key mappings |

### Background Script
- Updated all storage operations to use new key
- Renamed all variables (`stashedTabs` → `scheduled`)
- Updated collection labels in deduplication logic
- Updated alarm handling and snooze functionality

## 🛠️ Technical Implementation

### 1. Centralized Storage Keys
```javascript
// src/utils/storageKeys.js
export const STORAGE_KEYS = {
  INBOX: 'triageHub_inbox',
  SCHEDULED: 'triageHub_scheduled',
  TRASH: 'triageHub_trash',
  COMPLETED: 'triageHub_completed',
  LEGACY_STASHED: 'triageHub_stashedTabs', // For migration
};
```

### 2. Automatic Migration
```javascript
export async function runStorageMigrations() {
  // Migrate stashedTabs → scheduled
  await migrateStorageKey(STORAGE_KEYS.LEGACY_STASHED, STORAGE_KEYS.SCHEDULED);
}
```

### 3. Migration Strategy
- Migration runs on every app load (in `loadAllAppData()`)
- Checks if new key has data before migrating
- Keeps old key for safety (doesn't delete)
- Logs migration actions to console
- Zero data loss - safe for all users

## 📊 Files Changed
- **Total files modified**: 17
- **Lines changed**: +277, -114
- **Build status**: ✅ Success
- **Bundle size**: No significant change

## 🔍 Verification Checklist
- [x] All storage operations use new key
- [x] Migration logic tested
- [x] All UI labels updated
- [x] All variables renamed consistently
- [x] Build passes without errors
- [x] No breaking changes to data structure
- [x] Legacy key preserved for migration
- [x] Search results updated
- [x] Component props updated
- [x] Filter values updated

## 🎨 User-Facing Changes

### Before
- "All Stashed" tab
- "Stashed Tabs" in search
- "Moved to Stash" confirmation
- Confusing terminology

### After
- "All Scheduled" tab
- "Scheduled" in search
- "Scheduled" confirmation
- Clear, intuitive terminology

## 🚀 Future-Proofing

### Centralized Constants
By creating `storageKeys.js`, future renamings will be much easier:
1. Update constant in one place
2. Run find/replace on constant name
3. Add migration function
4. Done!

### Migration Pattern
The migration system is reusable for future schema changes:
```javascript
// Easy to add new migrations
await migrateStorageKey('oldKey', 'newKey');
```

## 💡 Why "Scheduled" Over "Stashed"?

**Problem with "Stashed":**
- Unclear what "stashed" means (hidden? saved? archived?)
- Doesn't convey time-based action
- Sounds passive, not action-oriented

**Benefits of "Scheduled":**
- Clear: These items have a scheduled time/action
- Action-oriented: You're scheduling something to happen
- Intuitive: Matches user mental model
- Aligns with reminder/follow-up workflow

## 📝 Notes
- All changes are backward compatible
- Existing user data automatically migrates
- No manual user action required
- Console logs track migration for debugging
- Storage structure unchanged (only key names)

---

**Ready for testing!** 🎉
