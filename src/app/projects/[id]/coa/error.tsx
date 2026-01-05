"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/ui/error-boundary";

export default function CoaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Chart of Accounts error:", error);
  }, [error]);

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Unable to load Chart of Accounts"
      description="We couldn't load the Chart of Accounts. Please try again or contact support if the problem persists."
    />
  );
}
