"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dropzone, FileList, type UploadFile } from "@/components/upload";
import { useToast } from "@/components/ui/toast";

interface Project {
  id: string;
  name: string;
  businessName: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isClassifying, setIsClassifying] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
          if (data.length > 0) {
            setSelectedProjectId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        addToast({
          message: "Failed to load projects",
          variant: "error",
        });
      } finally {
        setIsLoadingProjects(false);
      }
    }

    fetchProjects();
  }, [addToast]);

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
    formData.append("projectId", selectedProjectId);

    try {
      // Simulate progress updates
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
      // Start classification process
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId }),
      });

      if (!response.ok) {
        throw new Error("Failed to start classification");
      }

      addToast({
        message: "Classification started! Redirecting...",
        variant: "success",
      });

      // Redirect to documents page
      router.push(`/projects/${selectedProjectId}/documents`);
    } catch (error) {
      addToast({
        message: "Failed to start classification",
        variant: "error",
      });
      setIsClassifying(false);
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const uploadingCount = files.filter((f) => f.status === "uploading").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const allUploaded = files.length > 0 && pendingCount === 0 && uploadingCount === 0;

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: `${p.name} - ${p.businessName}`,
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload client documents for AI classification and organization
        </p>
      </div>

      {/* Project Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Project</CardTitle>
          <CardDescription>
            Choose an existing project or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProjects ? (
            <div className="h-10 bg-gray-100 rounded animate-pulse" />
          ) : projects.length > 0 ? (
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Select
                  options={projectOptions}
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  placeholder="Select a project..."
                />
              </div>
              <Link href="/projects/new">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                No projects yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create a project first to start uploading documents
              </p>
              <div className="mt-4">
                <Link href="/projects/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Area - only show if project selected */}
      {selectedProjectId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Files</CardTitle>
              <CardDescription>
                Drag and drop files or click to browse. Supported formats: PDF,
                JPG, PNG, XLSX, CSV
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
                        <Button
                          onClick={handleClassify}
                          isLoading={isClassifying}
                        >
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

          {/* Quick info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900">What happens next?</h3>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>1. Upload your client&apos;s documents</li>
              <li>2. Our AI will classify each document automatically</li>
              <li>3. Review and adjust classifications if needed</li>
              <li>4. Generate a Chart of Accounts based on the documents</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
