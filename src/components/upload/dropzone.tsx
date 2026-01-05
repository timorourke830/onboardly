"use client";

import { useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { Upload, FileText, Image, FileSpreadsheet, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  documentId?: string;
  url?: string;
}

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
  maxSize?: number;
}

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "text/csv": [".csv"],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function getFileIcon(file: File) {
  const type = file.type;

  if (type === "application/pdf") {
    return <FileText className="h-8 w-8 text-red-500" />;
  }
  if (type.startsWith("image/")) {
    return <Image className="h-8 w-8 text-blue-500" />;
  }
  if (type.includes("spreadsheet") || type.includes("excel") || type === "text/csv") {
    return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
  }
  return <FileText className="h-8 w-8 text-gray-500" />;
}

export function Dropzone({ onFilesAdded, disabled = false, maxSize = MAX_FILE_SIZE }: DropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        // Handle rejected files - could show toast notification
        console.warn("Rejected files:", rejectedFiles);
      }
      if (acceptedFiles.length > 0) {
        onFilesAdded(acceptedFiles);
      }
    },
    [onFilesAdded]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize,
    disabled,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
        isDragActive && !isDragReject && "border-blue-500 bg-blue-50",
        isDragReject && "border-red-500 bg-red-50",
        !isDragActive && !isDragReject && "border-gray-300 hover:border-gray-400 bg-gray-50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />

      {isDragReject ? (
        <>
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg font-medium text-red-700">Invalid file type</p>
          <p className="mt-1 text-sm text-red-600">
            Only PDF, images (JPG, PNG), and spreadsheets (XLSX, CSV) are accepted
          </p>
        </>
      ) : isDragActive ? (
        <>
          <Upload className="h-12 w-12 text-blue-500 mb-4 animate-bounce" />
          <p className="text-lg font-medium text-blue-700">Drop files here</p>
        </>
      ) : (
        <>
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700">
            Drag and drop files here
          </p>
          <p className="mt-1 text-sm text-gray-500">
            or click to browse
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
              PDF
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              JPG/PNG
            </span>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              XLSX/CSV
            </span>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Maximum file size: 50MB
          </p>
        </>
      )}
    </div>
  );
}
