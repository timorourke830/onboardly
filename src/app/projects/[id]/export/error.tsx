"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/ui/error-boundary";

export default function ExportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Export error:", error);
  }, [error]);

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Unable to load export page"
      description="We couldn't load the export options. Please try again or contact support if the problem persists."
    />
  );
}
