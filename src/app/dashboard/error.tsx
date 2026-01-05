"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/ui/error-boundary";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Unable to load dashboard"
      description="We couldn't load your dashboard. Please try again or contact support if the problem persists."
    />
  );
}
