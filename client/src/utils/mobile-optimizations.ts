class MobileOptimizerClass {
  private isInitialized = false;

  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      this.setupViewportOptimizations();
      this.setupTouchOptimizations();
      this.setupPerformanceOptimizations();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Mobile optimizer initialization failed:', error);
    }
  }

  private setupViewportOptimizations(): void {
    // Prevent zoom on input focus (iOS)
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input instanceof HTMLElement) {
        input.style.fontSize = '16px';
      }
    });

    // Setup safe area CSS variables
    const root = document.documentElement;
    root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top, 0px)');
    root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
    root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left, 0px)');
    root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right, 0px)');
  }

  private setupTouchOptimizations(): void {
    // Improve touch responsiveness
    document.body.style.touchAction = 'manipulation';
    document.body.style.webkitTouchCallout = 'none';

    // Add touch target improvements
    const style = document.createElement('style');
    style.textContent = `
      button, [role="button"], .touch-target {
        min-height: 44px;
        min-width: 44px;
      }
    `;
    document.head.appendChild(style);
  }

  private setupPerformanceOptimizations(): void {
    // Enable hardware acceleration for smooth scrolling
    document.body.style.webkitOverflowScrolling = 'touch';
    document.body.style.overscrollBehavior = 'none';
  }

  detectDevice(): { isMobile: boolean; isIOS: boolean; isAndroid: boolean } {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isAndroid = /android/i.test(userAgent);

    return { isMobile, isIOS, isAndroid };
  }
}

export const MobileOptimizer = new MobileOptimizerClass();