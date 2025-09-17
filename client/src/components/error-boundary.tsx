import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Send, Copy, CheckCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isReporting: boolean;
  reportStatus: 'idle' | 'success' | 'error';
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isReporting: false,
    reportStatus: 'idle',
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.warn("Error caught by ErrorBoundary:", error, errorInfo);
    }
    
    this.setState({
      error,
      errorInfo,
    });

    // Automatically send error to server in production
    if (import.meta.env.PROD) {
      this.sendErrorToServer(error, errorInfo);
    }
  }

  private sendErrorToServer = async (error?: Error, errorInfo?: ErrorInfo) => {
    const errorToReport = error || this.state.error;
    const errorInfoToReport = errorInfo || this.state.errorInfo;
    
    if (!errorToReport) return;

    this.setState({ isReporting: true, reportStatus: 'idle' });

    try {
      const errorData = {
        message: errorToReport.message,
        stack: errorToReport.stack || null,
        type: 'boundary_error',
        source: 'frontend',
        url: window.location.href,
        userAgent: navigator.userAgent,
        level: 'error',
        metadata: JSON.stringify({
          componentStack: errorInfoToReport?.componentStack || null,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        })
      };

      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });

      if (response.ok) {
        this.setState({ reportStatus: 'success' });
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (err) {
      console.error('Failed to report error to server:', err);
      this.setState({ reportStatus: 'error' });
    } finally {
      this.setState({ isReporting: false });
    }
  };

  private copyToClipboard = async () => {
    if (!this.state.error) return;

    const errorDetails = {
      message: this.state.error.message,
      stack: this.state.error.stack,
      componentStack: this.state.errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    const errorText = JSON.stringify(errorDetails, null, 2);

    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = errorText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isReporting: false,
      reportStatus: 'idle',
      copied: false,
    });
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Что-то пошло не так
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Произошла непредвиденная ошибка. Пожалуйста, попробуйте обновить страницу.
            </p>

            {process.env.NODE_ENV === "development" && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  Техническая информация
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            {/* Error Reporting Status */}
            {this.state.reportStatus === 'success' && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Ошибка отправлена разработчикам</span>
              </div>
            )}

            {this.state.reportStatus === 'error' && (
              <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Не удалось отправить отчет об ошибке</span>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {/* Primary Actions */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={this.resetError}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  Попробовать снова
                </Button>
                
                <Button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Обновить страницу
                </Button>
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => this.sendErrorToServer()}
                  disabled={this.state.isReporting || this.state.reportStatus === 'success'}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {this.state.isReporting ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : this.state.reportStatus === 'success' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {this.state.isReporting 
                    ? 'Отправка...' 
                    : this.state.reportStatus === 'success' 
                      ? 'Отправлено' 
                      : 'Сообщить об ошибке'
                  }
                </Button>

                <Button
                  onClick={this.copyToClipboard}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {this.state.copied ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {this.state.copied ? 'Скопировано' : 'Копировать детали'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for using error boundary in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}