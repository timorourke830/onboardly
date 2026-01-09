"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  FileText,
  Package,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { ReportPreview } from "@/components/reports";
import { useToast } from "@/components/ui/toast";
import { OnboardingReport } from "@/types/report";
import { Account, IndustryType } from "@/types/coa";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  businessName: string;
  industry: string;
  _count?: {
    documents: number;
  };
}

interface DownloadOption {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  format: string;
  icon: React.ReactNode;
}

const INDUSTRY_OPTIONS = [
  { value: "general", label: "General Business" },
  { value: "retail", label: "Retail / E-commerce" },
  { value: "professional-services", label: "Professional Services" },
  { value: "restaurant", label: "Restaurant / Food Service" },
  { value: "construction", label: "Construction" },
  { value: "real-estate", label: "Real Estate" },
  { value: "healthcare", label: "Healthcare" },
  { value: "nonprofit", label: "Non-profit" },
  { value: "technology", label: "Technology / SaaS" },
  { value: "manufacturing", label: "Manufacturing" },
];

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [transactionCount, setTransactionCount] = useState(0);
  const [coa, setCoa] = useState<{ accounts: Account[] } | null>(null);
  const [report, setReport] = useState<OnboardingReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>("general");
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  // Download options
  const downloadOptions: DownloadOption[] = [
    {
      id: "qbo",
      title: "Chart of Accounts",
      subtitle: "QuickBooks Online",
      description: "Ready-to-import CSV file for QBO",
      format: ".csv",
      icon: <FileSpreadsheet className="h-6 w-6" />,
    },
    {
      id: "qbd",
      title: "Chart of Accounts",
      subtitle: "QuickBooks Desktop",
      description: "Ready-to-import IIF file for QBD",
      format: ".iif",
      icon: <FileSpreadsheet className="h-6 w-6" />,
    },
    {
      id: "xero",
      title: "Chart of Accounts",
      subtitle: "Xero",
      description: "Ready-to-import CSV file for Xero",
      format: ".csv",
      icon: <FileSpreadsheet className="h-6 w-6" />,
    },
    {
      id: "report",
      title: "Onboarding Report",
      subtitle: "PDF Document",
      description: "Summary with gaps & recommendations",
      format: ".pdf",
      icon: <FileText className="h-6 w-6" />,
    },
  ];

  // Load project data
  useEffect(() => {
    async function loadData() {
      try {
        const [projectRes, transRes, coaRes, reportRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/extract-transactions?projectId=${projectId}`),
          fetch(`/api/coa/${projectId}`),
          fetch(`/api/reports/onboarding?projectId=${projectId}`),
        ]);

        if (!projectRes.ok) {
          router.push("/projects");
          return;
        }

        const projectData = await projectRes.json();
        setProject(projectData);
        setSelectedIndustry((projectData.industry as IndustryType) || "general");

        if (transRes.ok) {
          const transData = await transRes.json();
          setTransactionCount(transData.transactions?.length || 0);
        }

        if (coaRes.ok) {
          const coaData = await coaRes.json();
          setCoa(coaData);
        }

        if (reportRes.ok) {
          const reportData = await reportRes.json();
          setReport(reportData);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load project data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [projectId, router]);

  // Generate CoA and Report
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Step 1: Generate Chart of Accounts
      const coaRes = await fetch("/api/coa/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          industry: selectedIndustry,
          includeDocumentSuggestions: true,
        }),
      });

      if (!coaRes.ok) {
        const errorData = await coaRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate Chart of Accounts");
      }

      const coaData = await coaRes.json();
      setCoa({ accounts: coaData.baseAccounts });

      // Step 2: Refresh the report
      const reportRes = await fetch(`/api/reports/onboarding?projectId=${projectId}`);
      if (reportRes.ok) {
        const reportData = await reportRes.json();
        setReport(reportData);
      }

      addToast({
        title: "Generation Complete",
        message: `Generated ${coaData.baseAccounts?.length || 0} accounts and updated report`,
        variant: "success",
      });
    } catch (err) {
      console.error("Error generating:", err);
      setError(err instanceof Error ? err.message : "Failed to generate");
      addToast({
        title: "Generation Failed",
        message: err instanceof Error ? err.message : "Failed to generate",
        variant: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle individual download
  const handleDownload = async (optionId: string) => {
    setDownloadingId(optionId);

    try {
      let response: Response;
      let filename: string;

      if (optionId === "report") {
        // Download PDF report
        response = await fetch(`/api/reports/onboarding?projectId=${projectId}&format=pdf`);
        filename = `${project?.businessName || "Client"}_Onboarding_Report.pdf`;
      } else {
        // Download CoA export
        response = await fetch(`/api/export/${optionId}/${projectId}`);
        const ext = optionId === "qbd" ? "iif" : "csv";
        filename = `${project?.businessName || "CoA"}_${optionId.toUpperCase()}.${ext}`;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to download");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadedIds((prev) => new Set([...prev, optionId]));

      const option = downloadOptions.find((o) => o.id === optionId);
      addToast({
        title: "Download Complete",
        message: `${option?.title} (${option?.subtitle}) downloaded`,
        variant: "success",
      });
    } catch (err) {
      console.error("Download error:", err);
      addToast({
        title: "Download Failed",
        message: err instanceof Error ? err.message : "Failed to download",
        variant: "error",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle download all
  const handleDownloadAll = async () => {
    setDownloadingId("all");

    try {
      const response = await fetch("/api/export/bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          includeQBO: true,
          includeQBD: true,
          includeXero: true,
          includeTransactions: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create bundle");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.businessName || "Client"}_Export_Bundle.zip`.replace(/[^a-zA-Z0-9._-]/g, "_");
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Also download the PDF report separately (not in ZIP)
      await handleDownload("report");

      setDownloadedIds(new Set(["qbo", "qbd", "xero", "report"]));

      addToast({
        title: "Bundle Downloaded",
        message: "All files downloaded successfully",
        variant: "success",
      });
    } catch (err) {
      console.error("Bundle download error:", err);
      addToast({
        title: "Download Failed",
        message: err instanceof Error ? err.message : "Failed to download bundle",
        variant: "error",
      });
    } finally {
      setDownloadingId(null);
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

  const docCount = project?._count?.documents || 0;
  const hasDocuments = docCount > 0;
  const hasTransactions = transactionCount > 0;
  const hasCoA = coa && coa.accounts?.length > 0;

  // Calculate completeness score
  const completenessScore = report?.overallCompletenessScore || 0;
  const scoreColor = completenessScore >= 80 ? "text-green-600" : completenessScore >= 50 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report & Chart of Accounts</h1>
        <p className="text-gray-500 mt-1">
          Generate final deliverables for client onboarding
        </p>
      </div>

      {/* Prerequisites Check */}
      {(!hasDocuments || !hasTransactions) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-900">
                  Complete Previous Steps First
                </h3>
                <ul className="mt-2 text-sm text-amber-700 space-y-1">
                  {!hasDocuments && (
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      No documents uploaded
                      <Link href={`/projects/${projectId}/upload`} className="underline ml-1">
                        Upload now
                      </Link>
                    </li>
                  )}
                  {!hasTransactions && hasDocuments && (
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      No transactions extracted
                      <Link href={`/projects/${projectId}/transactions`} className="underline ml-1">
                        Extract now
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                hasDocuments ? "bg-green-100" : "bg-gray-100"
              )}>
                <FileText className={cn(
                  "h-5 w-5",
                  hasDocuments ? "text-green-600" : "text-gray-400"
                )} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Documents</p>
                <p className="text-xl font-semibold text-gray-900">{docCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                hasTransactions ? "bg-green-100" : "bg-gray-100"
              )}>
                <FileSpreadsheet className={cn(
                  "h-5 w-5",
                  hasTransactions ? "text-green-600" : "text-gray-400"
                )} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Transactions</p>
                <p className="text-xl font-semibold text-gray-900">{transactionCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                hasCoA ? "bg-green-100" : "bg-gray-100"
              )}>
                <ClipboardList className={cn(
                  "h-5 w-5",
                  hasCoA ? "text-green-600" : "text-gray-400"
                )} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Accounts</p>
                <p className="text-xl font-semibold text-gray-900">
                  {coa?.accounts?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                completenessScore >= 80 ? "bg-green-100" : completenessScore >= 50 ? "bg-amber-100" : "bg-red-100"
              )}>
                {completenessScore >= 80 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className={cn(
                    "h-5 w-5",
                    completenessScore >= 50 ? "text-amber-600" : "text-red-600"
                  )} />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Completeness</p>
                <p className={cn("text-xl font-semibold", scoreColor)}>
                  {completenessScore}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-600" />
            Generate Chart of Accounts & Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry Template
              </label>
              <Select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value as IndustryType)}
                options={INDUSTRY_OPTIONS}
                className="max-w-xs"
              />
              <p className="text-xs text-gray-500 mt-1">
                The Chart of Accounts will be customized based on this industry
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !hasDocuments}
              isLoading={isGenerating}
              size="lg"
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {hasCoA ? "Regenerate" : "Generate"} Chart of Accounts & Report
            </Button>

            <p className="text-xs text-gray-500">
              This will generate a Chart of Accounts based on the selected industry template
              and AI analysis of your documents and transactions, plus refresh the onboarding report.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Download Section - 4 Individual Options */}
      {hasCoA && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-teal-600" />
              Download Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Individual Download Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {downloadOptions.map((option) => {
                const isDownloading = downloadingId === option.id;
                const isDownloaded = downloadedIds.has(option.id);

                return (
                  <div
                    key={option.id}
                    className={cn(
                      "relative flex items-center justify-between p-4 border rounded-lg transition-all",
                      isDownloaded && "ring-2 ring-emerald-500 ring-offset-2",
                      "hover:bg-gray-50"
                    )}
                  >
                    {isDownloaded && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          option.id === "report"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-teal-100 text-teal-600"
                        )}
                      >
                        {option.icon}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{option.title}</p>
                        <p className="text-sm text-gray-500">
                          {option.subtitle} <span className="text-gray-400">({option.format})</span>
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(option.id)}
                      disabled={downloadingId !== null}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Download All */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Download All Files</p>
                    <p className="text-sm text-gray-500">
                      Get all 4 files at once
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleDownloadAll}
                  disabled={downloadingId !== null}
                >
                  {downloadingId === "all" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart of Accounts Preview */}
      {hasCoA && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-teal-600" />
                Chart of Accounts Preview
              </span>
              <span className="text-sm font-normal text-gray-500">
                {coa.accounts.length} accounts
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Number</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Name</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coa.accounts.slice(0, 15).map((account) => (
                    <tr key={account.number} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-gray-600">{account.number}</td>
                      <td className="px-3 py-2 text-gray-900">{account.name}</td>
                      <td className="px-3 py-2 text-gray-500 capitalize">{account.type}</td>
                    </tr>
                  ))}
                  {coa.accounts.length > 15 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-center text-gray-500 text-xs">
                        + {coa.accounts.length - 15} more accounts
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Preview */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-teal-600" />
              Onboarding Report Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReportPreview
              report={report}
              projectId={projectId}
              onDownload={() =>
                addToast({
                  title: "Report Downloaded",
                  message: "The PDF report has been saved to your downloads",
                  variant: "success",
                })
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
