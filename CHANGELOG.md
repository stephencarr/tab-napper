# Changelog

All notable changes to Tab Napper will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Background service worker to monitor note tab closure
  - Automatically re-triages notes to Inbox when note.html tabs are closed
  - Tracks note tabs via URL parsing and maintains tab-to-noteId mapping
  - Completes Ticket 12: Note Tab Re-Triage on Close lifecycle

### Fixed
- Fidget Controls click interaction in StashCard component
  - Added event.stopPropagation() to prevent card onClick from blocking Fidget buttons
  - Users can now interact with action buttons (Stash, Delete, Remind) without opening the note
 - Note re-triage reliability in background service worker
   - retriageNote now looks up notes in both triageHub_notes and triageHub_inbox (covers Quick Note Capture)
   - Removed unused isNoteTab helper for maintainability

### Planned
- Advanced filtering for search results
- Full keyboard navigation support
- Export/import functionality

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