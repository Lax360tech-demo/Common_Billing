import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { THEMES } from '../data/themes';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'lax360_app_theme';
const MODE_STORAGE_KEY = 'lax360_app_mode';

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'default');
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_STORAGE_KEY) || 'light');

  const activeTheme = useMemo(() => {
    return THEMES.find((t) => t.id === themeId) || THEMES[0];
  }, [themeId]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
    localStorage.setItem(MODE_STORAGE_KEY, mode);

    const colors = mode === 'dark' && activeTheme.dark ? activeTheme.dark : activeTheme.colors;
    const root = document.documentElement;

    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-primary-hover', colors.primaryHover);
    root.style.setProperty('--theme-primary-light', colors.primaryLight);
    root.style.setProperty('--theme-primary-border', colors.primaryBorder);
    root.style.setProperty('--theme-primary-text', colors.primaryText || '#ffffff');

    root.style.setProperty('--theme-bg-main', colors.bgMain);
    root.style.setProperty('--theme-bg-card', colors.bgCard);
    root.style.setProperty('--theme-bg-sidebar', colors.bgSidebar);

    root.style.setProperty('--theme-sidebar-text', colors.sidebarText);
    root.style.setProperty('--theme-sidebar-active', colors.sidebarActive);
    root.style.setProperty('--theme-sidebar-border', colors.sidebarBorder);

    root.style.setProperty('--theme-border', colors.border);
    root.style.setProperty('--theme-text-main', colors.textMain);
    root.style.setProperty('--theme-text-muted', colors.textMuted);
    root.style.setProperty('--theme-accent', colors.accent || '#f59e0b');

    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [activeTheme, themeId, mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const changeTheme = useCallback((newThemeId) => {
    setThemeId(newThemeId);
  }, []);

  const value = useMemo(
    () => ({
      activeTheme,
      themeId,
      changeTheme,
      mode,
      toggleMode,
      allThemes: THEMES
    }),
    [activeTheme, themeId, changeTheme, mode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
