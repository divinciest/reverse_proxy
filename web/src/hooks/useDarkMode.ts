import { useState, useEffect } from 'react';

const DARK_MODE_KEY = 'darkMode';

export const useDarkMode = () => {
  // Initialize with a default value, will be updated after localStorage check
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check localStorage immediately during initialization
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(DARK_MODE_KEY);
      if (savedMode !== null) {
        return savedMode === 'true';
      }
      // If no saved preference, use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      // Save the system preference
      localStorage.setItem(DARK_MODE_KEY, prefersDark.toString());
      return prefersDark;
    }
    return false;
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Handle initial render and localStorage check
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedMode = localStorage.getItem(DARK_MODE_KEY);

    if (savedMode !== null) {
      // If we have a saved preference, use it
      setIsDarkMode(savedMode === 'true');
    } else {
      // If no saved preference, use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      // Save the system preference
      localStorage.setItem(DARK_MODE_KEY, prefersDark.toString());
    }

    setIsInitialized(true);
  }, []); // Empty dependency array means this runs once on mount

  // Handle dark mode changes and system preference changes
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;

    // Update localStorage immediately when dark mode changes
    localStorage.setItem(DARK_MODE_KEY, isDarkMode.toString());

    // Update document class
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't set a preference
      if (localStorage.getItem(DARK_MODE_KEY) === null) {
        setIsDarkMode(e.matches);
        localStorage.setItem(DARK_MODE_KEY, e.matches.toString());
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [isDarkMode, isInitialized]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const setDarkMode = (dark: boolean) => {
    setIsDarkMode(dark);
  };

  return {
    isDarkMode, toggleDarkMode, setDarkMode, isInitialized,
  };
};
