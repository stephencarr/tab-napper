# Changelog

All notable changes to Tab Napper will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Auto-Cleanup System
- **🧹 Automatic Inbox Cleanup**: Items older than 1 week moved to trash
  - Runs automatically on app startup
  - Prevents inbox from becoming cluttered
  - Timestamp-based aging (uses `timestamp` or `lastAccessed`)
  - Moved items tagged with `trashedReason: 'auto-cleanup-inbox-aged'`
  
- **🗑️ Automatic Trash Cleanup**: Items older than 1 month permanently deleted
  - Trash items older than 30 days are removed
  - Uses `trashedAt` timestamp for accurate tracking
  - Keeps trash manageable and performant
  
- **🔧 Manual Cleanup Controls**: Console helpers for testing
  - `window.TabNapper_runCleanup()` - Manually trigger cleanup
  - Shows preview before execution
  - Returns cleanup statistics

### Impact
- Automatic maintenance keeps app performant
- No user action required - runs on startup
- Configurable time periods (1 week inbox, 1 month trash)
- Non-blocking - won't prevent app from loading if cleanup fails

## [0.7.2] - 2025-10-28

### Added - Bookmark System with Auto-Pin
- **📌 Quick Access Bookmarking**: One-click bookmarking from search results
  - Bookmark button appears in search results for easy saving
  - Bookmarked items added to Quick Access dashboard widget
  - Visual indication of bookmarked status in search
  
- **🔄 Smart Auto-Pin**: Automatic pinning on Tab Napper tab open
  - Tab Napper tab automatically pins itself when opened
  - Pins only once per session to avoid annoying re-pins
  - Storage flag prevents duplicate pinning attempts
  - Console helper available for testing: `window.TabNapper_resetPin()`
  
- **🎯 Intelligent Link Behavior**: Context-aware tab management
  - Checks for already-open tabs before creating new ones
  - Switches to existing tab if URL is already open
  - Brings window to front when switching tabs
  - Prevents duplicate tabs in search results
  - Opens bookmarked links in new tabs (not windows)

### Fixed - Critical Bugs from Rebase
- **⚠️ Alarm Separator Mismatch**: Fixed scheduled reminders failing silently
  - Corrected alarm name format: `tabNapper::{action}::{itemId}`
  - Restored `::` separator (was incorrectly changed to `_`)
  - Prevents conflicts with underscores in action names
  
- **🔄 Tab Switching Regression**: Restored duplicate tab prevention
  - Re-added logic to check for existing open tabs
  - Switches to existing tab instead of always creating new ones
  - Essential for proper tab management in the extension

### Planned
- Advanced filtering for search results
- Full keyboard navigation support
- Export/import functionality

## [0.7.1] - 2025-10-28

### Fixed - Performance: Eliminated CPU Spike on Extension Load
- **⚡ Staggered Component Loading**: Reduced concurrent Chrome API calls
  - SmartSuggestions delay increased from 1s to 3s to prioritize critical components
  - RecentlyVisited delay increased from 800ms to 1.5s to avoid API call overlap
  - Prevents simultaneous heavy operations that caused browser freezing
  
- **📉 Optimized Data Fetching**: Reduced unnecessary data processing
  - SmartSuggestions history fetch reduced from 300 to 200 items (-33%)
  - SmartSuggestions URL processing limit reduced from 100 to 50 URLs (-50%)
  - RecentlyVisited fetch budget reduced from 5x to 3x multiplier (-40%)
  - History fetch timeout reduced from 5s to 3s for faster failure detection
  
- **🔄 Batched Background Processing**: Non-blocking tab tracking
  - Background script now processes tabs in batches of 20 with 100ms delays
  - Spreads tab tracking load over ~500ms instead of blocking startup
  - Prevents CPU spike when extension loads with many open tabs

### Impact
- Eliminated 2-3 second CPU spike that caused browser UI freeze
- Extension now loads progressively with smooth, gradual CPU usage
- No functionality removed - all features work as before
- Maintains feature parity while significantly improving performance

See [PERFORMANCE_FIXES.md](./PERFORMANCE_FIXES.md) for detailed analysis and metrics.

## [0.7.0] - 2025-10-26

