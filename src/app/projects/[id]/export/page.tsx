"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download,
  FileSpreadsheet,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowNav } from "@/components/workflow";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface ProjectData {
  id: string;
  name: string;
  businessName: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  suggestedAccountNumber?: string;
  suggestedAccountName?: string;
}

export default function ExportPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const projectId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Export options
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load project and transactions in parallel
        const [projectRes, transRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/extract-transactions?projectId=${projectId}`),
        ]);

        if (!projectRes.ok) {
          throw new Error("Project not found");
        }

        const projectData = await projectRes.json();
        setProject(projectData);

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

  // Handle transaction export
  const handleExport = async (format: "csv" | "xlsx") => {
    if (!includeTransactions && !includeSummary) {
      addToast({
        title: "Nothing to Export",
        message: "Please select at least one item to export",
        variant: "error",
      });
      return;
    }

    setIsExporting(true);

    try {
      const response = await fetch("/api/export/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          format,
          includeTransactions,
          includeSummary,
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
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
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

  const transactionCount = transactions.length;
  const totalDebits = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalCredits = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  // Get date range
  const dates = transactions.map((t) => new Date(t.date).getTime());
  const minDate = dates.length > 0 ? new Date(Math.min(...dates)) : null;
  const maxDate = dates.length > 0 ? new Date(Math.max(...dates)) : null;
  const dateRange = minDate && maxDate
    ? `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`
    : "No transactions";

  // Get unique accounts
  const uniqueAccounts = new Set(
    transactions
      .filter((t) => t.suggestedAccountName)
      .map((t) => t.suggestedAccountName)
  ).size;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-semibold text-sm">
            4
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Export Transactions</h1>
        </div>
        <p className="text-gray-500 ml-11">
          Export extracted transaction data for your records
        </p>
      </div>

      {/* No Transactions Warning */}
      {transactionCount === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-10 w-10 text-amber-500" />
              <div>
                <h3 className="font-medium text-amber-900">
                  No Transactions to Export
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  You need to extract transactions before you can export them.
                </p>
                <Link href={`/projects/${projectId}/transactions`}>
                  <Button size="sm" className="mt-3">
                    Extract Transactions
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Summary */}
      {transactionCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Transactions</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {transactionCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Credits (In)</p>
                  <p className="text-xl font-semibold text-green-600">
                    {totalCredits.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <DollarSign className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Debits (Out)</p>
                  <p className="text-xl font-semibold text-red-600">
                    {totalDebits.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date Range</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {dateRange}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Options */}
      {transactionCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-indigo-600" />
              Export Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Select what to include in your export:
            </p>

            {/* Export Options Checkboxes */}
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                    includeTransactions
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-gray-300"
                  )}
                  onClick={() => setIncludeTransactions(!includeTransactions)}
                >
                  {includeTransactions && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    Transaction Details
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({transactionCount} transactions)
                  </span>
                  <p className="text-xs text-gray-500">
                    Date, description, amount, type, suggested account
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                    includeSummary
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-gray-300"
                  )}
                  onClick={() => setIncludeSummary(!includeSummary)}
                >
                  {includeSummary && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    Account Summary
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({uniqueAccounts} accounts)
                  </span>
                  <p className="text-xs text-gray-500">
                    Totals by account for easy review
                  </p>
                </div>
              </label>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => handleExport("csv")}
                disabled={isExporting || (!includeTransactions && !includeSummary)}
                isLoading={isExporting}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Download as CSV
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              CSV files can be imported into Excel, Google Sheets, or your accounting software.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Help Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900">About this export</h3>
        <ul className="mt-2 text-sm text-blue-700 space-y-1">
          <li>Export raw transaction data for your bookkeeper&apos;s records</li>
          <li>Use the account summary for quick review of totals by category</li>
          <li>The final Chart of Accounts and Report are generated in the next step</li>
        </ul>
      </div>

      {/* Workflow Navigation */}
      <WorkflowNav
        projectId={projectId}
        currentStep="export"
      />
    </div>
  );
}
