import React, { useState } from 'react';
import { Menu, Sun, Moon, Palette, Bell, Store, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';

export const Header = ({ onOpenMobileMenu }) => {
  const { business, user, categoryConfig } = useAuth();
  const { activeTheme, themeId, changeTheme, mode, toggleMode, allThemes } = useTheme();
  const { settings } = useApp();
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 px-4 sm:px-6 backdrop-blur-md">
      {/* Left side: Hamburger & Store Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs">
            <Store className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
              {business?.name || settings?.business?.name || 'Lax360 Enterprise Store'}
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-3 w-3" />
              {business?.category_name || categoryConfig?.name || 'Universal Business'}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Themes, Dark Mode, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Picker Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition cursor-pointer shadow-xs"
            title="Choose Aesthetic Color Theme (23 Themes)"
          >
            <Palette className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">{activeTheme?.name || 'Theme'}</span>
          </button>

          {isThemePickerOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsThemePickerOpen(false)} />
              <div className="absolute right-0 mt-2 z-50 w-72 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-2xl space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  23 Design Token Themes
                </p>
                {allThemes.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      changeTheme(th.id);
                      setIsThemePickerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition ${
                      themeId === th.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-4 w-4 rounded-full shadow-xs" style={{ backgroundColor: th.colors.primary }} />
                      <span>{th.name}</span>
                    </div>
                    {themeId === th.id && <Check className="h-4 w-4 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleMode}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition cursor-pointer shadow-xs"
          title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {mode === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
        </button>

        {/* Staff User Avatar */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="text-left text-xs">
            <p className="font-bold text-slate-900 dark:text-white leading-tight">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-slate-500 font-medium capitalize">{user?.role || 'Owner'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