### Added - Stash & Schedule: Smart Time-Based Reminders with Notifications
- **⏰ Stash & Schedule System**: Complete time-based reminder workflow for tabs
  - Stash items with scheduled reminders (Remind Me/Follow Up/Review)
  - Smart time suggestions: relative (1 hour, this afternoon), absolute (today 3pm, tomorrow 9am)
  - Chrome Alarms API integration for persistent, reliable scheduling
  - Automatic re-triage to inbox when alarms trigger
  - Visual scheduling indicators in stash cards (clock icon + formatted time)
  - Item counts for all tab buckets in sidebar (Inbox, Stashed, Archive, Trash)
  
- **🔔 System Notifications**: Sticky notification alerts for scheduled items
  - High-priority, persistent notifications (requireInteraction: true)
  - Custom notification titles based on action type
  - Action buttons: "Open Tab Napper" and "Dismiss"
  - PNG data URI icons for Chrome compatibility
  - Background worker monitors and triggers scheduled alarms

- **🗑️ Trash Can Functionality**: Two-click confirmation deletion system
  - Trash icon button appears next to fidget widget
  - First click: button turns red, shows "Confirm"
  - Second click: permanently deletes item and clears associated alarms
  - Cooldown timer automatically reverts to trash icon after 3 seconds
  - Integrated with stashed items - trashing clears alarms automatically

- **🛠️ Enhanced Developer Tools**: Comprehensive debugging capabilities
  - Dev mode toggle via Ctrl+Shift+D easter egg
  - Restyled dev console with better UX and visual hierarchy
  - Live console log capture (intercepts console.log/error/warn)
  - Test Alarm (10 seconds) and Test Notification buttons
  - "Trigger All Scheduled Alarms NOW" - instant testing without waiting
  - "Flush All Stashed Items" - clear alarms and move all to inbox
  - Toast notifications for all dev actions (success/error/info)
  - Button hover animations and active state feedback
  - Detailed logging with emoji indicators for easy scanning

- **♻️ Background Worker Enhancements**: Tab lifecycle monitoring
  - Listens for closed tabs and updates state even when Tab Napper is closed
  - Alarm listener registered for scheduled reminders on startup
  - Active alarm logging on service worker initialization
  - Persistent state management across browser sessions

- **🎨 UI Component Improvements**: Unified search and list styling
  - Reusable list component for Recent, Search Results, and all tab lists
  - Consistent card design across all views
  - Search results now scroll main pane (no nested scroll areas)
  - Visual consistency between all list types

### Enhanced
- **FidgetControl Component**: Integrated scheduling into action workflow
  - Action pill: Stash, Remind Me, Follow Up, Review, DELETE NOW
  - When pill: Smart contextual time options based on current time
  - Seamless scheduling UX with no menu diving
  - Past Time Guard prevents invalid time combinations

- **Reactive Storage**: Real-time updates across all components
  - Storage change events trigger UI refresh
  - Cross-component synchronization for alarms and stashed items
  - Automatic state updates when alarms fire

### Fixed
- **Alarm Name Parsing**: Correctly handles underscores in action names
  - Actions with underscores (remind_me, follow_up) now parse correctly
  - Regex-based parsing finds item category pattern (inbox-, stashed-, etc.)
  - Proper itemId extraction for all alarm types
  
- **Notification Icons**: Chrome-compatible PNG data URIs
  - Fixed "Unable to download all specified images" error
  - Chrome notifications require PNG/JPG, not SVG
  - Minimal 1x1 transparent PNG as fallback icon

- **Dev Panel Console**: Live log capture working correctly
  - useEffect properly intercepts console methods
  - Tab Napper and DevPanel logs automatically appear
  - No more missing debug output

### Technical
- **Chrome Alarms API**: Persistent scheduling across sessions
- **Service Worker Architecture**: Background monitoring and alarm handling
- **Component Refactoring**: Single reusable list component for all tab displays
- **State Management**: Enhanced reactive storage with storage-updated events
- **Developer Experience**: Comprehensive dev mode with testing tools

### Security
- Notifications use safe data URI icons (no external image loading)
- Alarm data validated before processing
- Confirmation required for destructive actions (trash, flush)

## [0.6.0] - 2025-10-25

