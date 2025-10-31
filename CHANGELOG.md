# Changelog

All notable changes to Tab Napper will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-30

### Added
- Comprehensive documentation update.
- Consolidated README to be a single source of truth.

### Changed
- Updated versioning to 1.0.0 to reflect stability and feature completeness.
- Cleaned up repository by removing redundant markdown files.

### Fixed
- Corrected and completed the changelog to accurately reflect project history.

## [0.8.0] - 2025-10-30

### Added
- **Real-time open tab detection** with "Active" badges and real-time event listeners.
- **Smart "Switch to Tab"** navigation to prevent opening duplicate tabs.
- **"Show Open Only" filter** to quickly see active items.
- **"Close All Open" bulk action** with confirmation dialog.
- **Duplicate tab detection & cleanup utility** in Dev Panel.
- **Pinned tab protection** for all bulk actions.
- Automatic data deduplication on startup and periodically.
- Manual refresh button for immediate tab detection.
- Window focus detection to refresh status when switching windows.

### Changed
- "Open" badge is now "Active" for better clarity.
- Tab count now reflects unique, deduplicated browser tabs.

### Fixed
- Tab detection now works reliably across all Chrome windows.
- Duplicate items no longer accumulate in storage.

## [0.7.1] - 2025-10-28

### Changed
- Improved performance by staggering component loading and reducing concurrent API calls.
- Reduced data fetching sizes by 30-50% for faster load times.
- Optimized background script with batched processing to prevent startup freezes.

### Fixed
- Resolved significant CPU spikes when loading the extension.
- Reduced browser UI freeze on startup.

## [0.5.1] - (Date not recorded)

### Added
- **Enhanced Omnisearch** with universal search across all data sources, including real-time browser history.
- **Gateway Deduplication** to reliably prevent duplicate tabs at capture time.

### Changed
- Major performance improvements with component-specific history fetching and persistent caching for suggestions.

## [0.5.0] - (Date not recorded)

### Added
- **FidgetControl System**, a revolutionary two-pill interface for rapid tab actions.
- **Unified Card System** with a consistent three-zone layout.

### Changed
- Major UX overhaul focused on ADHD-friendly principles like layout stability and rapid-click support.
