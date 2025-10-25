import { useEffect } from 'react';

/**
 * Custom hook to handle dark mode detection and application
 * Applies dark mode based on system preference and listens for changes
 */
export function useDarkMode() {
  useEffect(() => {
    function applyDarkMode() {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    // Apply immediately
    applyDarkMode();
    
    // Listen for changes in system dark mode preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', applyDarkMode);
    
    // Cleanup listener on unmount
    return () => {
      darkModeMediaQuery.removeEventListener('change', applyDarkMode);
    };
  }, []);
}

/**
 * Manual dark mode toggle function for debugging
 */
export function toggleDarkMode() {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }
}