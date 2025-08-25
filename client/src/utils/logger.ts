/**
 * Secure logger utility that respects production environment restrictions
 * Only console.error and console.warn work in production for security
 */

type LogLevel = 'log' | 'info' | 'debug' | 'warn' | 'error';

class SecureLogger {
  private isProduction = import.meta.env.PROD;

  /**
   * Log information - disabled in production
   */
  log(...args: any[]): void {
    if (!this.isProduction) {
      console.log(...args);
    }
  }

  /**
   * Log debug information - disabled in production
   */
  debug(...args: any[]): void {
    if (!this.isProduction) {
      console.debug(...args);
    }
  }

  /**
   * Log informational messages - disabled in production
   */
  info(...args: any[]): void {
    if (!this.isProduction) {
      console.info(...args);
    }
  }

  /**
   * Log warnings - always enabled
   */
  warn(...args: any[]): void {
    console.warn(...args);
  }

  /**
   * Log errors - always enabled
   */
  error(...args: any[]): void {
    console.error(...args);
  }

  /**
   * Create a scoped logger with a prefix
   */
  scope(prefix: string) {
    return {
      log: (...args: any[]) => this.log(`[${prefix}]`, ...args),
      debug: (...args: any[]) => this.debug(`[${prefix}]`, ...args),
      info: (...args: any[]) => this.info(`[${prefix}]`, ...args),
      warn: (...args: any[]) => this.warn(`[${prefix}]`, ...args),
      error: (...args: any[]) => this.error(`[${prefix}]`, ...args),
    };
  }

  /**
   * Test function to verify production log suppression
   */
  testProductionSafety(): void {
    const testMessage = 'SECURITY_TEST_MESSAGE';
    
    this.log('Test log:', testMessage);
    this.info('Test info:', testMessage);
    this.debug('Test debug:', testMessage);
    
    if (this.isProduction) {
      // These should not appear in production console
      console.log('If you see this in production, console.log is not disabled!');
      console.info('If you see this in production, console.info is not disabled!');
      console.debug('If you see this in production, console.debug is not disabled!');
    }
    
    // These should always appear
    this.warn('Production safety test: WARN messages work ✓');
    this.error('Production safety test: ERROR messages work ✓');
  }
}

export const logger = new SecureLogger();

// Test logging protection on app start (development only)
if (!import.meta.env.PROD) {
  logger.testProductionSafety();
}