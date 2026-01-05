"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/ui/error-boundary";

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Projects error:", error);
  }, [error]);

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Unable to load projects"
      description="We couldn't load your projects. Please try again or contact support if the problem persists."
    />
  );
}
