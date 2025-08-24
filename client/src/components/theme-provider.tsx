import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { getCurrentUserId } from "@/utils/user-session";
import { safeRemoveChild, safeAppendChild, safeQuerySelector } from "@/utils/dom-safety";

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
  userId, // Will be set dynamically in useEffect
  ...props
}: ThemeProviderProps) {
  // Get user ID safely inside component
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  useEffect(() => {
    // Set user ID after component mounts
    try {
      const id = userId || getCurrentUserId();
      setCurrentUserId(id);
    } catch (error) {
      console.warn('Failed to get current user ID in ThemeProvider:', error);
      setCurrentUserId('fallback_user_' + Date.now());
    }
  }, [userId]);
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [preferences, setPreferences] = useState<UserPreferences>(initialState.preferences);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  // Load preferences from backend on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!currentUserId) {
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
        const response = await fetch(`/api/users/${currentUserId}/preferences`);
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
        console.warn("Failed to load user preferences:", error);
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

    if (currentUserId) {
      loadPreferences();
    }
  }, [currentUserId, defaultTheme, storageKey]);

  // Apply theme and colors to DOM
  useEffect(() => {
    // Safety check - ensure we're in browser environment and component is still mounted
    if (typeof window === 'undefined' || !window.document || isUnmountedRef.current) {
      return;
    }

    const root = window.document.documentElement;

    try {
      // Safety check for root element
      if (!root || !root.classList || !root.style) {
        throw new Error("DOM root element недоступен");
      }

      // Remove existing theme classes safely
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

      // Apply custom colors with validation
      if (preferences.primaryColor && /^#[0-9A-Fa-f]{6}$/.test(preferences.primaryColor)) {
        root.style.setProperty("--primary", preferences.primaryColor);
      }
      if (preferences.accentColor && /^#[0-9A-Fa-f]{6}$/.test(preferences.accentColor)) {
        root.style.setProperty("--electric-green", preferences.accentColor);
      }
      if (preferences.backgroundColor && preferences.backgroundColor.match(/^#[0-9A-Fa-f]{6}$/)) {
        root.style.setProperty("--background", preferences.backgroundColor);
      }

      // Apply custom CSS safely
      if (!document.head) {
        throw new Error("Document head недоступен");
      }

      let customStyleElement = safeQuerySelector("#user-custom-styles") as HTMLStyleElement | null;
      if (preferences.customCss) {
        if (!customStyleElement) {
          customStyleElement = document.createElement("style");
          customStyleElement.id = "user-custom-styles";
          safeAppendChild(document.head, customStyleElement);
        }
        if (customStyleElement) {
          customStyleElement.textContent = preferences.customCss;
        }
      } else if (customStyleElement) {
        // Safe removal using our utility
        safeRemoveChild(document.head, customStyleElement);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка при обновлении темы";
      console.warn("Failed to update theme class:", error);
      setError(`Ошибка применения темы: ${errorMessage}`);
      // Clear previous timer if exists
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
      errorTimerRef.current = setTimeout(() => {
        setError(null);
        errorTimerRef.current = null;
      }, 5000);
    }
  }, [theme, preferences]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, []);

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      setError(null); // Clear any previous errors
      const updated = { ...preferences, ...newPreferences };
      setPreferences(updated);

    // Update theme if it changed
    if (newPreferences.theme) {
      setTheme(newPreferences.theme);
    }

    // Save to localStorage immediately for offline support
    localStorage.setItem(storageKey, updated.theme);

    // Save to backend if userId is available
    if (currentUserId) {
      try {
        const response = await fetch(`/api/users/${currentUserId}/preferences`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updated),
        });

        if (!response.ok) {
          console.warn("Failed to save preferences to backend");
          // Don't revert local changes - user sees immediate feedback
          // Backend sync will be retried on next app load
        }
      } catch (error) {
        console.warn("Failed to sync preferences:", error);
        // Don't revert local changes - offline support
      }
    }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      setError(`Ошибка сохранения настроек: ${errorMessage}`);
      // Clear previous timer if exists
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
      errorTimerRef.current = setTimeout(() => {
        setError(null);
        errorTimerRef.current = null;
      }, 5000);
      throw error; // Re-throw so UI components can handle it
    }
  };

  const value = {
    theme,
    preferences,
    isLoading,
    error,
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