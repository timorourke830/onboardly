"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  RefreshCw,
  Download,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReportPreview } from "@/components/reports";
import { useToast } from "@/components/ui/toast";
import { OnboardingReport } from "@/types/report";

interface Project {
  id: string;
  name: string;
  businessName: string;
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [report, setReport] = useState<OnboardingReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load project and report
  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load project info
      const projectRes = await fetch(`/api/projects/${projectId}`);
      if (!projectRes.ok) {
        if (projectRes.status === 404) {
          router.push("/projects");
          return;
        }
        throw new Error("Failed to load project");
      }
      const projectData = await projectRes.json();
      setProject(projectData);

      // Load report
      const reportRes = await fetch(`/api/reports/onboarding?projectId=${projectId}`);
      if (!reportRes.ok) {
        throw new Error("Failed to generate report");
      }
      const reportData = await reportRes.json();
      setReport(reportData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const reportRes = await fetch(`/api/reports/onboarding?projectId=${projectId}`);
      if (!reportRes.ok) {
        throw new Error("Failed to refresh report");
      }
      const reportData = await reportRes.json();
      setReport(reportData);
      addToast({
        title: "Report Refreshed",
        message: "The report has been updated with the latest data",
        variant: "success",
      });
    } catch (err) {
      addToast({
        title: "Error",
        message: "Failed to refresh report",
        variant: "error",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-gray-200 rounded" />
              <div className="h-24 bg-gray-200 rounded" />
              <div className="h-24 bg-gray-200 rounded" />
            </div>
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Error Loading Report
                </h3>
                <p className="mt-2 text-sm text-gray-500">{error}</p>
                <div className="mt-6 flex justify-center gap-4">
                  <Button variant="outline" onClick={() => router.push(`/projects/${projectId}`)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Project
                  </Button>
                  <Button onClick={loadData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                  Onboarding Report
                </h1>
                {project && (
                  <p className="text-sm text-gray-500">{project.name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Preview */}
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

        {/* Help Section */}
        <div className="mt-8 bg-indigo-50 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
              <Sparkles className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-indigo-900">
                About This Report
              </h3>
              <p className="mt-1 text-sm text-indigo-700">
                This report provides a comprehensive overview of the client onboarding
                status. Download the full PDF to share with your client or keep for your
                records. The report includes document coverage analysis, transaction
                summary, and actionable recommendations.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={`/projects/${projectId}/upload`}>
                  <Button variant="outline" size="sm">
                    Upload Documents
                  </Button>
                </Link>
                <Link href={`/projects/${projectId}/transactions`}>
                  <Button variant="outline" size="sm">
                    View Transactions
                  </Button>
                </Link>
                <Link href={`/projects/${projectId}/export`}>
                  <Button variant="outline" size="sm">
                    Export Data
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href={`/projects/${projectId}`}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="inline h-4 w-4 mr-1" />
              Back to Project
            </Link>
            <Link href={`/projects/${projectId}/export`}>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
