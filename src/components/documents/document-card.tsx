"use client";

import { FileText, Image, FileSpreadsheet, ExternalLink } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { CategoryBadge } from "./category-badge";
import type { DocumentCategory } from "@/types/document";

interface DocumentCardProps {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  confidence: number;
  year?: number | null;
  isReviewed?: boolean;
  onClick?: () => void;
}

function getFileIcon(fileType: string) {
  if (fileType === "application/pdf") {
    return <FileText className="h-8 w-8 text-red-500" />;
  }
  if (fileType.startsWith("image/")) {
    return <Image className="h-8 w-8 text-blue-500" />;
  }
  if (
    fileType.includes("spreadsheet") ||
    fileType.includes("excel") ||
    fileType === "text/csv"
  ) {
    return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
  }
  return <FileText className="h-8 w-8 text-gray-500" />;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "text-green-600";
  if (confidence >= 0.5) return "text-yellow-600";
  return "text-red-600";
}

export function DocumentCard({
  fileName,
  fileUrl,
  fileType,
  fileSize,
  category,
  confidence,
  year,
  isReviewed,
  onClick,
}: DocumentCardProps) {
  const isImage = fileType.startsWith("image/");

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:border-blue-300"
      )}
      onClick={onClick}
    >
      {/* Thumbnail/Icon */}
      <div className="relative mb-3 flex h-24 items-center justify-center rounded-md bg-gray-50">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl}
            alt={fileName}
            className="h-full w-full object-cover rounded-md"
          />
        ) : (
          getFileIcon(fileType)
        )}

        {/* Review indicator */}
        {isReviewed && (
          <div className="absolute top-1 right-1 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate" title={fileName}>
          {fileName}
        </h3>
        <p className="text-xs text-gray-500 mt-1">{formatFileSize(fileSize)}</p>
      </div>

      {/* Category and confidence */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <CategoryBadge category={category} size="sm" />
        <div className="flex items-center gap-2">
          {year && (
            <span className="text-xs text-gray-500">{year}</span>
          )}
          <span
            className={cn("text-xs font-medium", getConfidenceColor(confidence))}
            title={`Confidence: ${Math.round(confidence * 100)}%`}
          >
            {Math.round(confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Hover action */}
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-gray-700 transition-opacity"
        title="Open in new tab"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
