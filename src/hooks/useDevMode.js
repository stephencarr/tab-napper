/**
 * Dev Mode Hook
 * Manages developer mode state with localStorage persistence
 * Includes easter egg activation
 */

import { useState, useEffect } from 'react';

const DEV_MODE_KEY = 'tabNapper_devMode';
const EASTER_EGG_SEQUENCE = ['Tab', 'Nap', 'Dev']; // Press these keys in order
let easterEggIndex = 0;
let easterEggTimeout = null;

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
 */
export function setupDevModeEasterEgg(onActivate) {
  if (typeof window === 'undefined') return () => {};

  const handleKeyPress = (e) => {
    const expectedKey = EASTER_EGG_SEQUENCE[easterEggIndex];
    
    // Check if the pressed key matches (case insensitive)
    if (e.key && e.key.toLowerCase() === expectedKey.toLowerCase()) {
      easterEggIndex++;
      
      // Reset timeout
      if (easterEggTimeout) {
        clearTimeout(easterEggTimeout);
      }
      
      // If sequence complete, activate dev mode
      if (easterEggIndex >= EASTER_EGG_SEQUENCE.length) {
        console.log('🎉 Dev Mode Easter Egg Activated!');
        onActivate();
        easterEggIndex = 0;
      } else {
        // Set timeout to reset sequence after 2 seconds
        easterEggTimeout = setTimeout(() => {
          easterEggIndex = 0;
        }, 2000);
      }
    } else if (e.key && e.key.length === 1) {
      // Any other character key resets the sequence
      easterEggIndex = 0;
      if (easterEggTimeout) {
        clearTimeout(easterEggTimeout);
      }
    }
  };

  window.addEventListener('keydown', handleKeyPress);

  return () => {
    window.removeEventListener('keydown', handleKeyPress);
    if (easterEggTimeout) {
      clearTimeout(easterEggTimeout);
    }
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
