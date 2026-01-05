"use client";

import { X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { ProgressBar } from "./progress-bar";
import { getFileIcon, type UploadFile } from "./dropzone";

interface FileListProps {
  files: UploadFile[];
  onRemove: (id: string) => void;
}

export function FileList({ files, onRemove }: FileListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">
        Files ({files.length})
      </h3>
      <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
        {files.map((uploadFile) => (
          <FileItem
            key={uploadFile.id}
            uploadFile={uploadFile}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </div>
  );
}

interface FileItemProps {
  uploadFile: UploadFile;
  onRemove: (id: string) => void;
}

function FileItem({ uploadFile, onRemove }: FileItemProps) {
  const { id, file, status, progress, error } = uploadFile;

  const canRemove = status !== "uploading";

  return (
    <li className="flex items-center gap-4 p-4">
      {/* File icon */}
      <div className="flex-shrink-0">{getFileIcon(file)}</div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </p>
          {status === "success" && (
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
          )}
          {status === "error" && (
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          )}
          {status === "uploading" && (
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          {status === "uploading" && (
            <span className="text-xs text-blue-600">Uploading...</span>
          )}
          {status === "success" && (
            <span className="text-xs text-green-600">Uploaded</span>
          )}
          {status === "error" && (
            <span className="text-xs text-red-600">{error || "Failed"}</span>
          )}
          {status === "pending" && (
            <span className="text-xs text-gray-400">Pending</span>
          )}
        </div>

        {/* Progress bar for uploading files */}
        {status === "uploading" && (
          <div className="mt-2">
            <ProgressBar progress={progress} size="sm" />
          </div>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(id)}
        disabled={!canRemove}
        className={cn(
          "flex-shrink-0 p-1 rounded-full transition-colors",
          canRemove
            ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            : "text-gray-200 cursor-not-allowed"
        )}
        aria-label={`Remove ${file.name}`}
      >
        <X className="h-5 w-5" />
      </button>
    </li>
  );
}
