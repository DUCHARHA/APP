// Global error handler for catching JavaScript errors and unhandled promise rejections

interface ErrorReport {
  message: string;
  stack?: string;
  type: 'js_error' | 'network_error' | 'promise_rejection';
  source: 'frontend';
  url: string;
  userAgent: string;
  level: 'error' | 'warning';
  metadata?: string;
}

class GlobalErrorHandler {
  private reportQueue: ErrorReport[] = [];
  private isReporting = false;
  private lastReportTime = 0;
  private reportThrottle = 5000; // 5 seconds between reports
  private maxQueueSize = 10;

  constructor() {
    this.setupErrorHandlers();
  }

  private setupErrorHandlers() {
    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        message: event.message || 'JavaScript Error',
        filename: event.filename || '',
        line: event.lineno || 0,
        column: event.colno || 0,
        error: event.error,
        type: 'js_error'
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handlePromiseRejection(event);
    });

    // Handle network errors (optional - for fetch failures)
    this.interceptFetch();
  }

  private handleError(errorDetails: {
    message: string;
    filename?: string;
    line?: number;
    column?: number;
    error?: Error;
    type: 'js_error';
  }) {
    const { message, filename, line, column, error, type } = errorDetails;

    // Skip reporting certain non-critical errors
    if (this.shouldSkipError(message)) {
      return;
    }

    const errorReport: ErrorReport = {
      message: `${message} at ${filename}:${line}:${column}`,
      stack: error?.stack || null,
      type,
      source: 'frontend',
      url: window.location.href,
      userAgent: navigator.userAgent,
      level: this.getErrorLevel(message),
      metadata: JSON.stringify({
        filename,
        line,
        column,
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        userInteraction: document.activeElement?.tagName || 'unknown'
      })
    };

    this.queueError(errorReport);
  }

  private handlePromiseRejection(event: PromiseRejectionEvent) {
    const reason = event.reason;
    let message = 'Unhandled Promise Rejection';
    let stack = null;

    if (reason instanceof Error) {
      message = reason.message || message;
      stack = reason.stack;
    } else if (typeof reason === 'string') {
      message = reason;
    } else {
      message = 'Unknown promise rejection: ' + String(reason);
    }

    // Skip reporting certain non-critical promise rejections
    if (this.shouldSkipError(message)) {
      return;
    }

    const errorReport: ErrorReport = {
      message,
      stack,
      type: 'promise_rejection',
      source: 'frontend',
      url: window.location.href,
      userAgent: navigator.userAgent,
      level: 'error',
      metadata: JSON.stringify({
        reason: typeof reason === 'object' ? JSON.stringify(reason) : String(reason),
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      })
    };

    this.queueError(errorReport);
  }

  private interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Report network errors (5xx status codes)
        if (response.status >= 500) {
          const url = args[0] instanceof Request ? args[0].url : String(args[0]);
          this.reportNetworkError(url, response.status, response.statusText);
        }
        
        return response;
      } catch (error) {
        // Report network failures
        const url = args[0] instanceof Request ? args[0].url : String(args[0]);
        this.reportNetworkError(url, 0, error instanceof Error ? error.message : 'Network Error');
        throw error;
      }
    };
  }

  private reportNetworkError(url: string, status: number, statusText: string) {
    // Skip reporting errors for our own error reporting endpoint to avoid loops
    if (url.includes('/api/errors')) {
      return;
    }

    const errorReport: ErrorReport = {
      message: `Network Error: ${status} ${statusText} at ${url}`,
      type: 'network_error',
      source: 'frontend',
      url: window.location.href,
      userAgent: navigator.userAgent,
      level: status >= 500 ? 'error' : 'warning',
      metadata: JSON.stringify({
        requestUrl: url,
        status,
        statusText,
        timestamp: new Date().toISOString()
      })
    };

    this.queueError(errorReport);
  }

  private shouldSkipError(message: string): boolean {
    const skipPatterns = [
      // Common non-critical errors to skip
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',
      'Script error.',
      'Network request failed', // Too generic
      'Loading chunk', // Webpack chunk loading errors
      'Extension context invalidated', // Browser extension errors
      'chrome-extension://', // Browser extension URLs
      'moz-extension://', // Firefox extension URLs
    ];

    return skipPatterns.some(pattern => message.includes(pattern));
  }

  private getErrorLevel(message: string): 'error' | 'warning' {
    const warningPatterns = [
      'Warning:',
      'deprecated',
      'experimental',
    ];

    return warningPatterns.some(pattern => message.toLowerCase().includes(pattern.toLowerCase())) 
      ? 'warning' 
      : 'error';
  }

  private queueError(errorReport: ErrorReport) {
    // Avoid duplicate errors
    const isDuplicate = this.reportQueue.some(report => 
      report.message === errorReport.message && 
      report.type === errorReport.type
    );

    if (isDuplicate) {
      return;
    }

    // Add to queue
    this.reportQueue.push(errorReport);

    // Limit queue size
    if (this.reportQueue.length > this.maxQueueSize) {
      this.reportQueue.shift(); // Remove oldest error
    }

    // Try to send errors if we're not already reporting and throttle time has passed
    const now = Date.now();
    if (!this.isReporting && now - this.lastReportTime > this.reportThrottle) {
      this.sendQueuedErrors();
    }
  }

  private async sendQueuedErrors() {
    if (this.reportQueue.length === 0 || this.isReporting) {
      return;
    }

    this.isReporting = true;
    this.lastReportTime = Date.now();

    const errorsToSend = [...this.reportQueue];
    this.reportQueue = [];

    try {
      // Send errors in batch or one by one
      for (const error of errorsToSend) {
        await this.sendErrorToServer(error);
      }
    } catch (reportError) {
      // If reporting fails, re-add errors to queue (up to limit)
      this.reportQueue = [...errorsToSend.slice(-this.maxQueueSize), ...this.reportQueue];
      console.warn('Failed to report errors:', reportError);
    } finally {
      this.isReporting = false;
    }
  }

  private async sendErrorToServer(errorReport: ErrorReport): Promise<void> {
    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (error) {
      // In production, we might want to store errors locally and retry later
      if (import.meta.env.DEV) {
        console.warn('Failed to send error report:', error);
      }
      throw error;
    }
  }

  // Method to manually report errors
  public reportError(error: Error, context?: string) {
    const errorReport: ErrorReport = {
      message: context ? `${context}: ${error.message}` : error.message,
      stack: error.stack,
      type: 'js_error',
      source: 'frontend',
      url: window.location.href,
      userAgent: navigator.userAgent,
      level: 'error',
      metadata: JSON.stringify({
        context,
        timestamp: new Date().toISOString(),
        manual: true
      })
    };

    this.queueError(errorReport);
  }

  // Method to force send queued errors (useful for page unload)
  public async flushErrors(): Promise<void> {
    if (this.reportQueue.length > 0) {
      await this.sendQueuedErrors();
    }
  }
}

// Create global instance
let globalErrorHandler: GlobalErrorHandler | null = null;

export function initializeGlobalErrorHandler(): GlobalErrorHandler {
  if (!globalErrorHandler) {
    globalErrorHandler = new GlobalErrorHandler();
    
    // Flush errors before page unload
    window.addEventListener('beforeunload', () => {
      globalErrorHandler?.flushErrors();
    });
  }
  
  return globalErrorHandler;
}

export function reportError(error: Error, context?: string): void {
  globalErrorHandler?.reportError(error, context);
}

export { GlobalErrorHandler };