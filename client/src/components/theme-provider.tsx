import { createContext, useContext, useEffect, useState, useRef } from "react";

type Theme = "dark" | "light" | "system";

export type UserPreferences = {
  theme: Theme;
  primaryColor: string;
  accentColor: string;
  backgroundColor?: string | null;
  customCss?: string | null;
};

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  userId?: string;
};

type ThemeProviderState = {
  theme: Theme;
  preferences: UserPreferences;
  setTheme: (theme: Theme) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

const initialState: ThemeProviderState = {
  theme: "light",
  preferences: {
    theme: "light",
    primaryColor: "#6366f1",
    accentColor: "#10b981",
    backgroundColor: null,
    customCss: null,
  },
  setTheme: () => null,
  updatePreferences: async () => {},
  isLoading: false,
  error: null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "vite-ui-theme",
  userId = "demo-user",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [preferences, setPreferences] = useState<UserPreferences>(initialState.preferences);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(storageKey) as Theme;
    if (savedTheme && savedTheme !== "system") {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Apply custom colors
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (preferences.primaryColor) {
      root.style.setProperty("--primary", preferences.primaryColor);
    }
    
    if (preferences.accentColor) {
      root.style.setProperty("--accent", preferences.accentColor);
    }
    
    if (preferences.backgroundColor) {
      root.style.setProperty("--background", preferences.backgroundColor);
    }
    
    if (preferences.customCss) {
      let styleElement = document.getElementById("user-custom-styles") as HTMLStyleElement;
      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = "user-custom-styles";
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = preferences.customCss;
    }
  }, [preferences]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem(storageKey, newTheme);
  };

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedPrefs = { ...preferences, ...newPrefs };
      setPreferences(updatedPrefs);
      
      if (newPrefs.theme !== undefined) {
        handleSetTheme(newPrefs.theme);
      }
      
      // Save to backend
      if (userId && userId !== "demo-user") {
        const response = await fetch(`/api/users/${userId}/preferences`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedPrefs),
        });
        
        if (!response.ok) {
          throw new Error("Failed to save preferences");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update preferences");
      console.error("Failed to update preferences:", err);
      
      // Clear error after 5 seconds
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
      errorTimerRef.current = setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    theme,
    preferences,
    setTheme: handleSetTheme,
    updatePreferences,
    isLoading,
    error,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};