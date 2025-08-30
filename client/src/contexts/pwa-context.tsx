
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PWADetector } from '@/utils/pwa-detection';

interface PWAContextType {
  showInstallBanner: boolean;
  setShowInstallBanner: (show: boolean) => void;
  showHomeBanner: boolean;
  setShowHomeBanner: (show: boolean) => void;
  deferredPrompt: any;
  setDeferredPrompt: (prompt: any) => void;
  isInstalling: boolean;
  setIsInstalling: (installing: boolean) => void;
  handleInstall: () => Promise<void>;
  handleDismissHome: () => void;
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
  const [showHomeBanner, setShowHomeBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Слушаем событие beforeinstallprompt (Chrome/Edge/Opera)
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Универсальная проверка возможности установки PWA
    const checkPWAInstallability = () => {
      // Если уже установлено - не показываем баннеры
      if (PWADetector.isRunningAsPWA()) {
        setShowInstallBanner(false);
        setShowHomeBanner(false);
        return;
      }

      // Проверяем, может ли текущий браузер установить PWA
      if (PWADetector.canInstallPWA()) {
        // Проверяем, был ли домашний баннер отклонен ранее
        const homeDismissed = localStorage.getItem('pwa-home-banner-dismissed');
        if (!homeDismissed) {
          setShowHomeBanner(true);
        }
        
        // Баннер в профиле всегда показываем, если PWA можно установить
        setShowInstallBanner(true);
      }
    };

    // Проверяем сразу при загрузке
    checkPWAInstallability();

    // Также проверяем через небольшую задержку для случаев, когда DOM еще не готов
    const timeoutId = setTimeout(checkPWAInstallability, 1000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleInstall = async () => {
    const browser = PWADetector.getBrowserInfo();
    
    // Если есть deferredPrompt (Chrome/Edge/Opera), используем его
    if (deferredPrompt) {
      setIsInstalling(true);
      
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === "accepted") {
          setShowInstallBanner(false);
          setShowHomeBanner(false);
          localStorage.setItem('pwa-home-banner-dismissed', 'true');
        }
      } catch (error) {
        console.warn('Ошибка установки PWA:', error);
      } finally {
        setIsInstalling(false);
        setDeferredPrompt(null);
      }
      return;
    }

    // Fallback для браузеров без beforeinstallprompt
    const instructions = PWADetector.getInstallInstructions();
    alert(instructions);
  };

  const handleDismissHome = () => {
    setShowHomeBanner(false);
    localStorage.setItem('pwa-home-banner-dismissed', 'true');
  };

  const value: PWAContextType = {
    showInstallBanner,
    setShowInstallBanner,
    showHomeBanner,
    setShowHomeBanner,
    deferredPrompt,
    setDeferredPrompt,
    isInstalling,
    setIsInstalling,
    handleInstall,
    handleDismissHome
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  );
};
