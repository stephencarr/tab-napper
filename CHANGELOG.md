# Changelog

All notable changes to Tab Napper will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2025-10-29

### Added
- **Real-time open tab detection** with visual "Active" badges on items
- **Duplicate tab detection & cleanup** with one-click removal
- **Pinned tab protection** - bulk actions never close pinned tabs
- **Automatic data deduplication** - runs on startup and every 5 minutes
- **Manual refresh button** for immediate tab detection updates
- **"Close All" bulk action** to close all open saved tabs at once
- **Window focus detection** - refreshes when switching between Chrome windows
- Performance optimization: **Debouncing** (500ms) to reduce redundant checks
- Performance optimization: **Caching** of last check results
- Visual **pin icon (📌)** on action buttons to indicate pinned tab protection
- Comprehensive console logging for debugging and transparency

### Changed
- **"Open" badge changed to "Active"** for better clarity
- Tab count now shows **unique browser tabs** (deduplicated)
- Improved close confirmations with pinned tab warnings
- Enhanced success messages with detailed results (closed/skipped counts)

### Technical
- New `useOpenTabs` custom hook with Chrome event listeners
- Added `chrome.windows.onFocusChanged` for cross-window detection
- Enhanced `closeOpenTabs()` with pinned tab protection
- Enhanced `findAndCloseDuplicateTabs()` with pinned tab protection
- New `cleanupDuplicates()` function for periodic data cleanup
- New `deduplicateItems()` helper function
- Debounced event handlers to prevent check spamming
- Unique tab ID tracking to prevent duplicate counting

### Fixed
- Tab detection now works across all Chrome windows
- Duplicate items no longer accumulate in inbox/stash/trash
- Count accuracy improved by deduplicating by tab ID

## [0.7.1] - Previous Release

(Earlier versions not documented)

[0.8.0]: https://github.com/stephencarr/tab-napper/compare/v0.7.1...v0.8.0
