import React, { createContext, useContext, useState } from "react";

interface ThemeContextType {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  theme: {
    backgroundColor: string;
    cardBackground: string;
    textColor: string;
    subTextColor: string;
    accentColor: string;
    borderColor: string;
  };
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false);

  const theme = {
    backgroundColor: darkMode ? "#1a1a2e" : "#FAFAFA",
    cardBackground: darkMode ? "#2a2a3e" : "#fff",
    textColor: darkMode ? "#fff" : "#1a1a2e",
    subTextColor: darkMode ? "#ccc" : "#888",
    accentColor: "#FF6B35",
    borderColor: darkMode ? "#444" : "#f5f5f5",
  };

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
};