"use client";

import * as React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "./button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          reset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error | null;
  reset?: () => void;
  title?: string;
  description?: string;
}

export function ErrorFallback({
  error,
  reset,
  title = "Something went wrong",
  description = "We encountered an unexpected error. Please try again.",
}: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="mt-6 text-xl font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-center text-sm text-gray-500 max-w-md">
        {description}
      </p>
      {error && process.env.NODE_ENV === "development" && (
        <pre className="mt-4 max-w-full overflow-auto rounded-lg bg-gray-100 p-4 text-xs text-gray-700">
          {error.message}
        </pre>
      )}
      <div className="mt-6 flex gap-3">
        {reset && (
          <Button onClick={reset} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
        <Button onClick={() => (window.location.href = "/dashboard")}>
          <Home className="mr-2 h-4 w-4" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((err: unknown) => {
    if (err instanceof Error) {
      setError(err);
    } else {
      setError(new Error(String(err)));
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}
