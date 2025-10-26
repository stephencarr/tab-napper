/**
 * Dev Mode Hook
 * Manages developer mode state with localStorage persistence
 * Includes easter egg activation
 */

import { useState, useEffect } from 'react';

const DEV_MODE_KEY = 'tabNapper_devMode';

/**
 * Hook to manage dev mode state
 */
export function useDevMode() {
  const [isDevMode, setIsDevMode] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(DEV_MODE_KEY) === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DEV_MODE_KEY, isDevMode.toString());
    }
  }, [isDevMode]);

  const toggleDevMode = () => {
    setIsDevMode(prev => !prev);
  };

  return { isDevMode, toggleDevMode };
}

/**
 * Set up easter egg listener for dev mode activation
 * Press Ctrl+Shift+D (or Cmd+Shift+D on Mac) to toggle dev mode
 */
export function setupDevModeEasterEgg(onActivate) {
  if (typeof window === 'undefined') return () => {};

  const handleKeyPress = (e) => {
    // Check for Ctrl+Shift+D (Windows/Linux) or Cmd+Shift+D (Mac)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      console.log('🎉 Dev Mode Toggle!');
      onActivate();
    }
  };

  window.addEventListener('keydown', handleKeyPress);

  return () => {
    window.removeEventListener('keydown', handleKeyPress);
  };
}

/**
 * Check if dev mode is enabled
 */
export function isDevModeEnabled() {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(DEV_MODE_KEY) === 'true';
}

/**
 * Enable dev mode programmatically
 */
export function enableDevMode() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DEV_MODE_KEY, 'true');
    console.log('✅ Dev Mode Enabled');
  }
}

/**
 * Disable dev mode programmatically
 */
export function disableDevMode() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DEV_MODE_KEY, 'false');
    console.log('❌ Dev Mode Disabled');
  }
}
