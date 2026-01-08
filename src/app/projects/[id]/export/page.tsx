"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Download,
  FileSpreadsheet,
  AlertCircle,
  FileText,
  Package,
  CheckCircle2,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WorkflowNav } from "@/components/workflow";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface ProjectData {
  id: string;
  name: string;
  businessName: string;
}

interface ExportOption {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  format: string;
  icon: React.ReactNode;
  endpoint: string;
  filename: string;
}

export default function ExportPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const projectId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  // Selection state for Download All
  const [selectedFormats, setSelectedFormats] = useState({
    qbo: true,
    qbd: true,
    xero: true,
    transactions: true,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const projectRes = await fetch(`/api/projects/${projectId}`);

        if (!projectRes.ok) {
          throw new Error("Project not found");
        }

        const projectData = await projectRes.json();
        setProject(projectData);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  // Define export options - 4 specific formats as requested
  const exportOptions: ExportOption[] = [
    {
      id: "qbo",
      title: "Chart of Accounts",
      subtitle: "QuickBooks Online",
      description: "Ready-to-import CSV file for QuickBooks Online",
      format: ".csv",
      icon: <FileSpreadsheet className="h-6 w-6" />,
      endpoint: `/api/export/qbo/${projectId}`,
      filename: `${project?.businessName || "CoA"}_QBO.csv`,
    },
    {
      id: "qbd",
      title: "Chart of Accounts",
      subtitle: "QuickBooks Desktop",
      description: "Ready-to-import IIF file for QuickBooks Desktop",
      format: ".iif",
      icon: <FileSpreadsheet className="h-6 w-6" />,
      endpoint: `/api/export/qbd/${projectId}`,
      filename: `${project?.businessName || "CoA"}_QBD.iif`,
    },
    {
      id: "xero",
      title: "Chart of Accounts",
      subtitle: "Xero",
      description: "Ready-to-import CSV file for Xero accounting",
      format: ".csv",
      icon: <FileSpreadsheet className="h-6 w-6" />,
      endpoint: `/api/export/xero/${projectId}`,
      filename: `${project?.businessName || "CoA"}_Xero.csv`,
    },
    {
      id: "transactions",
      title: "Transactions",
      subtitle: "Standard CSV",
      description: "All extracted transactions with account mappings",
      format: ".csv",
      icon: <FileText className="h-6 w-6" />,
      endpoint: `/api/export/transactions/${projectId}`,
      filename: `${project?.businessName || "Client"}_Transactions.csv`,
    },
  ];

  // Toggle format selection
  const toggleFormat = (formatId: string) => {
    setSelectedFormats((prev) => ({
      ...prev,
      [formatId]: !prev[formatId as keyof typeof prev],
    }));
  };

  // Handle individual file download
  const handleDownload = async (option: ExportOption) => {
    setDownloadingId(option.id);

    try {
      const response = await fetch(option.endpoint);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to download ${option.title}`);
      }

      // Get the blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement("a");
      a.href = url;
      a.download = option.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Mark as downloaded
      setDownloadedIds((prev) => new Set([...prev, option.id]));

      addToast({
        title: "Download Complete",
        message: `${option.title} (${option.subtitle}) downloaded successfully`,
        variant: "success",
      });
    } catch (err) {
      console.error("Download error:", err);
      addToast({
        title: "Download Failed",
        message: err instanceof Error ? err.message : "Failed to download file",
        variant: "error",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle download all as ZIP
  const handleDownloadAll = async () => {
    // Check if at least one format is selected
    const hasSelection = Object.values(selectedFormats).some((v) => v);
    if (!hasSelection) {
      addToast({
        title: "No Formats Selected",
        message: "Please select at least one export format",
        variant: "error",
      });
      return;
    }

    setDownloadingId("all");

    try {
      const response = await fetch("/api/export/bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          includeQBO: selectedFormats.qbo,
          includeQBD: selectedFormats.qbd,
          includeXero: selectedFormats.xero,
          includeTransactions: selectedFormats.transactions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create bundle");
      }

      // Get the blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.businessName || "Client"}_Export_Bundle.zip`.replace(/[^a-zA-Z0-9._-]/g, "_");
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Mark selected items as downloaded
      const newDownloaded = new Set(downloadedIds);
      if (selectedFormats.qbo) newDownloaded.add("qbo");
      if (selectedFormats.qbd) newDownloaded.add("qbd");
      if (selectedFormats.xero) newDownloaded.add("xero");
      if (selectedFormats.transactions) newDownloaded.add("transactions");
      setDownloadedIds(newDownloaded);

      addToast({
        title: "Bundle Downloaded",
        message: "Selected files downloaded as ZIP archive",
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
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-slate-200 rounded-lg" />
            ))}
          </div>
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
              <h3 className="mt-4 text-lg font-medium text-slate-900">Error</h3>
              <p className="mt-2 text-sm text-slate-500">{error}</p>
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

  const selectedCount = Object.values(selectedFormats).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-600 font-semibold text-sm">
            4
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Export Files</h1>
        </div>
        <p className="text-slate-500 ml-11">
          Download your Chart of Accounts and Transactions in multiple formats
        </p>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportOptions.map((option) => {
          const isDownloading = downloadingId === option.id;
          const isDownloaded = downloadedIds.has(option.id);
          const isSelected = selectedFormats[option.id as keyof typeof selectedFormats];

          return (
            <Card
              key={option.id}
              className={cn(
                "relative overflow-hidden transition-all duration-200",
                isDownloaded && "ring-2 ring-emerald-500 ring-offset-2",
                isSelected && !isDownloaded && "ring-2 ring-teal-500 ring-offset-2"
              )}
            >
              {/* Selection checkbox for Download All */}
              <button
                onClick={() => toggleFormat(option.id)}
                className={cn(
                  "absolute top-3 left-3 flex h-5 w-5 items-center justify-center rounded border transition-colors",
                  isSelected
                    ? "bg-teal-600 border-teal-600"
                    : "border-slate-300 bg-white hover:border-teal-500"
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </button>

              {isDownloaded && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
              )}

              <CardContent className="p-6 pl-12">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-lg",
                      option.id === "transactions"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-teal-100 text-teal-600"
                    )}
                  >
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {option.title}
                    </h3>
                    <p className="text-sm font-medium text-slate-600">
                      {option.subtitle}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {option.format}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(option)}
                    disabled={downloadingId !== null}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Download All Button */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Download All Selected</h3>
                <p className="text-sm text-slate-500">
                  {selectedCount === 0
                    ? "Select formats above to include in ZIP"
                    : `${selectedCount} format${selectedCount !== 1 ? "s" : ""} selected`}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleDownloadAll}
              disabled={downloadingId !== null || selectedCount === 0}
            >
              {downloadingId === "all" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating ZIP...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download ZIP
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Format Info */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-teal-900">File Format Guide</h3>
        <ul className="mt-2 text-sm text-teal-700 space-y-1">
          <li><strong>QBO (.csv):</strong> QuickBooks Online - Settings → Import Data → Chart of Accounts</li>
          <li><strong>QBD (.iif):</strong> QuickBooks Desktop - File → Utilities → Import → IIF Files</li>
          <li><strong>Xero (.csv):</strong> Xero - Accounting → Chart of Accounts → Import</li>
          <li><strong>Transactions (.csv):</strong> Standard CSV format for all extracted transactions</li>
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
