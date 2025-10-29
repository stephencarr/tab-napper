# Open Tab Detection Feature

## Overview

Surfaces items that are currently open in browser tabs with visual indicators and smart functionality. This helps ADHD users quickly identify what's already active vs. what needs to be opened.

## ✅ Implemented (Phase 1)

### 1. **Core Hook: `useOpenTabs`**
Location: `src/hooks/useOpenTabs.js`

**Features:**
- Polls every 10 seconds to check which items are currently open
- Returns `isOpen(item)` helper function
- Returns `openItemIds` Set for batch operations
- Efficient parallel checking for performance
- Manual refresh with `refreshOpenTabs()`

**Usage:**
```javascript
import { useOpenTabs } from '../hooks/useOpenTabs.js';

function MyComponent({ items }) {
  const { isOpen, openItemIds, refreshOpenTabs } = useOpenTabs(items, 10000);
  
  return (
    <div>
      {items.map(item => (
        <ItemCard 
          key={item.id} 
          item={item}
          isCurrentlyOpen={isOpen(item)} 
        />
      ))}
    </div>
  );
}
```

### 2. **Visual Indicator on StashCard**
Location: `src/components/StashCard.jsx`

**Changes:**
- Added `isCurrentlyOpen` prop
- Green "Open" badge with ExternalLink icon
- Appears next to title when tab is open
- Tooltip: "This tab is currently open"
- Color scheme: `bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400`

### 3. **StashManagerView Integration**
Location: `src/components/StashManagerView.jsx`

**Changes:**
- Uses `useOpenTabs` hook for all items (inbox, stashed, trash)
- Passes `isCurrentlyOpen` to each StashCard
- Shows count banner: "X items are currently open in browser tabs"
- Banner only shows when items are open and not in trash view

## 🚀 Phase 2: Additional Features (To Implement)

### 1. **Filter by Open Status**

Add filter toggle above item lists:

```javascript
// Add to StashManagerView
const [showOnlyOpen, setShowOnlyOpen] = useState(false);

const filteredItems = useMemo(() => {
  if (!showOnlyOpen) return currentData.items;
  return currentData.items.filter(item => isOpen(item));
}, [currentData.items, showOnlyOpen, isOpen]);

// UI
<div className="flex items-center gap-2">
  <button
    onClick={() => setShowOnlyOpen(!showOnlyOpen)}
    className={cn(
      "px-3 py-1.5 text-sm rounded-md border",
      showOnlyOpen
        ? "bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400"
        : "bg-white dark:bg-calm-800 border-calm-300 dark:border-calm-600"
    )}
  >
    <Filter className="h-4 w-4 inline mr-1" />
    {showOnlyOpen ? 'Showing Open Only' : 'Show Open Only'}
  </button>
  {showOnlyOpen && (
    <span className="text-sm text-calm-600 dark:text-calm-400">
      {filteredItems.length} of {currentData.items.length} items
    </span>
  )}
</div>
```

### 2. **Quick Actions for Open Tabs**

Add "Switch to Tab" action instead of "Open in New Tab":

```javascript
// In StashCard.jsx
const handleNavigate = async (e) => {
  if (isCurrentlyOpen) {
    // Switch to existing tab instead of opening new one
    const tab = await findOpenTab(item.url);
    if (tab) {
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.windows.update(tab.windowId, { focused: true });
      return;
    }
  }
  
  // Regular navigation if not open
  await navigateToUrl(item.url, item.title);
};
```

### 3. **Bulk "Close All Open" Action**

Add action to close all currently open tabs from a list:

```javascript
// New utility function in navigation.js
export async function closeOpenTabs(items) {
  const results = { closed: 0, failed: 0 };
  
  for (const item of items) {
    const tab = await findOpenTab(item.url);
    if (tab) {
      try {
        await chrome.tabs.remove(tab.id);
        results.closed++;
      } catch (error) {
        console.error('Failed to close tab:', tab.id, error);
        results.failed++;
      }
    }
  }
  
  return results;
}

// UI in StashManagerView
{openItemIds.size > 0 && (
  <button
    onClick={async () => {
      const openItems = allItems.filter(item => openItemIds.has(item.id));
      const result = await closeOpenTabs(openItems);
      console.log(`Closed ${result.closed} tabs`);
      refreshOpenTabs();
    }}
    className="px-3 py-1.5 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
  >
    Close All {openItemIds.size} Open Tabs
  </button>
)}
```

### 4. **Smart "Already Open" Detection in Inbox**

When triaging inbox, warn if opening a duplicate:

```javascript
// In FidgetControl or StashCard
const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

// Check before navigating
if (isCurrentlyOpen) {
  setShowDuplicateWarning(true);
  // Show toast: "This tab is already open. Switch to it instead?"
}
```

### 5. **Dashboard Widget: "Currently Active"**

Add new dashboard widget showing open tabs from stashed/inbox:

