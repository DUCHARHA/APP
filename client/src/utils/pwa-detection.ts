
// Утилиты для детекции PWA и улучшения совместимости

export class PWADetector {
  // Проверяем, запущено ли приложение как PWA
  static isRunningAsPWA(): boolean {
    // Проверка standalone режима
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Проверка для iOS Safari
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    // Проверка по параметру URL (из манифеста)
    const hasA2HSParam = new URLSearchParams(window.location.search).get('utm_source') === 'pwa' ||
                         new URLSearchParams(window.location.search).get('source') === 'a2hs';
    
    // Специальная проверка для Honor устройств
    const isHonorPWA = this.isRunningAsPWAOnHonor();
    
    return isStandalone || isIOSStandalone || hasA2HSParam || isHonorPWA;
  }

  // Проверяем поддержку PWA в браузере
  static isPWASupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Получаем информацию о браузере для отладки
  static getBrowserInfo(): string {
    const ua = navigator.userAgent;
    
    if (ua.includes('HuaweiBrowser') || ua.includes('Honor')) return 'honor';
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'chrome';
    if (ua.includes('Firefox')) return 'firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'safari';
    if (ua.includes('Edg')) return 'edge';
    if (ua.includes('SamsungBrowser')) return 'samsung';
    if (ua.includes('MiuiBrowser')) return 'miui';
    
    return 'unknown';
  }

  // Проверяем, является ли устройство Honor/Huawei
  static isHonorDevice(): boolean {
    const ua = navigator.userAgent;
    return ua.includes('Honor') || ua.includes('HONOR') || ua.includes('Huawei') || ua.includes('HuaweiBrowser');
  }

  // Специальная проверка PWA для Honor устройств
  static isRunningAsPWAOnHonor(): boolean {
    if (!this.isHonorDevice()) return false;
    
    // Honor может показывать PWA как отдельное приложение, но без display-mode: standalone
    const hasA2HSParam = new URLSearchParams(window.location.search).get('utm_source') === 'pwa';
    const isFullScreen = window.innerHeight === screen.height;
    const hasNoAddressBar = !window.locationbar.visible;
    
    return hasA2HSParam || isFullScreen || hasNoAddressBar;
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
