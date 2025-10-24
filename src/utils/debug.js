/**
 * Debug utilities for Tab Napper
 * Provides centralized logging control
 */

// Check if we're in development mode or debug is explicitly enabled
const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = localStorage.getItem('tabNapper_debug') === 'true' || isDevelopment;

/**
 * Conditional logging function
 * Only logs if debug mode is enabled
 */
export function debugLog(category, message, ...args) {
  if (isDebugEnabled) {
    console.log(`[Tab Napper:${category}]`, message, ...args);
  }
}

/**
 * Error logging (always enabled)
 */
export function debugError(category, message, ...args) {
  console.error(`[Tab Napper:${category}]`, message, ...args);
}

/**
 * Success logging (only in debug mode)
 */
export function debugSuccess(category, message, ...args) {
  if (isDebugEnabled) {
    console.log(`[Tab Napper:${category}] ✅`, message, ...args);
  }
}

/**
 * Warning logging (always enabled for important warnings)
 */
export function debugWarn(category, message, ...args) {
  console.warn(`[Tab Napper:${category}] ⚠️`, message, ...args);
}

/**
 * Enable/disable debug mode
 */
export function setDebugMode(enabled) {
  if (enabled) {
    localStorage.setItem('tabNapper_debug', 'true');
    console.log('[Tab Napper] Debug mode enabled');
  } else {
    localStorage.removeItem('tabNapper_debug');
    console.log('[Tab Napper] Debug mode disabled');
  }
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode() {
  return isDebugEnabled;
}

// Export debug controls for dev console
window.tabNapperDebug = {
  enable: () => setDebugMode(true),
  disable: () => setDebugMode(false),
  status: () => console.log(`Debug mode: ${isDebugMode() ? 'enabled' : 'disabled'}`)
};