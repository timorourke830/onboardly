import * as React from "react";
import { LucideIcon, FolderOpen, FileText, Upload, Search, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8" : "py-16",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-gray-100",
          compact ? "h-12 w-12" : "h-16 w-16"
        )}
      >
        <Icon
          className={cn(
            "text-gray-400",
            compact ? "h-6 w-6" : "h-8 w-8"
          )}
        />
      </div>
      <h3
        className={cn(
          "font-semibold text-gray-900",
          compact ? "mt-3 text-base" : "mt-4 text-lg"
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-gray-500 max-w-sm",
            compact ? "mt-1 text-sm" : "mt-2 text-sm"
          )}
        >
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className={cn("flex gap-3", compact ? "mt-4" : "mt-6")}>
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Preset empty states for common scenarios
export function NoProjectsEmptyState({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No projects yet"
      description="Create your first project to start organizing client documents and generating a Chart of Accounts."
      action={{
        label: "Create Your First Project",
        onClick: onCreateProject,
      }}
    />
  );
}

export function NoDocumentsEmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No documents uploaded"
      description="Upload bank statements, invoices, receipts, and other financial documents to get started."
      action={{
        label: "Upload Documents",
        onClick: onUpload,
      }}
    />
  );
}

export function NoAccountsEmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <EmptyState
      icon={Database}
      title="No Chart of Accounts"
      description="Generate a Chart of Accounts based on your uploaded documents."
      action={{
        label: "Generate Chart of Accounts",
        onClick: onGenerate,
      }}
    />
  );
}

export function NoSearchResultsEmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No matching results"
      description="Try adjusting your search or filter criteria."
      action={{
        label: "Clear Filters",
        onClick: onClearFilters,
      }}
    />
  );
}

export function UploadPromptEmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      icon={Upload}
      title="Ready to upload"
      description="Drag and drop your files here, or click to browse."
      action={{
        label: "Browse Files",
        onClick: onUpload,
      }}
    />
  );
}
