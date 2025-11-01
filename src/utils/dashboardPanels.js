/**
 * Dashboard Panel Registry
 * Extensible system for registering and managing dashboard panels
 */

import { Star, Clock, FileText, List, Archive, Inbox } from 'lucide-react';

/**
 * Panel Registry - Add new panels here
 * Each panel defines its configuration and behavior
 */
export const PANEL_REGISTRY = {
  quickAccess: {
    id: 'quickAccess',
    name: 'Quick Access',
    description: 'Your most frequently accessed items',
    icon: Star,
    component: 'QuickAccessCards',
    defaultSettings: {
      maxItems: 6,
      showAccessCount: true
    },
    category: 'productivity',
    hasOwnHeader: true
  },
  recentlyVisited: {
    id: 'recentlyVisited',
    name: 'Recently Visited',
    description: 'Recently accessed tabs and notes',
    icon: Clock,
    component: 'RecentlyVisited',
    defaultSettings: {
      maxItems: 10,
      showTimestamp: true
    },
    category: 'history',
    hasOwnHeader: true
  },
  quickNote: {
    id: 'quickNote',
    name: 'Quick Note Capture',
    description: 'Quickly create new notes',
    icon: FileText,
    component: 'QuickNoteCapture',
    defaultSettings: {},
    category: 'productivity',
    hasOwnHeader: true
  },
  inboxPreview: {
    id: 'inboxPreview',
    name: 'Inbox Preview',
    description: 'Preview of unprocessed items',
    icon: Inbox,
    component: 'InboxPreview',
    defaultSettings: {
      maxItems: 5
    },
    category: 'triage'
  },
  scheduledPreview: {
    id: 'scheduledPreview',
    name: 'Scheduled Items',
    description: 'Upcoming scheduled reminders',
    icon: Clock,
    component: 'ScheduledPreview',
    defaultSettings: {
      maxItems: 5,
      showTimeUntil: true
    },
    category: 'triage'
  },
  archivePreview: {
    id: 'archivePreview',
    name: 'Recent Archive',
    description: 'Recently archived items',
    icon: Archive,
    component: 'ArchivePreview',
    defaultSettings: {
      maxItems: 5
    },
    category: 'triage'
  }
};

/**
 * Default dashboard layout (2-column grid)
 */
export const DEFAULT_DASHBOARD_CONFIG = {
  version: 1,
  columns: [
    {
      id: 'left',
      panels: ['quickNote', 'recentlyVisited']
    },
    {
      id: 'right',
      panels: ['quickAccess']
    }
  ],
  panelSettings: {} // Panel-specific settings override
};

/**
 * Get panel configuration by ID
 */
export function getPanelConfig(panelId) {
  return PANEL_REGISTRY[panelId];
}

/**
 * Get all available panels
 */
export function getAllPanels() {
  return Object.values(PANEL_REGISTRY);
}

/**
 * Get panels by category
 */
export function getPanelsByCategory(category) {
  return Object.values(PANEL_REGISTRY).filter(panel => panel.category === category);
}

/**
 * Get all categories
 */
export function getPanelCategories() {
  const categories = new Set();
  Object.values(PANEL_REGISTRY).forEach(panel => categories.add(panel.category));
  return Array.from(categories);
}

/**
 * Validate dashboard configuration
 */
export function validateDashboardConfig(config) {
  if (!config || typeof config !== 'object') return false;
  if (!Array.isArray(config.columns)) return false;
  
  // Validate each column
  for (const column of config.columns) {
    if (!column.id || !Array.isArray(column.panels)) return false;
    
    // Validate each panel exists in registry
    for (const panelId of column.panels) {
      if (!PANEL_REGISTRY[panelId]) {
        console.warn(`[Dashboard] Unknown panel ID: ${panelId}`);
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Migrate old config to new version if needed
 */
export function migrateDashboardConfig(config) {
  if (!config) return DEFAULT_DASHBOARD_CONFIG;
  
  // Future: Add migration logic here when config version changes
  if (config.version === 1) {
    return config;
  }
  
  return DEFAULT_DASHBOARD_CONFIG;
}
