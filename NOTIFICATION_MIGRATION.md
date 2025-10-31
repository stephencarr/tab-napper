# Notification System Migration Plan

## ✅ Completed
1. Created Toast notification component (Tailwind UI pattern)
2. Created ToastContext for managing toasts
3. Created ConfirmDialog modal component (Tailwind UI pattern)
4. Created useConfirm hook for easy confirmation dialogs

## 📋 TODO - Replace all alert() and confirm() calls

### Priority 1: StashManagerView.jsx (11 instances)
- [ ] Line 172: alert('No open tabs found')
- [ ] Line 179: confirm('Close N tabs?')
- [ ] Line 199: alert('✅ Closed N tabs')
- [ ] Line 212: confirm('Found duplicate tabs')
- [ ] Line 231: alert(duplicate results)
- [ ] Line 238: alert('Error finding duplicates')
- [ ] Line 252: confirm('Move to Trash?')
- [ ] Line 268: confirm('Move to Archive?')
- [ ] Line 284: confirm('Move to Scheduled?')
- [ ] Line 300: confirm('Restore to Inbox?')

### Priority 2: DevPanel.jsx (5 instances)
- [ ] Line 226: confirm('Clear all sample data?')
- [ ] Line 315: confirm('FLUSH ALL STASHED ITEMS?')
- [ ] Line 403: confirm(Found N duplicates')
- [ ] Line 429: confirm('Trigger ALL scheduled alarms?')

### Priority 3: NoteEditor.jsx (1 instance)
- [ ] Line 450: alert('Failed to save note')

## 🎯 Implementation Pattern

### Before:
```javascript
if (!window.confirm('Delete this item?')) return;
```

### After:
```javascript
const { confirm, confirmProps } = useConfirm();
const { toast } = useToast();

// In component JSX:
<ConfirmDialog {...confirmProps} />

// Usage:
await confirm({
  title: 'Delete Item',
  message: 'Are you sure? This cannot be undone.',
  type: 'danger',
  onConfirm: () => handleDelete()
});

// Success toast:
toast.success('Item deleted', 'Successfully removed from list');
```

## 🔧 Required Changes

1. Wrap App.jsx with ToastProvider
2. Import useConfirm and useToast in each component
3. Add <ConfirmDialog {...confirmProps} /> to component JSX
4. Replace window.confirm() with await confirm()
5. Replace alert() with toast notifications

## 📊 Benefits

- ✅ Non-blocking notifications
- ✅ Consistent Tailwind UI styling
- ✅ Dark mode support
- ✅ Better UX (no browser native dialogs)
- ✅ Stack multiple notifications
- ✅ Auto-dismiss with configurable duration
- ✅ Accessible (ARIA labels)

## 🚧 Testing Checklist

After migration:
- [ ] Test all bulk actions (trash, archive, restore, schedule)
- [ ] Test close all open tabs
- [ ] Test find duplicates
- [ ] Test dev panel actions
- [ ] Test note editor save failures
- [ ] Verify dark mode styling
- [ ] Verify accessibility (keyboard navigation)
- [ ] Test notification stacking (multiple at once)
