"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/ui/error-boundary";

export default function UploadError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Upload error:", error);
  }, [error]);

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Unable to load upload page"
      description="We couldn't load the document upload page. Please try again or contact support if the problem persists."
    />
  );
}
