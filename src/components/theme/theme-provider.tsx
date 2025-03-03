'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  isDarkMode: false,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'habladoc-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem(storageKey) as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [storageKey]);

  // Update document classes and track dark mode state
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous class
    root.classList.remove('light', 'dark');
    
    let resolvedTheme: 'light' | 'dark';
    
    if (theme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      
      // Listen for system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const newTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(newTheme);
        setIsDarkMode(mediaQuery.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      resolvedTheme = theme;
    }
    
    root.classList.add(resolvedTheme);
    setIsDarkMode(resolvedTheme === 'dark');
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  const value = {
    theme,
    setTheme,
    isDarkMode,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
    
  return context;
};

// Theme debug component
export const ThemeDebug = () => {
  const { theme, isDarkMode } = useTheme();
  
  return (
    <div className="fixed top-20 right-4 p-3 bg-card border rounded shadow-lg z-50 text-xs">
      <div><strong>Current Theme:</strong> {theme}</div>
      <div><strong>Dark Mode:</strong> {isDarkMode ? 'Yes' : 'No'}</div>
      <div><strong>CSS Variables:</strong></div>
      <div className="grid grid-cols-2 gap-1 mt-2">
        <div className="bg-primary-500 p-1 rounded">primary-500</div>
        <div className="bg-success-500 p-1 rounded text-white">success-500</div>
        <div className="bg-warning-500 p-1 rounded">warning-500</div>
        <div className="bg-danger-500 p-1 rounded text-white">danger-500</div>
      </div>
    </div>
  );
};