```javascript
// New component: src/components/CurrentlyActiveWidget.jsx
function CurrentlyActiveWidget({ className }) {
  const inboxData = useReactiveStorage('triageHub_inbox', []);
  const stashedTabs = useReactiveStorage('triageHub_stashedTabs', []);
  const allItems = useMemo(() => [...inboxData, ...stashedTabs], [inboxData, stashedTabs]);
  
  const { openItemIds } = useOpenTabs(allItems, 15000); // Poll every 15s
  
  const openItems = useMemo(
    () => allItems.filter(item => openItemIds.has(item.id)),
    [allItems, openItemIds]
  );
  
  if (openItems.length === 0) return null;
  
  return (
    <div className={cn("bg-white dark:bg-calm-800 rounded-lg border border-calm-200 dark:border-calm-700 p-4", className)}>
      <h3 className="text-sm font-medium text-calm-900 dark:text-calm-100 mb-3">
        Currently Active ({openItems.length})
      </h3>
      <div className="space-y-2">
        {openItems.slice(0, 5).map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-calm-700 dark:text-calm-300 truncate">
              {item.title}
            </span>
          </div>
        ))}
      </div>
      {openItems.length > 5 && (
        <div className="mt-2 text-xs text-calm-500 dark:text-calm-400">
          + {openItems.length - 5} more
        </div>
      )}
    </div>
  );
}
```

### 6. **Performance Optimization: Tab Change Events**

Instead of polling, listen to Chrome tab events for real-time updates:

```javascript
// Enhanced hook: src/hooks/useOpenTabs.js
export function useOpenTabs(items = [], pollInterval = 10000) {
  // ... existing code ...
  
  useEffect(() => {
    // Real-time listeners for better UX
    const handleTabUpdate = () => {
      checkOpenTabs();
    };
    
    const handleTabRemoved = () => {
      checkOpenTabs();
    };
    
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.onCreated.addListener(handleTabUpdate);
      chrome.tabs.onUpdated.addListener(handleTabUpdate);
      chrome.tabs.onRemoved.addListener(handleTabRemoved);
      
      return () => {
        chrome.tabs.onCreated.removeListener(handleTabUpdate);
        chrome.tabs.onUpdated.removeListener(handleTabUpdate);
        chrome.tabs.onRemoved.removeListener(handleTabRemoved);
      };
    }
  }, [checkOpenTabs]);
}
```

### 7. **Visual Enhancements**

**Pulsing Animation:**
```css
/* Add to global styles */
@keyframes pulse-green {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse-green {
  animation: pulse-green 2s ease-in-out infinite;
}
```

**Alternative Badge Styles:**
```javascript
// Minimal dot indicator (less intrusive)
{isCurrentlyOpen && (
  <div 
    className="w-2 h-2 bg-green-500 rounded-full animate-pulse-green" 
    title="Currently open"
  />
)}

// Or icon-only
{isCurrentlyOpen && (
  <ExternalLink className="h-4 w-4 text-green-600 dark:text-green-400 animate-pulse-green" />
)}
```

## 🎨 UX Considerations

### Color Scheme
- **Open/Active**: Green (`green-500`, `green-700`)
- **Recently Closed**: Orange (`orange-500`) - could track this separately
- **Past Due**: Red/Orange (`orange-700`) - already implemented

### Visual Hierarchy
1. **Past Due** items (red) - highest priority
2. **Currently Open** items (green) - medium priority
3. **Normal** items (default) - standard

### Accessibility
- All indicators have `title` attributes for tooltips
- Color is never the only differentiator (icons + text labels)
- Keyboard accessible filter buttons

## 📊 Performance Notes

### Polling Interval Recommendations:
- **Dashboard widgets**: 15 seconds (less critical)
- **Active triage view**: 10 seconds (default)
- **Background/idle**: 30+ seconds (when tab not visible)

### Chrome API Costs:
- `chrome.tabs.query({})`: ~5-10ms for 50 tabs
- `findOpenTab()` for single item: ~1-2ms
- Parallel checking 100 items: ~50-100ms

### Optimization:
```javascript
// Batch URL normalization
const normalizedUrls = useMemo(
  () => new Map(items.map(item => [item.id, normalizeUrl(item.url)])),
  [items]
);

// Only check items with valid URLs
const itemsToCheck = items.filter(item => item.url && item.url.startsWith('http'));
```

## 🧪 Testing

### Manual Tests:
1. Open a stashed tab → Verify green badge appears
2. Close the tab → Verify badge disappears (within poll interval)
3. Navigate to stash manager → Verify count banner shows
4. Filter to "Show Open Only" → Verify filtering works
5. Click "Close All Open" → Verify tabs close

### Console Helpers:
```javascript
// Debug open tab detection
window.TabNapper_debugOpenTabs = async () => {
  const { getCurrentlyOpenTabs } = await import('./src/utils/history.js');
  const openTabs = await getCurrentlyOpenTabs();
  console.log('Open tabs:', openTabs);
  return openTabs;
};
```

## 📝 Future Ideas

1. **Tab Groups Integration**: Show which tab group the item belongs to
2. **Window Management**: Show which window the tab is in
3. **Auto-cleanup**: "Close stale tabs" - close tabs open >24hrs
4. **Smart Reminders**: "You have this stashed but it's been open for 2 hours"
5. **Productivity Stats**: Track time spent on open vs. stashed items

## 🔄 Migration Path

**No migration needed** - This is purely additive:
- New hook is opt-in
- New prop on StashCard is optional (defaults to `false`)
- No storage schema changes
- Backward compatible with existing components

## ✅ Checklist for PR

- [x] Create `useOpenTabs` hook
- [x] Add `isCurrentlyOpen` prop to StashCard
- [x] Add visual indicator (green badge + icon)
- [x] Integrate into StashManagerView
- [x] Add count banner
- [ ] Manual testing with real Chrome tabs
- [ ] Update CHANGELOG.md
- [ ] Add screenshots to PR
- [ ] Performance testing with large datasets
