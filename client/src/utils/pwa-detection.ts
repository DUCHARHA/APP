
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
    // Базовая поддержка Service Workers
    const hasServiceWorker = 'serviceWorker' in navigator;
    
    // Проверяем наличие manifest
    const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
    
    // Для большинства современных браузеров достаточно этого
    return hasServiceWorker && hasManifest;
  }

  // Проверяем, может ли браузер установить PWA
  static canInstallPWA(): boolean {
    const browser = this.getBrowserInfo();
    
    // Chrome/Edge/Opera - поддерживают beforeinstallprompt
    if (browser === 'chrome' || browser === 'edge' || browser === 'opera') {
      return true;
    }
    
    // MIUI Browser - поддерживает PWA с ограничениями
    if (browser === 'miui') {
      return this.isPWASupported();
    }
    
    // Яндекс.Браузер - поддерживает PWA с автоустановкой
    if (browser === 'yandex') {
      return true;
    }
    
    // Firefox - поддерживает PWA, но без beforeinstallprompt
    if (browser === 'firefox') {
      return this.isPWASupported();
    }
    
    // Safari iOS - свой механизм установки
    if (browser === 'safari' && this.isIOS()) {
      return true;
    }
    
    // Safari macOS - ограниченная поддержка
    if (browser === 'safari' && !this.isIOS()) {
      return this.isPWASupported();
    }
    
    // Для остальных браузеров - базовая проверка
    return this.isPWASupported();
  }

  // Получаем информацию о браузере для отладки
  static getBrowserInfo(): string {
    const ua = navigator.userAgent;
    
    if (ua.includes('Firefox')) return 'firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Edg')) return 'safari';
    if (ua.includes('Edg')) return 'edge';
    if (ua.includes('OPR') || ua.includes('Opera')) return 'opera';
    if (ua.includes('MiuiBrowser') || ua.includes('MIUI Browser') || ua.includes('XiaoMi')) return 'miui';
    if (ua.includes('YaBrowser') || ua.includes('Yandex')) return 'yandex';
    if (ua.includes('Chrome')) return 'chrome';
    
    return 'unknown';
  }

  // Проверяем iOS
  static isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Проверяем мобильное устройство
  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Проверяем, нужно ли показывать кнопку установки
  static shouldShowInstallPrompt(): boolean {
    return !this.isRunningAsPWA() && this.canInstallPWA();
  }

  // Получаем инструкции по установке для конкретного браузера
  static getInstallInstructions(): string {
    const browser = this.getBrowserInfo();
    
    switch (browser) {
      case 'miui':
        return 'Для установки в Mi Browser:\n1. Нажмите меню (⋮) в правом углу\n2. Выберите "Добавить ярлык"\n3. Или нажмите "Настройки" → "Дополнительно" → "Добавить на рабочий стол"';
      
      case 'yandex':
        return 'Для установки в Яндекс.Браузере:\n1. Нажмите меню (☰) справа от адресной строки\n2. Выберите "Установить приложение"\n3. Или используйте кнопку установки в адресной строке';
      
      case 'firefox':
        return 'Для установки:\n1. Нажмите меню Firefox (☰)\n2. Выберите "Установить приложение"\n3. Подтвердите установку';
      
      case 'safari':
        if (this.isIOS()) {
          return 'Для установки:\n1. Нажмите кнопку "Поделиться" (□↗)\n2. Выберите "На экран Домой"\n3. Нажмите "Добавить"';
        } else {
          return 'Для установки:\n1. Нажмите меню Safari\n2. Выберите "Добавить в Dock"\n3. Подтвердите установку';
        }
      
      case 'edge':
        return 'Для установки:\n1. Нажмите меню Edge (⋯)\n2. Выберите "Приложения" → "Установить это приложение"\n3. Подтвердите установку';
      
      case 'opera':
        return 'Для установки:\n1. Нажмите меню Opera\n2. Выберите "Установить приложение"\n3. Подтвердите установку';
      
      default:
        return 'Для установки:\n1. Нажмите меню браузера (⋮)\n2. Выберите "Добавить на главный экран"\n3. Подтвердите установку';
    }
  }

  // Логирование для отладки PWA проблем
  static debugPWAStatus(): void {
    console.log('🔍 PWA Debug Info:', {
      isRunningAsPWA: this.isRunningAsPWA(),
      isPWASupported: this.isPWASupported(),
      canInstallPWA: this.canInstallPWA(),
      browser: this.getBrowserInfo(),
      isIOS: this.isIOS(),
      isMobile: this.isMobile(),
      displayMode: this.getDisplayMode(),
      hasServiceWorker: 'serviceWorker' in navigator,
      hasManifest: !!document.querySelector('link[rel="manifest"]'),
      userAgent: import.meta.env.PROD ? '[Hidden for security]' : navigator.userAgent
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
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  PWADetector.debugPWAStatus();
}
