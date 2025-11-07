import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const systemTheme = mediaQuery.matches ? 'dark' : 'light';

    // Check localStorage or default to system
    const savedTheme = localStorage.getItem('theme') || 'system';
    const initialTheme = savedTheme === 'system' ? systemTheme : savedTheme;

    setTheme(initialTheme);
    applyTheme(initialTheme);

    // Listen for system theme changes
    const handleChange = (e) => {
      if (localStorage.getItem('theme') === 'system') {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (newTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setSystemTheme = () => {
    localStorage.setItem('theme', 'system');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(systemTheme);
    applyTheme(systemTheme);
  };

  return {
    theme,
    toggleTheme,
    setSystemTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isSystem: (typeof window !== 'undefined' && window.localStorage) ? localStorage.getItem('theme') === 'system' : false,
  };
};
