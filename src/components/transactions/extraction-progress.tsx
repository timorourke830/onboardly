"use client";

import { FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExtractionProgressProps {
  isExtracting: boolean;
  documentsTotal: number;
  documentsProcessed: number;
  transactionsFound: number;
  errors: string[];
  onComplete?: () => void;
}

export function ExtractionProgress({
  isExtracting,
  documentsTotal,
  documentsProcessed,
  transactionsFound,
  errors,
}: ExtractionProgressProps) {
  const progress = documentsTotal > 0 ? (documentsProcessed / documentsTotal) * 100 : 0;
  const isComplete = !isExtracting && documentsProcessed === documentsTotal && documentsTotal > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        {isExtracting ? (
          <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
        ) : isComplete ? (
          <CheckCircle className="h-6 w-6 text-green-600" />
        ) : (
          <FileText className="h-6 w-6 text-gray-400" />
        )}
        <h3 className="text-lg font-medium text-gray-900">
          {isExtracting
            ? "Extracting Transactions..."
            : isComplete
              ? "Extraction Complete"
              : "Ready to Extract"}
        </h3>
      </div>

      {/* Progress bar */}
      {(isExtracting || isComplete) && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>
              {documentsProcessed} of {documentsTotal} documents processed
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isComplete ? "bg-green-500" : "bg-indigo-600"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{documentsTotal}</div>
          <div className="text-xs text-gray-500">Documents</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-indigo-600">{transactionsFound}</div>
          <div className="text-xs text-gray-500">Transactions Found</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div
            className={cn(
              "text-2xl font-bold",
              errors.length > 0 ? "text-red-600" : "text-green-600"
            )}
          >
            {errors.length}
          </div>
          <div className="text-xs text-gray-500">Errors</div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              {errors.length} error{errors.length !== 1 ? "s" : ""} occurred
            </span>
          </div>
          <ul className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
            {errors.map((error, index) => (
              <li key={index} className="truncate">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Status message */}
      {isExtracting && (
        <p className="text-sm text-gray-500 mt-2">
          This may take a few minutes depending on the number and size of documents...
        </p>
      )}

      {isComplete && transactionsFound > 0 && (
        <p className="text-sm text-green-700 mt-2">
          Successfully extracted {transactionsFound} transactions from {documentsProcessed} documents.
        </p>
      )}

      {isComplete && transactionsFound === 0 && (
        <p className="text-sm text-yellow-700 mt-2">
          No transactions were found in the processed documents.
        </p>
      )}
    </div>
  );
}
