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
  // Read from localStorage synchronously during initialization
  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return defaultTheme;
    
    try {
      const savedTheme = window.localStorage.getItem(storageKey) as Theme | null;
      if (savedTheme && ['dark', 'light', 'system'].includes(savedTheme)) {
        return savedTheme;
      }
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
    }
    
    return defaultTheme;
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const applyTheme = (themeToApply: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    let resolvedTheme: 'light' | 'dark';
    if (themeToApply === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      resolvedTheme = themeToApply;
    }
    
    root.classList.add(resolvedTheme);
    setIsDarkMode(resolvedTheme === 'dark');
    
    // Store in localStorage
    try {
      localStorage.setItem(storageKey, themeToApply);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  };

  // Initialize theme and set up system theme listener
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Initial theme application
    applyTheme(theme);

    // Handle system theme changes
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Handle manual theme changes
  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const value = {
    theme,
    setTheme: handleSetTheme,
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