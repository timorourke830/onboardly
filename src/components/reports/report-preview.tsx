"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  FileQuestion,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { OnboardingReport } from "@/types/report";

interface ReportPreviewProps {
  report: OnboardingReport;
  projectId: string;
  onDownload?: () => void;
}

export function ReportPreview({ report, projectId, onDownload }: ReportPreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(
        `/api/reports/onboarding?projectId=${projectId}&format=pdf`
      );

      if (!response.ok) {
        throw new Error("Failed to download report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.clientInfo.businessName.replace(/[^a-zA-Z0-9]/g, "_")}_Onboarding_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onDownload?.();
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Status colors and icons
  const statusConfig = {
    incomplete: {
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      icon: AlertCircle,
      label: "Incomplete",
    },
    "needs-review": {
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      icon: AlertTriangle,
      label: "Needs Review",
    },
    ready: {
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      icon: CheckCircle,
      label: "Ready",
    },
  };

  const status = statusConfig[report.status];
  const StatusIcon = status.icon;

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  return (
    <div className="space-y-6">
      {/* Header with Score */}
      <Card className={cn("border-2", status.borderColor)}>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Completeness Score Circle */}
              <div className="relative">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={
                      report.overallCompletenessScore >= 80
                        ? "#10B981"
                        : report.overallCompletenessScore >= 50
                          ? "#F59E0B"
                          : "#EF4444"
                    }
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - report.overallCompletenessScore / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {report.overallCompletenessScore}%
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn("h-5 w-5", status.color)} />
                  <span className={cn("text-sm font-medium", status.color)}>
                    {status.label}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mt-1">
                  {report.clientInfo.businessName}
                </h2>
                <p className="text-sm text-gray-500">
                  {report.clientInfo.industry.replace("-", " ")} • {report.clientInfo.projectName}
                </p>
              </div>
            </div>

            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              isLoading={isDownloading}
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Generating..." : "Download Full Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {report.documentCoverage.totalDocuments}
                </p>
                <p className="text-sm text-gray-500">Documents Received</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                <DollarSign className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {report.transactionSummary.totalTransactions}
                </p>
                <p className="text-sm text-gray-500">Transactions Extracted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {report.chartOfAccounts.totalAccounts}
                </p>
                <p className="text-sm text-gray-500">Accounts Set Up</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missing Documents Alert */}
      {report.documentCoverage.documentsMissing.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
              <FileQuestion className="h-5 w-5" />
              Missing Documents ({report.documentCoverage.documentsMissing.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.documentCoverage.documentsMissing.slice(0, 5).map((missing, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                      missing.priority === "high"
                        ? "bg-red-100 text-red-700"
                        : missing.priority === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                    )}
                  >
                    {missing.priority}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{missing.label}</p>
                    {missing.missingMonths && missing.missingMonths.length > 0 && (
                      <p className="text-xs text-gray-600">
                        Missing: {missing.missingMonths.slice(0, 4).join(", ")}
                        {missing.missingMonths.length > 4 && ` +${missing.missingMonths.length - 4} more`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      {report.transactionSummary.totalTransactions > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Income</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(report.transactionSummary.totalIncome)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrency(report.transactionSummary.totalExpenses)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Net Amount</p>
                <p
                  className={cn(
                    "text-lg font-semibold",
                    report.transactionSummary.netAmount >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  )}
                >
                  {formatCurrency(report.transactionSummary.netAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Transaction</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(report.transactionSummary.averageTransactionSize)}
                </p>
              </div>
            </div>

            {/* Top Vendors */}
            {report.transactionSummary.topVendors.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Top Vendors</h4>
                <div className="space-y-2">
                  {report.transactionSummary.topVendors.slice(0, 5).map((vendor, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{vendor.vendor}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400">
                          {vendor.transactionCount} txn
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(vendor.totalAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-indigo-600" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.recommendations.slice(0, 5).map((rec, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border",
                    rec.priority === "high"
                      ? "border-red-200 bg-red-50"
                      : rec.priority === "medium"
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-gray-200 bg-gray-50"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                        rec.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : rec.priority === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {rec.priority}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{rec.description}</p>
                      {rec.actionItem && (
                        <p className="text-sm text-indigo-600 mt-1 flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          {rec.actionItem}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
