"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Plus,
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Package,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportOptions } from "@/components/export";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface CoAData {
  id: string;
  industry: string;
  accounts: any[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectData {
  id: string;
  name: string;
  businessName: string;
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: string;
}

export default function ExportPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const projectId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [coa, setCoa] = useState<CoAData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Bundle export options
  const [includeCoA, setIncludeCoA] = useState(true);
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState<"qbo" | "qbd" | "xero">("qbo");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load project, CoA, and transactions in parallel
        const [projectRes, coaRes, transRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/coa/${projectId}`),
          fetch(`/api/extract-transactions?projectId=${projectId}`),
        ]);

        if (!projectRes.ok) {
          throw new Error("Project not found");
        }

        const projectData = await projectRes.json();
        setProject(projectData);

        if (coaRes.ok) {
          const coaData = await coaRes.json();
          setCoa(coaData);
        } else if (coaRes.status === 404) {
          setError("no-coa");
        } else {
          throw new Error("Failed to load Chart of Accounts");
        }

        // Load transactions
        if (transRes.ok) {
          const transData = await transRes.json();
          setTransactions(transData.transactions || []);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  // Handle bundle export
  const handleBundleExport = async () => {
    if (!includeCoA && !includeTransactions && !includeSummary) {
      addToast({
        title: "Nothing to Export",
        message: "Please select at least one item to export",
        variant: "error",
      });
      return;
    }

    setIsExporting(true);

    try {
      const response = await fetch("/api/export/bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          format: selectedFormat,
          includeCoA,
          includeTransactions: includeTransactions && transactions.length > 0,
          includeSummary: includeSummary && transactions.length > 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      const result = await response.json();

      // Download each file
      for (const file of result.files) {
        const blob = new Blob([file.content], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      addToast({
        title: "Export Complete",
        message: `Downloaded ${result.files.length} file(s)`,
        variant: "success",
      });
    } catch (err) {
      console.error("Export error:", err);
      addToast({
        title: "Export Failed",
        message: err instanceof Error ? err.message : "Failed to export",
        variant: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error === "no-coa") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/projects/${projectId}`}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Export Chart of Accounts
                </h1>
                {project && (
                  <p className="text-sm text-gray-500">{project.name}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No Chart of Accounts Found
                </h3>
                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                  You need to generate a Chart of Accounts before you can export
                  it. Go to the Chart of Accounts page to create one.
                </p>
                <div className="mt-6">
                  <Button onClick={() => router.push(`/projects/${projectId}/coa`)}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Generate Chart of Accounts
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Error</h3>
              <p className="mt-2 text-sm text-gray-500">{error}</p>
              <div className="mt-6">
                <Button onClick={() => router.push("/dashboard")}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const accountCount = coa?.accounts?.length || 0;
  const transactionCount = transactions.length;
  const totalDebits = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalCredits = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${projectId}`}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Export Data
              </h1>
              {project && (
                <p className="text-sm text-gray-500">{project.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* CoA Summary */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <FileSpreadsheet className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    Chart of Accounts
                  </h3>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">
                      {accountCount} accounts
                    </span>
                    {coa?.industry && (
                      <span className="ml-1 text-xs">
                        ({coa.industry.replace("-", " ")})
                      </span>
                    )}
                  </p>
                </div>
                <Link href={`/projects/${projectId}/coa`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Summary */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full",
                  transactionCount > 0 ? "bg-indigo-100" : "bg-gray-100"
                )}>
                  <DollarSign className={cn(
                    "h-6 w-6",
                    transactionCount > 0 ? "text-indigo-600" : "text-gray-400"
                  )} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    Transactions
                  </h3>
                  {transactionCount > 0 ? (
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-900">
                        {transactionCount} transactions
                      </span>
                      <span className="ml-2 text-xs">
                        ({totalCredits.toLocaleString("en-US", { style: "currency", currency: "USD" })} in / {totalDebits.toLocaleString("en-US", { style: "currency", currency: "USD" })} out)
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No transactions extracted yet
                    </p>
                  )}
                </div>
                <Link href={`/projects/${projectId}/transactions`}>
                  <Button variant="outline" size="sm">
                    {transactionCount > 0 ? "View" : "Extract"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bundle Export */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-600" />
              Bundle Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Select what to include in your export and choose a format:
            </p>

            {/* Export Options Checkboxes */}
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                    includeCoA
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-gray-300"
                  )}
                  onClick={() => setIncludeCoA(!includeCoA)}
                >
                  {includeCoA && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    Chart of Accounts
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({accountCount} accounts)
                  </span>
                </div>
              </label>

              <label className={cn(
                "flex items-center gap-3",
                transactionCount > 0 ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
              )}>
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                    includeTransactions && transactionCount > 0
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-gray-300"
                  )}
                  onClick={() => transactionCount > 0 && setIncludeTransactions(!includeTransactions)}
                >
                  {includeTransactions && transactionCount > 0 && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    Transactions
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({transactionCount} transactions)
                  </span>
                </div>
              </label>

              <label className={cn(
                "flex items-center gap-3",
                transactionCount > 0 ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
              )}>
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                    includeSummary && transactionCount > 0
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-gray-300"
                  )}
                  onClick={() => transactionCount > 0 && setIncludeSummary(!includeSummary)}
                >
                  {includeSummary && transactionCount > 0 && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    Account Summary
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    (totals by account)
                  </span>
                </div>
              </label>
            </div>

            {/* Format Selection */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Export Format:</p>
              <div className="flex gap-2">
                {(["qbo", "qbd", "xero"] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className={cn(
                      "px-4 py-2 text-sm rounded-lg border transition-colors",
                      selectedFormat === format
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-indigo-300"
                    )}
                  >
                    {format === "qbo" && "QuickBooks Online"}
                    {format === "qbd" && "QuickBooks Desktop"}
                    {format === "xero" && "Xero"}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleBundleExport}
              disabled={isExporting || (!includeCoA && !includeTransactions && !includeSummary)}
              isLoading={isExporting}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Download Bundle"}
            </Button>
          </CardContent>
        </Card>

        {/* Individual Export Options */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Individual Exports
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Or download just the Chart of Accounts in your preferred format:
          </p>
          <ExportOptions projectId={projectId} />
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="inline h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
            <Button onClick={() => router.push("/projects/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Start New Project
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
