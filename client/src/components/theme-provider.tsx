import { createContext, useContext, useEffect, useState } from "react";

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
  userId?: string; // Add userId to sync with backend
};

type ThemeProviderState = {
  theme: Theme;
  preferences: UserPreferences;
  setTheme: (theme: Theme) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  isLoading: boolean;
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
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "vite-ui-theme",
  userId = "demo-user", // Default user for demo
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [preferences, setPreferences] = useState<UserPreferences>(initialState.preferences);
  const [isLoading, setIsLoading] = useState(false);

  // Load preferences from backend on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!userId) {
        // Fallback to localStorage if no userId
        const savedTheme = localStorage.getItem(storageKey) as Theme;
        if (savedTheme) {
          setTheme(savedTheme);
          setPreferences(prev => ({ ...prev, theme: savedTheme }));
        }
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${userId}/preferences`);
        if (response.ok) {
          const userPrefs = await response.json();
          setTheme(userPrefs.theme || defaultTheme);
          setPreferences({
            theme: userPrefs.theme || defaultTheme,
            primaryColor: userPrefs.primaryColor || "#6366f1",
            accentColor: userPrefs.accentColor || "#10b981",
            backgroundColor: userPrefs.backgroundColor || null,
            customCss: userPrefs.customCss || null,
          });
        } else {
          // Use localStorage as fallback
          const savedTheme = localStorage.getItem(storageKey) as Theme;
          if (savedTheme) {
            setTheme(savedTheme);
            setPreferences(prev => ({ ...prev, theme: savedTheme }));
          }
        }
      } catch (error) {
        console.error("Failed to load user preferences:", error);
        // Use localStorage as fallback
        const savedTheme = localStorage.getItem(storageKey) as Theme;
        if (savedTheme) {
          setTheme(savedTheme);
          setPreferences(prev => ({ ...prev, theme: savedTheme }));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [userId, defaultTheme, storageKey]);

  // Apply theme and colors to DOM
  useEffect(() => {
    const root = window.document.documentElement;

    try {
      root.classList.remove("light", "dark");

      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";

        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }

      // Apply custom colors
      if (preferences.primaryColor) {
        root.style.setProperty("--primary", preferences.primaryColor);
      }
      if (preferences.accentColor) {
        root.style.setProperty("--electric-green", preferences.accentColor);
      }
      if (preferences.backgroundColor) {
        root.style.setProperty("--background", preferences.backgroundColor);
      }

      // Apply custom CSS
      let customStyleElement = document.getElementById("user-custom-styles");
      if (preferences.customCss) {
        if (!customStyleElement) {
          customStyleElement = document.createElement("style");
          customStyleElement.id = "user-custom-styles";
          document.head.appendChild(customStyleElement);
        }
        customStyleElement.textContent = preferences.customCss;
      } else if (customStyleElement) {
        customStyleElement.remove();
      }
    } catch (error) {
      console.warn("Failed to update theme class:", error);
    }
  }, [theme, preferences]);

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);

    // Update theme if it changed
    if (newPreferences.theme) {
      setTheme(newPreferences.theme);
    }

    // Save to localStorage immediately for offline support
    localStorage.setItem(storageKey, updated.theme);

    // Save to backend if userId is available
    if (userId) {
      try {
        const response = await fetch(`/api/users/${userId}/preferences`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updated),
        });

        if (!response.ok) {
          console.error("Failed to save preferences to backend");
          // Don't revert local changes - user sees immediate feedback
          // Backend sync will be retried on next app load
        }
      } catch (error) {
        console.error("Failed to sync preferences:", error);
        // Don't revert local changes - offline support
      }
    }
  };

  const value = {
    theme,
    preferences,
    isLoading,
    setTheme: (newTheme: Theme) => {
      updatePreferences({ theme: newTheme });
    },
    updatePreferences,
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