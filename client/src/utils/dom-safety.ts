// DOM safety utilities to prevent removeChild errors

export function safeRemoveChild(parent: Element | null, child: Element | null): boolean {
  if (!parent || !child) {
    return false;
  }
  
  try {
    // Double-check the child is actually a child of the parent
    if (parent.contains(child) && child.parentNode === parent) {
      parent.removeChild(child);
      return true;
    }
  } catch (error) {
    console.warn('Safe removal failed, element may have been removed already:', error);
  }
  
  return false;
}

export function safeAppendChild(parent: Element | null, child: Element | null): boolean {
  if (!parent || !child) {
    return false;
  }
  
  try {
    // Make sure the child isn't already appended
    if (!parent.contains(child)) {
      parent.appendChild(child);
      return true;
    }
  } catch (error) {
    console.warn('Safe append failed:', error);
  }
  
  return false;
}

export function safeQuerySelector(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch (error) {
    console.warn('Safe query selector failed:', selector, error);
    return null;
  }
}

// Utility to prevent multiple cleanup attempts
export class CleanupTracker {
  private cleanedUp = false;
  
  cleanup(fn: () => void): void {
    if (!this.cleanedUp) {
      this.cleanedUp = true;
      try {
        fn();
      } catch (error) {
        console.warn('Cleanup function failed:', error);
      }
    }
  }
  
  isCleanedUp(): boolean {
    return this.cleanedUp;
  }
}