import * as React from "react";

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

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "vite-ui-theme",
  userId = "demo-user",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>("light");
  const [preferences, setPreferences] = React.useState<UserPreferences>(initialState.preferences);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load theme from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && saved !== "system") {
        setThemeState(saved as Theme);
      }
    } catch (e) {
      console.warn("Failed to load theme from localStorage");
    }
  }, [storageKey]);

  // Apply theme to document
  React.useEffect(() => {
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
  React.useEffect(() => {
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
  }, [preferences]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  }, [storageKey]);

  const updatePreferences = React.useCallback(async (newPrefs: Partial<UserPreferences>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedPrefs = { ...preferences, ...newPrefs };
      setPreferences(updatedPrefs);
      
      if (newPrefs.theme !== undefined) {
        setTheme(newPrefs.theme);
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
    } finally {
      setIsLoading(false);
    }
  }, [preferences, userId, setTheme]);

  const value = React.useMemo(
    () => ({
      theme,
      preferences,
      setTheme,
      updatePreferences,
      isLoading,
      error,
    }),
    [theme, preferences, setTheme, updatePreferences, isLoading, error]
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};