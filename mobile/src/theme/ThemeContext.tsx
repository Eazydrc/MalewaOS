import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorPalette, ThemeKey, THEMES, OCEAN } from './themes';

const STORAGE_KEY = 'delipose_theme';

interface ThemeContextValue {
  themeKey: ThemeKey;
  colors:   ColorPalette;
  setTheme: (key: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeKey: 'OCEAN',
  colors:   OCEAN,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>('OCEAN');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && saved in THEMES) setThemeKey(saved as ThemeKey);
    });
  }, []);

  const setTheme = (key: ThemeKey) => {
    setThemeKey(key);
    AsyncStorage.setItem(STORAGE_KEY, key);
  };

  return (
    <ThemeContext.Provider value={{ themeKey, colors: THEMES[themeKey], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
