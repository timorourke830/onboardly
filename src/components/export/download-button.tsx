"use client";

import { useState } from "react";
import { Download, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ExportFormat = "qbo" | "qbd" | "xero";

interface DownloadButtonProps {
  projectId: string;
  format: ExportFormat;
  label: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

const FORMAT_ENDPOINTS: Record<ExportFormat, string> = {
  qbo: "/api/export/qbo",
  qbd: "/api/export/qbd",
  xero: "/api/export/xero",
};

type DownloadState = "idle" | "loading" | "success" | "error";

export function DownloadButton({
  projectId,
  format,
  label,
  className,
  variant = "default",
  size = "default",
}: DownloadButtonProps) {
  const [state, setState] = useState<DownloadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setState("loading");
    setError(null);

    try {
      const endpoint = `${FORMAT_ENDPOINTS[format]}/${projectId}`;
      const response = await fetch(endpoint);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to download file");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `chart-of-accounts.${format === "qbd" ? "iif" : "csv"}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setState("success");

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setState("idle");
      }, 2000);
    } catch (err) {
      console.error("Download error:", err);
      setError(err instanceof Error ? err.message : "Download failed");
      setState("error");

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setState("idle");
        setError(null);
      }, 3000);
    }
  };

  const getButtonContent = () => {
    switch (state) {
      case "loading":
        return (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Downloading...</span>
          </>
        );
      case "success":
        return (
          <>
            <Check className="h-4 w-4" />
            <span>Downloaded!</span>
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="h-4 w-4" />
            <span>Failed</span>
          </>
        );
      default:
        return (
          <>
            <Download className="h-4 w-4" />
            <span>{label}</span>
          </>
        );
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={handleDownload}
        disabled={state === "loading"}
        variant={state === "error" ? "destructive" : variant}
        size={size}
        className={cn(
          "flex items-center gap-2 transition-all",
          state === "success" && "bg-green-600 hover:bg-green-700",
          className
        )}
      >
        {getButtonContent()}
      </Button>
      {error && state === "error" && (
        <p className="absolute top-full mt-1 text-xs text-red-600 whitespace-nowrap">
          {error}
        </p>
      )}
    </div>
  );
}
