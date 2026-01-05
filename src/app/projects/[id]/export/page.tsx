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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExportOptions } from "@/components/export";

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

export default function ExportPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [coa, setCoa] = useState<CoAData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load project and CoA data in parallel
        const [projectRes, coaRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/coa/${projectId}`),
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
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId]);

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
                Export Chart of Accounts
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
        {/* Summary Card */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Ready to Export
                  </h3>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">
                      {accountCount} accounts
                    </span>{" "}
                    ready to export
                    {coa?.industry && (
                      <span className="ml-1">
                        ({coa.industry.replace("-", " ")} template)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Link href={`/projects/${projectId}/coa`}>
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Edit Accounts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Choose Export Format
          </h2>
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
