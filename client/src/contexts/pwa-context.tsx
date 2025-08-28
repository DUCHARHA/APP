
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PWAContextType {
  showInstallBanner: boolean;
  setShowInstallBanner: (show: boolean) => void;
  deferredPrompt: any;
  setDeferredPrompt: (prompt: any) => void;
  isInstalling: boolean;
  setIsInstalling: (installing: boolean) => void;
  handleInstall: () => Promise<void>;
  handleDismiss: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};

interface PWAProviderProps {
  children: ReactNode;
}

export const PWAProvider: React.FC<PWAProviderProps> = ({ children }) => {
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if banner was previously dismissed
      const dismissed = localStorage.getItem('pwa-install-banner-dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support beforeinstallprompt
      alert('Чтобы установить приложение:\n\n1. Нажмите меню браузера (⋮)\n2. Выберите "Добавить на главный экран"\n3. Подтвердите установку');
      return;
    }

    setIsInstalling(true);
    
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        // PWA successfully installed
        setShowInstallBanner(false);
        localStorage.setItem('pwa-install-banner-dismissed', 'true');
      }
    } catch (error) {
      console.warn('Ошибка установки PWA:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-banner-dismissed', 'true');
  };

  const value: PWAContextType = {
    showInstallBanner,
    setShowInstallBanner,
    deferredPrompt,
    setDeferredPrompt,
    isInstalling,
    setIsInstalling,
    handleInstall,
    handleDismiss,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
};
