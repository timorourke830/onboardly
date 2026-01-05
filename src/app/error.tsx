"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-gray-500 max-w-md mx-auto">
          We encountered an unexpected error. Our team has been notified and is
          working on a fix.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <pre className="mt-4 max-w-lg mx-auto overflow-auto rounded-lg bg-gray-100 p-4 text-left text-xs text-gray-700">
            {error.message}
          </pre>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={() => (window.location.href = "/dashboard")}>
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
