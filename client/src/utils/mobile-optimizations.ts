
export class MobileOptimizer {
  private static instance: MobileOptimizer | null = null;
  private isInitialized = false;

  static getInstance(): MobileOptimizer {
    if (!MobileOptimizer.instance) {
      MobileOptimizer.instance = new MobileOptimizer();
    }
    return MobileOptimizer.instance;
  }

  static init(): void {
    const optimizer = MobileOptimizer.getInstance();
    optimizer.initialize();
  }

  private initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    try {
      // Setup viewport meta tag
      this.setupViewport();
      
      // Setup safe area variables
      this.setupSafeAreaVariables();
      
      // Setup touch optimizations
      this.setupTouchOptimizations();
      
      // Setup keyboard handling
      this.setupKeyboardHandling();

      this.isInitialized = true;
      console.log('✅ Mobile optimizations initialized');
    } catch (error) {
      console.warn('Failed to initialize mobile optimizations:', error);
    }
  }

  private setupViewport(): void {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  }

  private setupSafeAreaVariables(): void {
    const root = document.documentElement;
    root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top, 0px)');
    root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
    root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left, 0px)');
    root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right, 0px)');
  }

  private setupTouchOptimizations(): void {
    // Disable default touch behaviors
    document.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
  }

  private setupKeyboardHandling(): void {
    if (this.isMobileDevice()) {
      window.addEventListener('resize', this.handleResize);
      
      // Handle virtual keyboard
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.addEventListener('focus', this.handleInputFocus);
        input.addEventListener('blur', this.handleInputBlur);
      });
    }
  }

  private handleTouchStart = (e: TouchEvent): void => {
    // Allow normal touch behavior
  };

  private handleTouchMove = (e: TouchEvent): void => {
    // Prevent overscroll on body
    if ((e.target as Element)?.closest('body') && !(e.target as Element)?.closest('.mobile-scroll')) {
      e.preventDefault();
    }
  };

  private handleResize = (): void => {
    const visualViewport = (window as any).visualViewport;
    if (visualViewport) {
      const keyboardHeight = window.innerHeight - visualViewport.height;
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    }
  };

  private handleInputFocus = (): void => {
    document.body.classList.add('keyboard-open');
  };

  private handleInputBlur = (): void => {
    document.body.classList.remove('keyboard-open');
  };

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}

// Export static methods for easier usage
export const initMobileOptimizations = () => MobileOptimizer.init();
export default MobileOptimizer;
