
// Mobile optimization utilities for better user experience

export class MobileOptimizer {
  // Prevent zoom on input focus (iOS Safari)
  static preventZoomOnInput() {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      const content = meta.getAttribute('content');
      if (content && !content.includes('user-scalable=no')) {
        meta.setAttribute('content', content + ', user-scalable=no');
      }
    }
  }

  // Allow zoom back after input blur
  static allowZoomAfterInput() {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      const content = meta.getAttribute('content');
      if (content) {
        meta.setAttribute('content', content.replace(', user-scalable=no', ''));
      }
    }
  }

  // Handle safe area insets for devices with notches
  static setSafeAreaInsets() {
    const root = document.documentElement;
    
    // Check if device supports safe area insets
    if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
      root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
      root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
      root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left)');
      root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right)');
    } else {
      // Fallback values
      root.style.setProperty('--safe-area-top', '0px');
      root.style.setProperty('--safe-area-bottom', '0px');
      root.style.setProperty('--safe-area-left', '0px');
      root.style.setProperty('--safe-area-right', '0px');
    }
  }

  // Optimize touch interactions
  static optimizeTouchInteractions() {
    // Prevent 300ms click delay
    document.addEventListener('touchstart', () => {}, { passive: true });
    
    // Prevent pull-to-refresh on mobile
    document.body.style.overscrollBehavior = 'none';
    
    // Improve scrolling performance
    document.body.style.webkitOverflowScrolling = 'touch';
  }

  // Handle virtual keyboard
  static handleVirtualKeyboard() {
    let initialViewportHeight = window.innerHeight;
    
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      // Virtual keyboard is likely open if height decreased significantly
      if (heightDifference > 150) {
        document.body.classList.add('keyboard-open');
        document.documentElement.style.setProperty('--keyboard-height', `${heightDifference}px`);
      } else {
        document.body.classList.remove('keyboard-open');
        document.documentElement.style.setProperty('--keyboard-height', '0px');
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }
  }

  // Initialize all mobile optimizations
  static init() {
    this.setSafeAreaInsets();
    this.optimizeTouchInteractions();
    this.handleVirtualKeyboard();
  }
}

// Touch gesture utilities
export class TouchGestures {
  static addSwipeGesture(
    element: HTMLElement,
    onSwipeLeft?: () => void,
    onSwipeRight?: () => void,
    threshold = 50
  ) {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;

      // Check if it's a swipe (fast horizontal movement)
      if (
        Math.abs(deltaX) > threshold &&
        Math.abs(deltaY) < Math.abs(deltaX) / 2 &&
        deltaTime < 500
      ) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }
}
