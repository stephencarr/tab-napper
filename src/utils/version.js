/**
 * Version utilities for Tab Napper
 * Reads version from manifest.json for consistent display
 */

/**
 * Get version from Chrome extension manifest
 */
function getExtensionVersion() {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
      const manifest = chrome.runtime.getManifest();
      return manifest.version;
    } else {
      // Fallback for development/testing
      return '0.2.0';
    }
  } catch (error) {
    console.warn('[Tab Napper] Could not read manifest version:', error);
    return '0.2.0';
  }
}

/**
 * Get formatted version string for display
 */
function getFormattedVersion() {
  return `v${getExtensionVersion()}`;
}

export {
  getExtensionVersion,
  getFormattedVersion
};