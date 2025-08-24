
// Утилиты для детекции PWA и улучшения совместимости

export class PWADetector {
  // Проверяем, запущено ли приложение как PWA
  static isRunningAsPWA(): boolean {
    // Проверка standalone режима
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Проверка для iOS Safari
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    // Проверка по параметру URL (из манифеста)
    const hasA2HSParam = new URLSearchParams(window.location.search).get('source') === 'a2hs';
    
    return isStandalone || isIOSStandalone || hasA2HSParam;
  }

  // Проверяем поддержку PWA в браузере
  static isPWASupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Получаем информацию о браузере для отладки
  static getBrowserInfo(): string {
    const ua = navigator.userAgent;
    
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'chrome';
    if (ua.includes('Firefox')) return 'firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'safari';
    if (ua.includes('Edg')) return 'edge';
    
    return 'unknown';
  }

  // Проверяем, нужно ли показывать кнопку установки
  static shouldShowInstallPrompt(): boolean {
    return !this.isRunningAsPWA() && this.isPWASupported();
  }

  // Логирование для отладки PWA проблем
  static debugPWAStatus(): void {
    console.log('🔍 PWA Debug Info:', {
      isRunningAsPWA: this.isRunningAsPWA(),
      isPWASupported: this.isPWASupported(),
      browser: this.getBrowserInfo(),
      displayMode: this.getDisplayMode(),
      hasServiceWorker: 'serviceWorker' in navigator,
      userAgent: navigator.userAgent
    });
  }

  // Получаем текущий режим отображения
  private static getDisplayMode(): string {
    if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
    if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
    return 'browser';
  }
}

// Инициализируем отладку при загрузке
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  PWADetector.debugPWAStatus();
}
