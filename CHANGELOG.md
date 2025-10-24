# Changelog

All notable changes to Triage Hub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Analog Fidget Control UX for reminders
- Advanced triage actions and workflows

## [0.2.0] - 2024-10-24

### Added
- **Left Column: Recently Visited History**
  - Chrome history API integration with smart deduplication
  - Visual status indicators (Blue Square: currently open, Green Pin: previously stashed)
  - Click to navigate/switch tabs functionality
  - Last 7 days of browsing history with visit counts
- **Triage Hub Shell and Search**
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