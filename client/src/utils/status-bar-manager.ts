// Управление цветами status bar для PWA
export class StatusBarManager {
  private static instance: StatusBarManager;
  private currentColor: string = '#000000';

  private constructor() {}

  static getInstance(): StatusBarManager {
    if (!StatusBarManager.instance) {
      StatusBarManager.instance = new StatusBarManager();
    }
    return StatusBarManager.instance;
  }

  // Проверяем, запущено ли приложение в standalone режиме
  private isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Установка черного цвета (для splash screen)
  setBlack(): void {
    this.setColor('#000000');
  }

  // Установка фиолетового цвета (для основного приложения)
  setPurple(): void {
    this.setColor('#5B21B6');
  }

  // Универсальная установка цвета
  setColor(color: string): void {
    if (this.currentColor === color) return;

    this.currentColor = color;

    // Обновляем мета-тег theme-color
    this.updateThemeColorMeta(color);

    // Для Android Chrome
    this.updateAndroidStatusBar(color);

    // Для iOS Safari
    this.updateIOSStatusBar(color);
  }

  private updateThemeColorMeta(color: string): void {
    try {
      // Находим и обновляем основной theme-color мета-тег
      let themeColorMeta = document.querySelector('meta[name="theme-color"]:not([media])') as HTMLMetaElement;
      if (themeColorMeta) {
        themeColorMeta.content = color;
      }

      // Обновляем мета-теги для разных цветовых схем
      const lightThemeMeta = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]') as HTMLMetaElement;
      const darkThemeMeta = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]') as HTMLMetaElement;

      if (lightThemeMeta) lightThemeMeta.content = color;
      if (darkThemeMeta) darkThemeMeta.content = color;

      // Обновляем мета-тег для Microsoft
      const msMeta = document.querySelector('meta[name="msapplication-navbutton-color"]') as HTMLMetaElement;
      if (msMeta) msMeta.content = color;

    } catch (error) {
      console.warn('Ошибка обновления theme-color:', error);
    }
  }

  private updateAndroidStatusBar(color: string): void {
    try {
      // Для Android WebView и Chrome Custom Tabs
      if ('setStatusBarColor' in window) {
        (window as any).setStatusBarColor(color);
      }

      // Обновляем CSS переменную для дополнительной стилизации
      document.documentElement.style.setProperty('--status-bar-color', color);

    } catch (error) {
      console.warn('Ошибка обновления Android status bar:', error);
    }
  }

  private updateIOSStatusBar(color: string): void {
    try {
      // Для iOS устанавливаем стиль в зависимости от цвета
      let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement;

      if (statusBarMeta) {
        // Если цвет темный, используем light-content, если светлый - dark-content
        const isLightColor = this.isLightColor(color);
        statusBarMeta.content = isLightColor ? 'dark-content' : 'light-content';
      }

      // Устанавливаем цвет фона под status bar
      document.documentElement.style.setProperty('--ios-status-bar-bg', color);

    } catch (error) {
      console.warn('Ошибка обновления iOS status bar:', error);
    }
  }

  private isLightColor(color: string): boolean {
    // Простая проверка яркости цвета
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  }

  // Получение текущего цвета
  getCurrentColor(): string {
    return this.currentColor;
  }
}

// Экспорт синглтона
export const statusBarManager = StatusBarManager.getInstance();