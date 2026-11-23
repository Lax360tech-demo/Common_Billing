import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES, getThemeById, getThemeColors } from '../styles/themes';
import { storage } from '../utils/storage';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [currentThemeId, setCurrentThemeId] = useState('default');
  const [previewThemeId, setPreviewThemeId] = useState(null);
  const [mode, setMode] = useState('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await storage.getItem('texbill_app_theme');
        const savedMode = await storage.getItem('texbill_app_mode');
        if (savedTheme) setCurrentThemeId(savedTheme);
        if (savedMode) setMode(savedMode);
      } catch (e) {
        console.warn('Failed to load theme:', e);
      }
    };
    loadTheme();
  }, []);

  const activeThemeId = previewThemeId || currentThemeId;
  const currentThemeObj = getThemeById(activeThemeId);
  const activeColors = getThemeColors(activeThemeId, mode);

  const saveTheme = async (themeId) => {
    setCurrentThemeId(themeId);
    setPreviewThemeId(null);
    await storage.setItem('texbill_app_theme', themeId);
  };

  const previewTheme = (themeId) => {
    setPreviewThemeId(themeId);
  };

  const toggleMode = async () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    setMode(nextMode);
    await storage.setItem('texbill_app_mode', nextMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        themes: THEMES,
        currentThemeId,
        previewThemeId,
        activeThemeId,
        activeTheme: {
          ...currentThemeObj,
          colors: activeColors
        },
        mode,
        toggleMode,
        previewTheme,
        saveTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
