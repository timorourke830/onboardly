"use client";

import { cn } from "@/lib/utils";

export type ProjectStatus = "uploading" | "classifying" | "reviewing" | "complete";

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; bgColor: string; textColor: string; borderColor: string; dotColor: string }
> = {
  uploading: {
    label: "Uploading",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    dotColor: "bg-blue-500",
  },
  classifying: {
    label: "Classifying",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
    dotColor: "bg-amber-500",
  },
  reviewing: {
    label: "Reviewing",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
    dotColor: "bg-purple-500",
  },
  complete: {
    label: "Complete",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    dotColor: "bg-emerald-500",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.uploading;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border",
        config.bgColor,
        config.textColor,
        config.borderColor,
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
