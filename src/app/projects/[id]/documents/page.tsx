"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClassificationReview } from "@/components/documents";
import { useToast } from "@/components/ui/toast";
import type { DocumentCategory } from "@/types/document";

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  confidence: number;
  year?: number | null;
  isReviewed: boolean;
}

interface Project {
  id: string;
  name: string;
  businessName: string;
  status: string;
}

export default function ProjectDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { addToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClassifying, setIsClassifying] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }
        const data = await response.json();
        setProject(data);
        setDocuments(data.documents || []);
      } catch (error) {
        console.error("Error fetching project:", error);
        addToast({ message: "Failed to load project", variant: "error" });
        router.push("/projects");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [projectId, addToast, router]);

  const unclassifiedCount = documents.filter(
    (doc) => doc.category === "other" && doc.confidence === 0
  ).length;

  const handleClassifyAll = async () => {
    setIsClassifying(true);

    try {
      const response = await fetch("/api/classify/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error("Classification failed");
      }

      const data = await response.json();

      addToast({
        title: "Classification Complete",
        message: `Successfully classified ${data.success} of ${data.total} documents`,
        variant: "success",
      });

      // Refresh documents
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      const projectData = await projectResponse.json();
      setDocuments(projectData.documents || []);
      setProject(projectData);
    } catch (error) {
      addToast({
        message: "Failed to classify documents",
        variant: "error",
      });
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSaveChanges = async (
    updates: { id: string; category: DocumentCategory }[]
  ) => {
    // Update documents in parallel
    await Promise.all(
      updates.map((update) =>
        fetch(`/api/documents/${update.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: update.category,
            isReviewed: true,
          }),
        })
      )
    );

    // Update local state
    setDocuments((prev) =>
      prev.map((doc) => {
        const update = updates.find((u) => u.id === doc.id);
        if (update) {
          return { ...doc, category: update.category, isReviewed: true };
        }
        return doc;
      })
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${projectId}`}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Review Documents
            </h1>
            <p className="text-sm text-gray-500">
              {project?.name} - {project?.businessName}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {unclassifiedCount > 0 && (
            <Button
              onClick={handleClassifyAll}
              isLoading={isClassifying}
              variant="outline"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Classify {unclassifiedCount} Document
              {unclassifiedCount !== 1 && "s"}
            </Button>
          )}
          <Link href={`/projects/${projectId}/coa`}>
            <Button disabled={documents.length === 0}>
              Continue to Chart of Accounts
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Classification Status */}
      {isClassifying && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                Classifying Documents...
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Our AI is analyzing each document. This may take a few minutes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Documents */}
      {!isClassifying && documents.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No documents yet
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Upload documents to get started with classification.
              </p>
              <div className="mt-6">
                <Link href={`/projects/${projectId}/upload`}>
                  <Button>Upload Documents</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Review */}
      {!isClassifying && documents.length > 0 && (
        <ClassificationReview
          documents={documents}
          projectId={projectId}
          onSave={handleSaveChanges}
        />
      )}
    </div>
  );
}
