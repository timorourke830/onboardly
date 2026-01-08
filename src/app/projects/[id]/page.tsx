"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Upload,
  FileSearch,
  DollarSign,
  Download,
  ClipboardList,
  ArrowRight,
  Settings,
  Trash2,
  FileText,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  StatusBadge,
  ProjectStatus,
  EditProjectModal,
  DeleteProjectModal,
} from "@/components/projects";
import { useToast } from "@/components/ui/toast";
import { CATEGORY_LABELS, DocumentCategory } from "@/types/document";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  category: DocumentCategory;
  subcategory?: string;
  isReviewed: boolean;
}

interface Project {
  id: string;
  name: string;
  businessName: string;
  industry: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  documents: Document[];
  coa: { id: string; accounts: any[] } | null;
  _count: {
    documents: number;
  };
}

interface WorkflowStep {
  id: string;
  number: number;
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [transactionCount, setTransactionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Define workflow steps
  const workflowSteps: WorkflowStep[] = [
    {
      id: "upload",
      number: 1,
      label: "Upload Documents",
      href: `/projects/${projectId}/upload`,
      icon: Upload,
      description: "Upload bank statements, receipts, invoices, and other financial documents",
    },
    {
      id: "review",
      number: 2,
      label: "Review Documents",
      href: `/projects/${projectId}/documents`,
      icon: FileSearch,
      description: "Review and verify AI document classifications",
    },
    {
      id: "transactions",
      number: 3,
      label: "Extract Transactions",
      href: `/projects/${projectId}/transactions`,
      icon: DollarSign,
      description: "Extract transactions from uploaded documents using AI",
    },
    {
      id: "export",
      number: 4,
      label: "Export Transactions",
      href: `/projects/${projectId}/export`,
      icon: Download,
      description: "Export transaction data as CSV for records or manual import",
    },
    {
      id: "report",
      number: 5,
      label: "Report & Chart of Accounts",
      href: `/projects/${projectId}/report`,
      icon: ClipboardList,
      description: "Generate the final Chart of Accounts and Onboarding Report",
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, transRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/extract-transactions?projectId=${projectId}`),
        ]);

        if (projectRes.ok) {
          const data = await projectRes.json();
          setProject(data);
        } else if (projectRes.status === 404) {
          router.push("/projects");
        }

        if (transRes.ok) {
          const transData = await transRes.json();
          setTransactionCount(transData.transactions?.length || 0);
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId, router]);

  const documentsByCategory = useMemo(() => {
    if (!project?.documents) return {};

    const counts: Record<string, number> = {};
    project.documents.forEach((doc) => {
      const category = doc.category || "other";
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  }, [project?.documents]);

  const reviewedDocCount = useMemo(() => {
    return project?.documents?.filter((d) => d.isReviewed).length || 0;
  }, [project?.documents]);

  // Determine step status
  const getStepStatus = (step: WorkflowStep): "complete" | "current" | "pending" | "disabled" => {
    const docCount = project?._count?.documents || 0;

    switch (step.id) {
      case "upload":
        return docCount > 0 ? "complete" : "current";
      case "review":
        if (docCount === 0) return "disabled";
        return reviewedDocCount === docCount && docCount > 0 ? "complete" :
               docCount > 0 ? "current" : "pending";
      case "transactions":
        if (docCount === 0) return "disabled";
        return transactionCount > 0 ? "complete" : "pending";
      case "export":
        if (transactionCount === 0) return "disabled";
        return "pending";
      case "report":
        return "pending";
      default:
        return "pending";
    }
  };

  // Get current step for "Continue" button
  const getCurrentWorkflowStep = (): WorkflowStep => {
    const docCount = project?._count?.documents || 0;

    if (docCount === 0) {
      return workflowSteps[0]; // Upload
    }
    if (reviewedDocCount < docCount) {
      return workflowSteps[1]; // Review
    }
    if (transactionCount === 0) {
      return workflowSteps[2]; // Transactions
    }
    if (!project?.coa) {
      return workflowSteps[4]; // Report & CoA
    }
    return workflowSteps[4]; // Report
  };

  const handleEditSave = async (data: {
    name: string;
    businessName: string;
    industry: string;
  }) => {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update project");
    }

    const updated = await response.json();
    setProject((prev) => (prev ? { ...prev, ...updated } : null));
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      addToast({
        title: "Project Deleted",
        message: "The project has been permanently deleted",
        variant: "success",
      });

      router.push("/projects");
    } catch (error) {
      addToast({
        title: "Error",
        message: "Failed to delete project",
        variant: "error",
      });
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-32 bg-slate-200 rounded" />
          <div className="h-48 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Project not found</p>
        <Button className="mt-4" onClick={() => router.push("/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const currentStep = getCurrentWorkflowStep();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <div className="flex items-center gap-2 mt-1 text-slate-500">
            <Building2 className="h-4 w-4" />
            <span>{project.businessName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditModal(true)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Continue Where You Left Off */}
      <Card className="border-teal-200 bg-teal-50/50">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                <currentStep.icon className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900">
                  Step {currentStep.number}: {currentStep.label}
                </h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  {currentStep.description}
                </p>
              </div>
            </div>
            <Button onClick={() => router.push(currentStep.href)}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Document Summary by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documents by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(documentsByCategory).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(documentsByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-slate-600">
                        {CATEGORY_LABELS[category as DocumentCategory] || category}
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        {count}
                      </span>
                    </div>
                  ))}
                <div className="border-t pt-3 flex items-center justify-between font-medium">
                  <span className="text-slate-900">Total Documents</span>
                  <span className="text-slate-900">
                    {project._count?.documents || 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm">No documents uploaded yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Documents Uploaded</span>
                <span className="text-sm font-medium text-slate-900">
                  {project._count?.documents || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Documents Reviewed</span>
                <span className="text-sm font-medium text-slate-900">
                  {reviewedDocCount} / {project._count?.documents || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Transactions Extracted</span>
                <span className="text-sm font-medium text-slate-900">
                  {transactionCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Chart of Accounts</span>
                <span className={cn(
                  "text-sm font-medium",
                  project.coa ? "text-emerald-600" : "text-slate-400"
                )}>
                  {project.coa ? `${project.coa.accounts?.length || 0} accounts` : "Not generated"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditSave}
        project={project}
      />

      {/* Delete Project Modal */}
      <DeleteProjectModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        projectName={project.name}
      />
    </div>
  );
}
