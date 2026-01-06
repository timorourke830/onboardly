"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  RefreshCw,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionTable, ExtractionProgress } from "@/components/transactions";
import { useToast } from "@/components/ui/toast";
import { Transaction } from "@/types/transaction";
import { Account } from "@/types/coa";

interface Project {
  id: string;
  name: string;
  businessName: string;
  status: string;
}

export default function TransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<{
    documentsProcessed: number;
    totalTransactions: number;
    errors: string[];
  } | null>(null);
  const [documentsCount, setDocumentsCount] = useState(0);

  // Load project and transactions
  useEffect(() => {
    async function loadData() {
      try {
        // Load project
        const projectRes = await fetch(`/api/projects/${projectId}`);
        if (!projectRes.ok) {
          addToast({ message: "Project not found", variant: "error" });
          router.push("/projects");
          return;
        }
        const projectData = await projectRes.json();
        setProject(projectData);

        // Count documents that can have transactions
        const transactionDocs = (projectData.documents || []).filter(
          (d: { category: string }) =>
            ["bank_statement", "receipt", "invoice", "credit_card"].includes(d.category)
        );
        setDocumentsCount(transactionDocs.length);

        // Load CoA for account mapping
        const coaRes = await fetch(`/api/coa/${projectId}`);
        if (coaRes.ok) {
          const coaData = await coaRes.json();
          setAccounts(coaData.accounts || []);
        }

        // Load existing transactions
        const transRes = await fetch(`/api/extract-transactions?projectId=${projectId}`);
        if (transRes.ok) {
          const transData = await transRes.json();
          setTransactions(transData.transactions || []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [projectId, addToast, router]);

  // Extract transactions
  const handleExtract = async () => {
    setIsExtracting(true);
    setExtractionResult(null);

    try {
      const response = await fetch("/api/extract-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to extract transactions");
      }

      const result = await response.json();
      setExtractionResult(result);

      // Reload transactions
      const transRes = await fetch(`/api/extract-transactions?projectId=${projectId}`);
      if (transRes.ok) {
        const transData = await transRes.json();
        setTransactions(transData.transactions || []);
      }

      addToast({
        title: "Extraction Complete",
        message: `Extracted ${result.totalTransactions} transactions from ${result.documentsProcessed} documents`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error extracting transactions:", error);
      addToast({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to extract transactions",
        variant: "error",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Update transaction
  const handleUpdateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      // Optimistically update UI
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );

      // TODO: Save to server
      // For now, just show toast
      addToast({
        message: "Transaction updated",
        variant: "success",
      });
    },
    [addToast]
  );

  // Mark transaction as reviewed
  const handleMarkReviewed = useCallback(
    async (id: string, reviewed: boolean) => {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isReviewed: reviewed } : t))
      );
    },
    []
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/projects/${projectId}`}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Transactions
                </h1>
                {project && (
                  <p className="text-sm text-gray-500">
                    {project.name} - {project.businessName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {transactions.length > 0 && (
                <Link href={`/projects/${projectId}/export`}>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </Link>
              )}
              <Link href={`/projects/${projectId}/coa`}>
                <Button>
                  Chart of Accounts
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Extraction Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Transaction Extraction
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documentsCount === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No documents to extract from
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload and classify bank statements, receipts, or invoices first.
                </p>
                <Link href={`/projects/${projectId}/upload`}>
                  <Button className="mt-4">Upload Documents</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <ExtractionProgress
                  isExtracting={isExtracting}
                  documentsTotal={documentsCount}
                  documentsProcessed={extractionResult?.documentsProcessed || 0}
                  transactionsFound={extractionResult?.totalTransactions || transactions.length}
                  errors={extractionResult?.errors || []}
                />

                <div className="flex justify-center">
                  <Button
                    onClick={handleExtract}
                    disabled={isExtracting}
                    isLoading={isExtracting}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {transactions.length > 0 ? "Re-extract Transactions" : "Extract Transactions"}
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  This will use AI to extract transactions from {documentsCount} document
                  {documentsCount !== 1 ? "s" : ""} (bank statements, receipts, invoices).
                  {transactions.length > 0 && " Existing transactions will be replaced."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions Table */}
        {transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Extracted Transactions
                </span>
                <span className="text-sm font-normal text-gray-500">
                  {transactions.filter((t) => t.isReviewed).length} of{" "}
                  {transactions.length} reviewed
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTable
                transactions={transactions}
                accounts={accounts}
                onUpdateTransaction={handleUpdateTransaction}
                onMarkReviewed={handleMarkReviewed}
              />
            </CardContent>
          </Card>
        )}

        {/* Help section */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900">How it works</h3>
          <ul className="mt-2 text-sm text-blue-700 space-y-1">
            <li>1. Click "Extract Transactions" to analyze your documents with AI</li>
            <li>2. Review extracted transactions and verify account mappings</li>
            <li>3. Click on an account to change the mapping if needed</li>
            <li>4. Export transactions along with your Chart of Accounts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
