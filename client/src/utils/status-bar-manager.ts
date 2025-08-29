
// Менеджер для управления статус-баром на мобильных устройствах
class StatusBarManagerClass {
  private isInitialized = false;

  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      this.updateStatusBarColor('#5B21B6');
      this.setupSafeAreaVars();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Status bar initialization failed:', error);
    }
  }

  updateStatusBarColor(color: string): void {
    if (typeof window === 'undefined') return;

    try {
      // Update meta theme-color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', color);
      }

      // Update CSS variables
      document.documentElement.style.setProperty('--status-bar-color', color);
      document.documentElement.style.setProperty('--ios-status-bar-bg', color);
    } catch (error) {
      console.warn('Failed to update status bar color:', error);
    }
  }

  private setupSafeAreaVars(): void {
    if (typeof window === 'undefined') return;

    try {
      // Setup CSS variables for safe areas
      const root = document.documentElement;
      root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top, 0px)');
      root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
      root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left, 0px)');
      root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right, 0px)');
    } catch (error) {
      console.warn('Failed to setup safe area vars:', error);
    }
  }
}

// Export singleton instance
export const statusBarManager = new StatusBarManagerClass();
