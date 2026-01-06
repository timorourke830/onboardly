"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Eye,
  FileCheck,
  Download,
  Plus,
  Settings,
  Trash2,
  FileText,
  Building2,
  Check,
  DollarSign,
  ClipboardList,
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

const STATUS_STEPS: { key: ProjectStatus; label: string; icon: React.ElementType }[] = [
  { key: "uploading", label: "Upload", icon: Upload },
  { key: "classifying", label: "Classify", icon: FileText },
  { key: "reviewing", label: "Review", icon: FileCheck },
  { key: "complete", label: "Export", icon: Download },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setProject(data);
        } else if (response.status === 404) {
          router.push("/projects");
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
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

  const currentStepIndex = STATUS_STEPS.findIndex(
    (step) => step.key === project?.status
  );

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

  const getActionButton = () => {
    if (!project) return null;

    switch (project.status) {
      case "uploading":
        return (
          <Button onClick={() => router.push(`/projects/${projectId}/upload`)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Documents
          </Button>
        );
      case "classifying":
        return (
          <Button onClick={() => router.push(`/projects/${projectId}/documents`)}>
            <Eye className="mr-2 h-4 w-4" />
            View Progress
          </Button>
        );
      case "reviewing":
        return (
          <Button onClick={() => router.push(`/projects/${projectId}/documents`)}>
            <FileCheck className="mr-2 h-4 w-4" />
            Review Documents
          </Button>
        );
      case "complete":
        return (
          <div className="flex gap-2">
            <Button onClick={() => router.push(`/projects/${projectId}/export`)}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={() => router.push("/projects/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Start New Project
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
        <Button className="mt-4" onClick={() => router.push("/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/projects"
            className="mt-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <div className="flex items-center gap-2 mt-1 text-gray-500">
              <Building2 className="h-4 w-4" />
              <span>{project.businessName}</span>
            </div>
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

      {/* Status Progress Bar */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isComplete = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                        isComplete && "bg-green-500 border-green-500",
                        isCurrent && "bg-indigo-500 border-indigo-500",
                        isPending && "bg-white border-gray-300"
                      )}
                    >
                      {isComplete ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : (
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            isCurrent ? "text-white" : "text-gray-400"
                          )}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-2 text-sm font-medium",
                        isComplete || isCurrent ? "text-gray-900" : "text-gray-400"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 w-full -mt-6",
                        index < currentStepIndex ? "bg-green-500" : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Section */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-gray-900">
                {project.status === "uploading" && "Upload your client's documents"}
                {project.status === "classifying" && "Documents are being classified"}
                {project.status === "reviewing" && "Review classified documents"}
                {project.status === "complete" && "Ready to export"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {project.status === "uploading" &&
                  "Add bank statements, invoices, receipts, and other financial documents"}
                {project.status === "classifying" &&
                  "AI is analyzing and categorizing your documents"}
                {project.status === "reviewing" &&
                  "Verify document classifications before generating the Chart of Accounts"}
                {project.status === "complete" &&
                  "Export your Chart of Accounts to QuickBooks, Xero, or other platforms"}
              </p>
            </div>
            {getActionButton()}
          </div>
        </CardContent>
      </Card>

      {/* Document Summary & Quick Links */}
      <div className="grid gap-6 md:grid-cols-2">
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
                      <span className="text-sm text-gray-600">
                        {CATEGORY_LABELS[category as DocumentCategory] || category}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {count}
                      </span>
                    </div>
                  ))}
                <div className="border-t pt-3 flex items-center justify-between font-medium">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">
                    {project._count?.documents || 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm">No documents uploaded yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                href={`/projects/${projectId}/upload`}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Upload Documents
                  </span>
                </div>
                <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180" />
              </Link>
              <Link
                href={`/projects/${projectId}/documents`}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    View Documents
                  </span>
                </div>
                <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180" />
              </Link>
              <Link
                href={`/projects/${projectId}/coa`}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Chart of Accounts
                  </span>
                </div>
                <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180" />
              </Link>
              <Link
                href={`/projects/${projectId}/transactions`}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Transactions
                  </span>
                </div>
                <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180" />
              </Link>
              <Link
                href={`/projects/${projectId}/export`}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Export
                  </span>
                </div>
                <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180" />
              </Link>
              <Link
                href={`/projects/${projectId}/report`}
                className="flex items-center justify-between p-3 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-700">
                    Onboarding Report
                  </span>
                </div>
                <ArrowLeft className="h-4 w-4 text-indigo-400 rotate-180" />
              </Link>
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
