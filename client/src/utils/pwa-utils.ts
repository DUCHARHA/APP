
// PWA utility functions

// Check if app is running in standalone mode
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}

// Check if PWA is installable (улучшенная версия)
export function isPWAInstallable(): boolean {
  // Базовые требования
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasManifest = !!document.querySelector('link[rel="manifest"]');
  
  // Проверяем HTTPS (PWA требует HTTPS, кроме localhost)
  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
  
  return hasServiceWorker && hasManifest && isSecure;
}

// Проверяем поддержку конкретных PWA фич по браузерам
export function getBrowserPWACapabilities(): {
  canInstall: boolean;
  hasInstallPrompt: boolean;
  supportsManifest: boolean;
  supportsServiceWorker: boolean;
  browserName: string;
} {
  const ua = navigator.userAgent;
  let browserName = 'unknown';
  let canInstall = false;
  let hasInstallPrompt = false;

  // Определяем браузер
  if (ua.includes('Firefox')) {
    browserName = 'firefox';
    canInstall = true; // Firefox поддерживает PWA
    hasInstallPrompt = false; // Но без beforeinstallprompt
  } else if (ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Edg')) {
    browserName = 'safari';
    canInstall = /iPad|iPhone|iPod/.test(ua); // PWA только на iOS Safari
    hasInstallPrompt = false;
  } else if (ua.includes('MiuiBrowser') || ua.includes('MIUI Browser') || ua.includes('XiaoMi')) {
    browserName = 'miui';
    canInstall = true; // MIUI Browser поддерживает PWA
    hasInstallPrompt = false; // Без beforeinstallprompt
  } else if (ua.includes('Edg')) {
    browserName = 'edge';
    canInstall = true;
    hasInstallPrompt = true;
  } else if (ua.includes('OPR') || ua.includes('Opera')) {
    browserName = 'opera';
    canInstall = true;
    hasInstallPrompt = true;
  } else if (ua.includes('Chrome')) {
    browserName = 'chrome';
    canInstall = true;
    hasInstallPrompt = true;
  }

  return {
    canInstall,
    hasInstallPrompt,
    supportsManifest: !!document.querySelector('link[rel="manifest"]'),
    supportsServiceWorker: 'serviceWorker' in navigator,
    browserName
  };
}

// Get PWA display mode
export function getPWADisplayMode(): string {
  if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
  if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
  return 'browser';
}

// Add to home screen analytics
export function trackA2HSEvent(action: 'prompt_shown' | 'prompt_accepted' | 'prompt_dismissed' | 'manual_install'): void {
  const { browserName } = getBrowserPWACapabilities();
  console.log(`A2HS Event: ${action} (Browser: ${browserName})`);
  // Here you would send analytics to your preferred service
}

// Check if app was launched from home screen
export function isLaunchedFromHomeScreen(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('source') === 'a2hs';
}

// Получаем специфичные для браузера инструкции по установке
export function getBrowserSpecificInstallInstructions(): string {
  const { browserName } = getBrowserPWACapabilities();
  
  switch (browserName) {
    case 'miui':
      return 'Нажмите меню (⋮) → "Добавить ярлык" или "Настройки" → "Добавить на рабочий стол"';
    
    case 'firefox':
      return 'Нажмите меню Firefox (☰) → "Установить приложение"';
    
    case 'safari':
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        return 'Нажмите "Поделиться" (□↗) → "На экран Домой"';
      } else {
        return 'Нажмите меню Safari → "Добавить в Dock"';
      }
    
    case 'edge':
      return 'Нажмите меню Edge (⋯) → "Приложения" → "Установить это приложение"';
    
    case 'opera':
      return 'Нажмите меню Opera → "Установить приложение"';
    
    case 'chrome':
    default:
      return 'Нажмите меню браузера (⋮) → "Добавить на главный экран"';
  }
}

// Проверяем, поддерживает ли браузер автоматическую установку
export function supportsAutomaticInstall(): boolean {
  const { hasInstallPrompt } = getBrowserPWACapabilities();
  return hasInstallPrompt;
}
