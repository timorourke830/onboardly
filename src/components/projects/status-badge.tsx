"use client";

import { cn } from "@/lib/utils";

export type ProjectStatus = "uploading" | "classifying" | "reviewing" | "complete";

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; bgColor: string; textColor: string; dotColor: string }
> = {
  uploading: {
    label: "Uploading",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    dotColor: "bg-blue-500",
  },
  classifying: {
    label: "Classifying",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    dotColor: "bg-yellow-500",
  },
  reviewing: {
    label: "Reviewing",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    dotColor: "bg-orange-500",
  },
  complete: {
    label: "Complete",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    dotColor: "bg-green-500",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.uploading;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
      {config.label}
    </span>
  );
}

export function getStatusLabel(status: ProjectStatus): string {
  return STATUS_CONFIG[status]?.label || status;
}
