import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

/**
 * EventSphere is a dark-mode-only cinematic experience.
 * The ThemeProvider is kept for API compatibility but
 * always returns darkMode: true.
 */
export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ darkMode: true, toggleTheme: () => {} }}>
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
