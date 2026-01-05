"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, FileSpreadsheet, AlertCircle, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IndustrySelector,
  CoATable,
  AddAccountModal,
  SuggestionsPanel,
} from "@/components/coa";
import {
  Account,
  AccountSuggestion,
  IndustryType,
  ExportFormat,
  CoAGenerationResult,
} from "@/types/coa";
import { useToast } from "@/components/ui/toast";

type PageState = "select-industry" | "loading" | "editing" | "error";

export default function ChartOfAccountsPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const projectId = params.id as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [suggestions, setSuggestions] = useState<AccountSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("");

  // Load existing CoA on mount
  useEffect(() => {
    const loadCoA = async () => {
      try {
        const response = await fetch(`/api/coa/${projectId}`);

        if (response.ok) {
          const data = await response.json();
          setAccounts(data.accounts || []);
          setSuggestions(data.suggestedAccounts || []);
          setSelectedIndustry(data.industry as IndustryType);
          setPageState("editing");
        } else if (response.status === 404) {
          // No CoA exists yet, show industry selector
          setPageState("select-industry");
        } else {
          throw new Error("Failed to load Chart of Accounts");
        }
      } catch (err) {
        console.error("Error loading CoA:", err);
        setPageState("select-industry");
      }
    };

    // Also load project info
    const loadProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setProjectName(data.name);
        }
      } catch (err) {
        console.error("Error loading project:", err);
      }
    };

    loadCoA();
    loadProject();
  }, [projectId]);

  const handleGenerate = async () => {
    if (!selectedIndustry) return;

    setIsGenerating(true);
    setError(null);

    console.log("[CoA Page] Generating CoA with:", { projectId, industry: selectedIndustry });

    try {
      const response = await fetch("/api/coa/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          industry: selectedIndustry,
          includeDocumentSuggestions: true,
        }),
      });

      console.log("[CoA Page] Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[CoA Page] Error response:", errorData);
        throw new Error(errorData.error || "Failed to generate Chart of Accounts");
      }

      const result: CoAGenerationResult = await response.json();
      console.log("[CoA Page] Success! Accounts:", result.baseAccounts?.length, "Suggestions:", result.suggestedAccounts?.length);

      setAccounts(result.baseAccounts);
      setSuggestions(result.suggestedAccounts);
      setPageState("editing");

      addToast({
        title: "Chart of Accounts Generated",
        message: `Created ${result.baseAccounts.length} accounts with ${result.suggestedAccounts.length} suggestions`,
        variant: "success",
      });
    } catch (err) {
      console.error("[CoA Page] Error generating CoA:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate Chart of Accounts";
      setError(errorMessage + ". Please try again.");
      addToast({
        title: "Error",
        message: errorMessage,
        variant: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveChanges = useCallback(async (
    updatedAccounts: Account[],
    updatedSuggestions: AccountSuggestion[]
  ) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/coa/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: updatedAccounts }),
      });

      if (!response.ok) {
        throw new Error("Failed to save changes");
      }
    } catch (err) {
      console.error("Error saving CoA:", err);
      addToast({
        title: "Error",
        message: "Failed to save changes",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }, [projectId, addToast]);

  const handleUpdateAccount = useCallback((updatedAccount: Account) => {
    setAccounts((prev) => {
      const newAccounts = prev.map((acc) =>
        acc.number === updatedAccount.number ? updatedAccount : acc
      );
      // Sort by account number
      newAccounts.sort((a, b) => a.number.localeCompare(b.number));
      saveChanges(newAccounts, suggestions);
      return newAccounts;
    });
  }, [saveChanges, suggestions]);

  const handleDeleteAccount = useCallback((accountNumber: string) => {
    setAccounts((prev) => {
      const newAccounts = prev.filter((acc) => acc.number !== accountNumber);
      saveChanges(newAccounts, suggestions);
      return newAccounts;
    });
  }, [saveChanges, suggestions]);

  const handleAddAccount = useCallback((account: Omit<Account, "id">) => {
    setAccounts((prev) => {
      const newAccount: Account = {
        ...account,
        id: `custom-${Date.now()}`,
        isCustom: true,
      };
      const newAccounts = [...prev, newAccount].sort((a, b) =>
        a.number.localeCompare(b.number)
      );
      saveChanges(newAccounts, suggestions);
      return newAccounts;
    });
  }, [saveChanges, suggestions]);

  const handleAcceptSuggestion = useCallback(async (index: number) => {
    const suggestion = suggestions[index];
    if (!suggestion) return;

    // Add to accounts
    setAccounts((prev) => {
      const newAccount: Account = {
        ...suggestion.account,
        id: `accepted-${Date.now()}`,
        isCustom: true,
      };
      return [...prev, newAccount].sort((a, b) => a.number.localeCompare(b.number));
    });

    // Remove from suggestions
    setSuggestions((prev) => prev.filter((_, i) => i !== index));

    // Save to server
    try {
      await fetch(`/api/coa/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptSuggestion: { suggestionIndex: index } }),
      });

      addToast({
        title: "Suggestion Accepted",
        message: `Added ${suggestion.account.name} to your Chart of Accounts`,
        variant: "success",
      });
    } catch (err) {
      console.error("Error accepting suggestion:", err);
    }
  }, [projectId, suggestions, addToast]);

  const handleRejectSuggestion = useCallback(async (index: number) => {
    const suggestion = suggestions[index];
    if (!suggestion) return;

    // Remove from suggestions
    setSuggestions((prev) => prev.filter((_, i) => i !== index));

    // Save to server
    try {
      await fetch(`/api/coa/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectSuggestion: { suggestionIndex: index } }),
      });
    } catch (err) {
      console.error("Error rejecting suggestion:", err);
    }
  }, [projectId, suggestions]);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/coa/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, format }),
      });

      if (!response.ok) {
        throw new Error("Failed to export");
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `chart-of-accounts.${format === "qbd" ? "iif" : "csv"}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addToast({
        title: "Export Complete",
        message: `Downloaded ${filename}`,
        variant: "success",
      });
    } catch (err) {
      console.error("Error exporting CoA:", err);
      addToast({
        title: "Export Failed",
        message: "Failed to export Chart of Accounts",
        variant: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

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
                  Chart of Accounts
                </h1>
                {projectName && (
                  <p className="text-sm text-gray-500">{projectName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isSaving && (
                <span className="text-sm text-gray-500">Saving...</span>
              )}
              {pageState === "editing" && accounts.length > 0 && (
                <Link href={`/projects/${projectId}/export`}>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pageState === "loading" && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        )}

        {pageState === "error" && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Error Loading Chart of Accounts
                </h3>
                <p className="mt-2 text-sm text-gray-500">{error}</p>
                <Button
                  className="mt-4"
                  onClick={() => setPageState("select-industry")}
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {pageState === "select-industry" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                Generate Chart of Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IndustrySelector
                selectedIndustry={selectedIndustry}
                onSelect={setSelectedIndustry}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {pageState === "editing" && (
          <div className="space-y-6">
            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <SuggestionsPanel
                suggestions={suggestions}
                onAccept={handleAcceptSuggestion}
                onReject={handleRejectSuggestion}
              />
            )}

            {/* Accounts Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                  Accounts
                  {selectedIndustry && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({selectedIndustry.replace("-", " ")} template)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CoATable
                  accounts={accounts}
                  onUpdateAccount={handleUpdateAccount}
                  onDeleteAccount={handleDeleteAccount}
                  onAddAccount={() => setShowAddModal(true)}
                  onExport={handleExport}
                  isExporting={isExporting}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAccount}
        existingNumbers={accounts.map((a) => a.number)}
      />
    </div>
  );
}
