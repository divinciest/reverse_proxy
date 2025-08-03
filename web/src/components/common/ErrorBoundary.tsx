import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { State } from '@/types/shared';

interface Props {
  children: ReactNode;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Oops! Something went wrong.</AlertTitle>
            <AlertDescription>
              <p>The application encountered an unexpected error. This might be caused by an infinite loop or other issues.</p>
              <Button onClick={this.handleReload} variant="destructive" className="mt-4">
                Reload Page
              </Button>
              <details className="mt-4 p-2 bg-red-900/10 rounded-md">
                <summary className="cursor-pointer font-semibold">Error Details (Stack Trace)</summary>
                <pre className="mt-2 text-xs whitespace-pre-wrap break-words">
                  {this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
