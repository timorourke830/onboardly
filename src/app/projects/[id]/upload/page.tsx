"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dropzone, FileList, type UploadFile } from "@/components/upload";
import { useToast } from "@/components/ui/toast";

interface Project {
  id: string;
  name: string;
  businessName: string;
}

export default function ProjectUploadPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { addToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClassifying, setIsClassifying] = useState(false);

  // Fetch project on mount
  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setProject(data);
        } else {
          addToast({
            message: "Project not found",
            variant: "error",
          });
          router.push("/projects");
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
  }, [projectId, addToast, router]);

  // Handle files added from dropzone
  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      status: "pending" as const,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...uploadFiles]);
  }, []);

  // Remove a file from the list
  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Upload a single file
  const uploadSingleFile = async (uploadFile: UploadFile): Promise<void> => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id ? { ...f, status: "uploading" as const, progress: 0 } : f
      )
    );

    const formData = new FormData();
    formData.append("file", uploadFile.file);
    formData.append("projectId", projectId);

    try {
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id && f.status === "uploading"
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "success" as const,
                progress: 100,
                documentId: data.id,
                url: data.fileUrl,
              }
            : f
        )
      );
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "error" as const,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );
    }
  };

  // Upload all pending files
  const handleUploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");

    for (const file of pendingFiles) {
      await uploadSingleFile(file);
    }
  };

  // Start classification and redirect
  const handleClassify = async () => {
    setIsClassifying(true);

    try {
      // Use batch endpoint to classify all documents in the project
      const response = await fetch("/api/classify/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to start classification");
      }

      const result = await response.json();

      addToast({
        title: "Classification Complete",
        message: `Successfully classified ${result.success} of ${result.total} documents`,
        variant: "success",
      });

      router.push(`/projects/${projectId}/documents`);
    } catch (error) {
      console.error("Classification error:", error);
      addToast({
        title: "Classification Failed",
        message: error instanceof Error ? error.message : "Failed to classify documents",
        variant: "error",
      });
      setIsClassifying(false);
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const uploadingCount = files.filter((f) => f.status === "uploading").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const allUploaded = files.length > 0 && pendingCount === 0 && uploadingCount === 0;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/projects/${projectId}`}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
          <p className="text-sm text-gray-500">
            {project?.name} - {project?.businessName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Files</CardTitle>
          <CardDescription>
            Drag and drop files or click to browse. Supported formats: PDF, JPG,
            PNG, XLSX, CSV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Dropzone
            onFilesAdded={handleFilesAdded}
            disabled={uploadingCount > 0}
          />

          {files.length > 0 && (
            <>
              <FileList files={files} onRemove={handleRemoveFile} />

              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  {successCount} of {files.length} files uploaded
                </div>

                <div className="flex gap-3">
                  {pendingCount > 0 && (
                    <Button
                      onClick={handleUploadAll}
                      disabled={uploadingCount > 0}
                      isLoading={uploadingCount > 0}
                    >
                      Upload {pendingCount} File{pendingCount !== 1 && "s"}
                    </Button>
                  )}

                  {allUploaded && (
                    <Button onClick={handleClassify} isLoading={isClassifying}>
                      Classify Documents
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900">What happens next?</h3>
        <ul className="mt-2 text-sm text-blue-700 space-y-1">
          <li>1. Upload your client&apos;s documents</li>
          <li>2. Our AI will classify each document automatically</li>
          <li>3. Review and adjust classifications if needed</li>
          <li>4. Generate a Chart of Accounts based on the documents</li>
        </ul>
      </div>
    </div>
  );
}
