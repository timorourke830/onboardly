"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FolderOpen,
  Search,
  FileText,
  ChevronRight,
  Filter,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge, ProjectStatus, NewProjectModal, DeleteProjectModal } from "@/components/projects";

interface Project {
  id: string;
  name: string;
  businessName: string;
  status: ProjectStatus;
  industry: string;
  createdAt: string;
  _count: {
    documents: number;
  };
}

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "uploading", label: "Uploading" },
  { value: "classifying", label: "Classifying" },
  { value: "reviewing", label: "Reviewing" },
  { value: "complete", label: "Complete" },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    const response = await fetch(`/api/projects/${projectToDelete.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setProjects(projects.filter((p) => p.id !== projectToDelete.id));
      setProjectToDelete(null);
    } else {
      console.error("Failed to delete project");
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        searchTerm === "" ||
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.businessName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage all your client onboarding projects
          </p>
        </div>
        <Button onClick={() => setShowNewProjectModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search by project or business name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_FILTER_OPTIONS}
            className="w-40"
          />
        </div>
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-slate-500">
          Showing {filteredProjects.length} of {projects.length} projects
        </p>
      )}

      {/* Projects table/cards or empty state */}
      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-50 border-b hidden md:block" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 border-b flex items-center px-4 gap-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                  <div className="h-4 bg-gray-200 rounded w-12" />
                  <div className="h-4 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredProjects.length > 0 ? (
        <>
          {/* Mobile card view */}
          <div className="space-y-3 md:hidden">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:border-teal-200 hover:shadow-sm transition-all group"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 shrink-0">
                        <FolderOpen className="h-5 w-5 text-teal-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-slate-900 truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-slate-500 truncate">
                          {project.businessName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(project);
                        }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <StatusBadge status={project.status} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4" />
                      <span>{project._count?.documents || 0} docs</span>
                    </div>
                    <span>{formatDate(project.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table view */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                            <FolderOpen className="h-4 w-4 text-teal-600" />
                          </div>
                          <span className="font-medium text-slate-900">
                            {project.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {project.businessName}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={project.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <FileText className="h-4 w-4" />
                          {project._count?.documents || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatDate(project.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete(project);
                            }}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Delete project"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-medium text-slate-900">
                No projects yet
              </h3>
              <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                Create your first project to start organizing client documents
                and generating a Chart of Accounts.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowNewProjectModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Project
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Search className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-medium text-slate-900">
                No matching projects
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try adjusting your search or filter criteria
              </p>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />

      {/* Delete Project Modal */}
      <DeleteProjectModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteProject}
        projectName={projectToDelete?.name || ""}
      />
    </div>
  );
}
