/**
 * State Persistence Layer
 *
 * #Business-Intent
 * Preserve user calculations and preferences across sessions.
 *
 * @level-one-validation
 * ✓ localStorage recovery tested
 * ✓ Serialization validated
 * ✓ Error handling implemented
 *
 * @risk-area
 * Browser storage limitations and private browsing restrictions.
 *
 * #Scope-Of-Improvement
 * - IndexedDB support
 * - Cloud synchronization
 */

import { useState, useEffect, useCallback } from 'react';


export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Custom hook for managing footprint history entries
 * @returns {{ entries: Array, addEntry: function, clearHistory: function, getLatestEntry: function }}
 */
export function useFootprintHistory() {
  const [entries, setEntries] = useLocalStorage('greeniq_history', []);

  const addEntry = useCallback((footprintResult, inputs) => {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      inputs,
      result: footprintResult
    };
    setEntries(prev => [entry, ...prev].slice(0, 50)); // Keep last 50 entries
    return entry;
  }, [setEntries]);

  const clearHistory = useCallback(() => {
    setEntries([]);
  }, [setEntries]);

  const getLatestEntry = useCallback(() => {
    return entries.length > 0 ? entries[0] : null;
  }, [entries]);

  const getStreak = useCallback(() => {
    if (entries.length === 0) return 0;
    // Count entries in the current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return entries.filter(e => {
      const d = new Date(e.timestamp);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }, [entries]);

  return { entries, addEntry, clearHistory, getLatestEntry, getStreak };
}

/**
 * Custom hook for theme (dark/light mode)
 * Respects system preference and persists user choice
 * @returns {{ theme: string, toggleTheme: function, isDark: boolean }}
 */
export function useTheme() {
  const [theme, setTheme] = useLocalStorage('greeniq_theme', () => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  return { theme, toggleTheme, isDark: theme === 'dark' };
}
