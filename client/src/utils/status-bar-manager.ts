// Status bar color management for PWA
class StatusBarManager {
  private isInitialized = false;
  private metaElement: HTMLMetaElement | null = null;

  init(): void {
    if (this.isInitialized) return;

    try {
      // Find existing meta tag or create new one
      this.metaElement = document.querySelector('meta[name="theme-color"]');

      if (!this.metaElement) {
        this.metaElement = document.createElement('meta');
        this.metaElement.name = 'theme-color';
        document.head.appendChild(this.metaElement);
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize status bar manager:', error);
    }
  }

  setPurple(): void {
    this.init();
    this.setColor('#5B21B6');
  }

  setWhite(): void {
    this.init();
    this.setColor('#FFFFFF');
  }

  private setColor(color: string): void {
    try {
      if (this.metaElement) {
        this.metaElement.content = color;
      }
    } catch (error) {
      console.warn('Failed to set status bar color:', error);
    }
  }
}

// Export singleton instance
export const statusBarManager = new StatusBarManager();