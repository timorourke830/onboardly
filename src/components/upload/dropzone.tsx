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
    return <FileSpreadsheet className="h-8 w-8 text-emerald-500" />;
  }
  return <FileText className="h-8 w-8 text-slate-500" />;
}

export function Dropzone({ onFilesAdded, disabled = false, maxSize = MAX_FILE_SIZE }: DropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
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
        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all duration-200 cursor-pointer",
        isDragActive && !isDragReject && "border-teal-500 bg-teal-50/50",
        isDragReject && "border-red-500 bg-red-50/50",
        !isDragActive && !isDragReject && "border-slate-200 hover:border-teal-400 hover:bg-slate-50 bg-white",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />

      {isDragReject ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-100 mb-4">
            <AlertCircle className="h-7 w-7 text-red-600" />
          </div>
          <p className="text-base font-medium text-red-700">Invalid file type</p>
          <p className="mt-1 text-sm text-red-600">
            Only PDF, images (JPG, PNG), and spreadsheets (XLSX, CSV) are accepted
          </p>
        </>
      ) : isDragActive ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-100 mb-4">
            <Upload className="h-7 w-7 text-teal-600 animate-bounce" />
          </div>
          <p className="text-base font-medium text-teal-700">Drop files here</p>
        </>
      ) : (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 mb-4 group-hover:bg-teal-100 transition-colors">
            <Upload className="h-7 w-7 text-slate-500" />
          </div>
          <p className="text-base font-medium text-slate-700">
            Drag and drop files here
          </p>
          <p className="mt-1 text-sm text-slate-500">
            or click to browse from your computer
          </p>

          {/* File type badges */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-red-50 border border-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              PDF
            </span>
            <span className="inline-flex items-center rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
              <Image className="h-3.5 w-3.5 mr-1.5" />
              JPG/PNG
            </span>
            <span className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
              XLSX/CSV
            </span>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Maximum file size: 50MB
          </p>
        </>
      )}
    </div>
  );
}