### Added – Quick Note Capture, Live Note Editor, Dark Mode, and UI Consistency
- Quick Note Capture feature with markdown editor and live preview
  - Saves to Inbox with `isNote: true` and integrates with triage flows
  - Keyboard shortcuts: Ctrl+Enter to save, Ctrl+E to toggle preview
  - Document-style preview typography for readability
- System dark mode support with manual toggle preserved
  - `useDarkMode` hook adds/removes the `dark` class and listens to `matchMedia`
  - Tailwind dark mode enabled via `darkMode: 'class'`
- Calm UI: shared component classes
  - `calm-card`, `calm-button-primary`, `calm-button-secondary` now include dark variants
  - App-wide visual consistency for cards, lists, and action buttons in both themes

- Live Note Editor
  - Opens via internal route `chrome-extension://…/note.html?id=[NoteID]`
  - View-first with formatting toolbar, emoji picker, and auto-save
  - Editor hotkeys: Cmd/Ctrl+B (bold), Cmd/Ctrl+I (italic), Cmd/Ctrl+` (inline code), Cmd/Ctrl+K (link), Cmd/Ctrl+1/2 (H1/H2), Cmd/Ctrl+L (bulleted list)
  - Global hotkey: Cmd/Ctrl+E toggles Preview/Edit

### Changed
- Markdown rendering: consolidated to `marked` + `DOMPurify` library for robust parsing and XSS protection
  - Replaced fragile regex-based renderers in QuickNoteCapture and NoteEditor
  - Custom token-based renderer adds Calm UI classes to all markdown elements
  - Proper handling of nested formatting, multi-line content, and list grouping
- Styling updates across custom components for dark mode conformance:
  - `App.jsx`, `UniversalSearch.jsx`, `SearchResults.jsx`, `StashManagerView.jsx`, `QuickAccessCards.jsx`,
    `StashCard.jsx`, `RecentlyVisited.jsx`, `ListContainer.jsx`, `ListItem.jsx`, `SmartSuggestions.jsx`,
    `ContextualComponent.jsx`, `FidgetControl.jsx`, and more
- Tailwind theme extended with calm palette additions (including `calm-25`, `calm-750`)

### Security
- Removed inline dark-mode detection script from `triage_hub.html` to satisfy MV3 CSP; dark mode handled in React hook
- Markdown preview sanitized via DOMPurify to prevent XSS attacks while preserving styling classes

### Fixed
- Resolved build-breaking JSX issue in `ContextualComponent.jsx` (missing container/return closure)
- Corrected dark hover, text, and border states in several custom components
- Fixed `[object Object]` rendering issue by using token-based marked renderer API

### Tooling / DX
- Added `.geminiignore` to reduce token usage during AI-assisted operations


## [0.5.1] - 2025-10-24

### Added - Enhanced Omnisearch & Performance Revolution
- **🔍 Enhanced Omnisearch**: Universal search across all data sources with browser history integration
  - Priority-based result segmentation (inbox > stashed > quick access > history > trash)
  - Real-time Chrome History API integration with native search capabilities
  - Auto-focused search input with ESC key clearing
  - Click-to-open functionality for all search results
  - Visual hierarchy with color-coded segments and relevance scores
- **⚡ Performance Revolution**: Complete optimization of history handling and caching
  - Lightweight, component-specific history fetching eliminates browser stalling
  - Persistent caching for SmartSuggestions (1-hour duration, survives reloads)
  - Search-driven history queries only fetch matching items
  - Smart cache invalidation on user actions (pin/unpin)
- **🎯 Gateway Deduplication**: Simplified and reliable duplicate prevention
  - Replaced complex storage-level deduplication with simple gateway approach
  - Capture-time duplicate removal across all collections
  - Cleaner, more maintainable codebase
- **🔧 Developer Tools**: Comprehensive debugging and testing capabilities
  - Debug functions for Chrome History API testing
  - Cache inspection and management tools
  - Enhanced omnisearch test suite
  - Performance profiling capabilities

### Changed
- **Search Architecture**: Complete rewrite using Chrome's native search APIs
- **History Management**: Component-specific lightweight functions replace heavy pre-fetching
- **Cache Strategy**: Memory + persistent storage with intelligent invalidation
- **Error Handling**: Enhanced Chrome History API permission checks and fallbacks

### Performance Improvements
- **Eliminated Browser Stalling**: No more massive history pre-fetching
- **Instant Cache Loading**: SmartSuggestions load immediately after first generation
- **Responsive Search**: Debounced search with progressive result loading
- **Optimized APIs**: Direct Chrome API usage for maximum efficiency

### Fixed
- **Search Input Focus**: Proper auto-focus with browser extension compatibility
- **ESC Key Handling**: Reliable search clearing functionality
- **Search Result Clicking**: URLs now properly open in new tabs
- **SmartSuggestions Shimmer**: Persistent caching eliminates reload delays

## [0.5.0] - 2025-10-24

### Added - Major UX Overhaul: ADHD-Friendly FidgetControl and Unified Card System
- **ADHD-Friendly FidgetControl Component**: Complete analog fidget interface for tab management
  - Two-pill system: Action (Remind Me/Follow Up/Review/DELETE NOW) + When (smart contextual timing)
  - Context-aware timing options based on current time of day
  - Rapid-clicking friendly with no layout shifts or menu diving
  - Smart time suggestions: "In 1 hour", "This afternoon", "Tomorrow morning", etc.
  - DELETE NOW confirmation system with inline cancel button
  - Fixed minimum widths (Action: 90px, When: 120px) for stable click targets

- **Unified StashCard Component**: Consistent three-zone card layout across all views
  - Zone 1 (Identity): High-contrast favicon, title, and metadata
  - Zone 2 (Action Block): Tactile, prominent FidgetControl pills with uniform py-2 height
  - Zone 3 (Commitment): Subtle, confirmatory preview text
  - Real favicon integration with graceful fallbacks
  - Smart time-ago formatting and domain extraction
  - Category badge support

- **Structured Card Layout System**: Professional container principle implementation
  - Flex grid with justify-between for clean Identity/Action separation
  - Control block containment with flex-shrink-0 for no wrapping
  - Perfect vertical alignment across all card elements
  - Visual hierarchy with high-contrast identity and tactile action elements

- **Unified Stash Manager Integration**: Consistent experience across dashboard and management views
  - Same StashCard component used in ListContainer and StashManagerView
  - Eliminated layout inconsistencies between different contexts
  - Removed duplicate helper functions and renderers

### Enhanced
- **Browser History Integration**: Fixed mock data interference
  - Only uses mock data when explicitly enabled via window._enableMockHistory
  - Restored real Chrome browser history display by default
  - Enhanced search functionality with actual browsing data

- **Reactive State Management**: Comprehensive storage monitoring
  - ALL Chrome storage keys monitored (triageHub_*, tabNapper_*)
  - Real-time UI updates for tab closures, suggestions, preferences
  - Verified cross-component state synchronization

### Fixed
- **Layout Stability**: Eliminated layout shift during rapid clicking
  - Fixed minimum pill widths prevent text-change resizing
  - Inline cancel button prevents layout jumps during DELETE confirmation
  - Consistent button heights maintain stable click areas

- **UX Flow Improvements**: Smooth interaction patterns
  - Past Time Guard prevents invalid "Today 19 hours away" combinations
  - Smart day anchor cycling with proper wrap-around
  - Conditional pill visibility based on action state

### Technical
- **Component Architecture**: Unified card system with single source of truth
- **ADHD Design Principles**: Rapid clicking, visual stability, no menu diving
- **Accessibility**: Clear visual hierarchy and tactile feedback
- **Performance**: Reduced component duplication and optimized renders

## [0.4.0] - 2025-10-24

### Added - Enhanced Omni Search and Rebranding
- **Enhanced Universal Search**: Comprehensive search across all content fields
  - Searches page titles, descriptions, URLs, body content, summaries, and notes
  - Improved relevance scoring with weighted field importance
  - Body/summary content gets high relevance weight (8 points)
  - URL domain matching with bonus scoring
  - Enhanced sample data with rich content for testing
- **Application Rebranding**: Changed name from "Tab Napper" to "Tab Napper"
  - Updated manifest.json, UI headers, and documentation
  - Maintained consistent ADHD-friendly design principles
  - Updated search placeholder to reflect enhanced capabilities

### Enhanced
- **Search Algorithm**: Multi-field content search with intelligent scoring
  - Title matches: 10-30 points (highest priority)
  - Body/Summary/Content: 6-8 points (high priority for content)
  - Descriptions: 5 points (medium priority)
  - URLs and domains: 3-5 points (useful but lower priority)
  - Notes: 4 points (valuable supplementary content)
- **Sample Data**: Added rich content examples with body, summary, content, and text fields
- **User Experience**: More descriptive search placeholder text

### Technical
- **Search Engine**: Enhanced field coverage and relevance calculation
- **Version Management**: Updated to semantic versioning 0.4.0
- **Content Architecture**: Support for multiple content field types

## [0.3.0] - 2025-10-24

### Added - Ticket 6: Right Column Quick Access and Contextual Features
- **Quick Access Cards Component**: Displays frequently accessed items from chrome.storage.sync with access count tracking
  - Real-time access count and last accessed time updates
  - Smart sorting by frequency and recency
  - Favicon integration and domain display
  - Click tracking with automatic frequency updates
  - "Frequently Used" badges for items with 5+ accesses
- **Contextual Component**: Intelligent stashed item suggestions based on current browsing context
  - Domain matching between open tabs and stashed items
  - Keyword matching for related content discovery
  - Smart scoring algorithm for relevance ranking
  - Dismissible suggestions with show/hide toggle
  - Visual match reason explanations ("Same domain", "Related domain", "keyword matches")
  - Automatic refresh every 30 seconds for real-time context awareness
- **Full Stash Manager Button**: Professional navigation component for future stash management
  - Gradient button design with hover effects and subtle animations
  - Quick stats display placeholders for stashed items and categories
  - Expandable architecture for future modal or dedicated page integration
- **Enhanced Sample Data**: Comprehensive test data including quick access items with realistic access patterns

### Enhanced
- **Right Column Layout**: Complete redesign with contextual intelligence and quick access
- **Storage Integration**: Proper chrome.storage.sync usage for quick access cards (encrypted)
- **ADHD-Friendly Design**: Maintained calm color palette and consistent visual hierarchy
- **Development Tools**: Updated sample data generation for comprehensive testing

### Technical
- **Component Architecture**: Three new specialized components for right column functionality
- **Storage Pipeline**: Validated encrypted sync storage for quick access cards
- **Context Matching**: Advanced algorithm for tab-to-stash relevance scoring
- **Performance**: Optimized contextual checking with 30-second intervals

## [0.2.0] - 2024-10-24

### Added
- **Left Column: Recently Visited History**
  - Chrome history API integration with smart deduplication
  - Visual status indicators (Blue Square: currently open, Green Pin: previously stashed)
  - Click to navigate/switch tabs functionality
  - Last 7 days of browsing history with visit counts
- **Tab Napper Shell and Search**
  - 60/40 responsive layout (Context/Action columns)
  - Universal search bar with auto-focus and real-time results
  - Search across all data sources with relevance scoring
  - Debounced search with term highlighting
- **Tab Capture and Deduplication**
  - Universal tab capture handler with smart deduplication
  - URL normalization (removes tracking parameters)
  - Automatic removal of duplicates from stashed tabs
  - Enhanced console logging for testing
- **Core React Foundation**
  - Reusable ListItem and ListContainer components
  - ADHD-friendly design system with calm colors
  - Full storage and encryption pipeline verification
  - Sample data utilities for development testing

### Enhanced
- Chrome extension permissions (tabs, storage, notifications, activeTab, history)
- Comprehensive error handling and loading states
- Development tools with simulation capabilities
- Visual feedback and status indicators throughout UI

### Security
- End-to-end encryption for sensitive sync data
- Hybrid storage model (sync for critical, local for bulk)
- Privacy-first architecture with no external dependencies

## [0.1.0] - 2024-10-24

### Added
- Chrome Extension Manifest V3 foundation
- Basic HTML shell for React application
- Project documentation structure
- Required permissions: tabs, storage, notifications, activeTab
- New Tab Page override configuration

### Security
- Privacy-first architecture established
- Local storage strategy defined