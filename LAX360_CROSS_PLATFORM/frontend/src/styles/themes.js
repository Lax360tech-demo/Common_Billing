import themesData from './themes.json';

export const THEMES = themesData;

export const THEME_CATEGORIES = [
  { id: 'all', label: 'All Themes' },
  { id: 'luxury', label: 'Premium & Luxury' },
  { id: 'tech', label: 'Modern Tech & AI' },
  { id: 'minimal', label: 'Minimal Aesthetic' },
  { id: 'corporate', label: 'Executive & Signature' },
  { id: 'classic', label: 'Classic Store' }
];

export const getThemeById = (id) => {
  return THEMES.find((t) => t.id === id) || THEMES[0];
};

export const getThemeColors = (themeId = 'default', mode = 'light') => {
  const theme = getThemeById(themeId);
  if (mode === 'dark' && theme.dark) {
    return theme.dark;
  }
  return theme.colors;
};
