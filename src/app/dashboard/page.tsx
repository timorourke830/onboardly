"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FolderOpen,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectCard, ProjectStatus, NewProjectModal } from "@/components/projects";

interface Project {
  id: string;
  name: string;
  businessName: string;
  status: ProjectStatus;
  createdAt: string;
  _count: {
    documents: number;
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

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

  // Calculate stats
  const totalProjects = projects.length;
  const totalDocuments = projects.reduce(
    (sum, p) => sum + (p._count?.documents || 0),
    0
  );
  const hoursEstimate = totalProjects * 3; // 3 hours saved per project

  // Get incomplete projects for quick actions
  const incompleteProjects = projects.filter(
    (p) => p.status !== "complete"
  );

  // Get recent projects (last 5)
  const recentProjects = projects.slice(0, 5);

  const stats = [
    {
      title: "Total Projects",
      value: totalProjects.toString(),
      icon: <FolderOpen className="h-5 w-5 text-blue-600" />,
      bgColor: "bg-blue-50",
    },
    {
      title: "Documents Processed",
      value: totalDocuments.toString(),
      icon: <FileText className="h-5 w-5 text-green-600" />,
      bgColor: "bg-green-50",
    },
    {
      title: "Hours Saved",
      value: hoursEstimate.toString(),
      icon: <Clock className="h-5 w-5 text-purple-600" />,
      bgColor: "bg-purple-50",
      suffix: "hrs",
    },
  ];

  const getNextAction = (project: Project) => {
    switch (project.status) {
      case "uploading":
        return { label: "Upload Documents", href: `/projects/${project.id}/upload` };
      case "classifying":
        return { label: "View Progress", href: `/projects/${project.id}/documents` };
      case "reviewing":
        return { label: "Review Documents", href: `/projects/${project.id}/documents` };
      default:
        return { label: "View Project", href: `/projects/${project.id}` };
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s an overview of your client onboarding projects.
          </p>
        </div>
        <Button onClick={() => setShowNewProjectModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Client Onboarding
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {stat.value}
                {stat.suffix && (
                  <span className="text-lg font-normal text-gray-500 ml-1">
                    {stat.suffix}
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions - Incomplete Projects */}
      {incompleteProjects.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Continue Where You Left Off
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {incompleteProjects.slice(0, 3).map((project) => {
              const action = getNextAction(project);
              return (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:border-indigo-200 transition-colors"
                  onClick={() => router.push(action.href)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {project.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {project.businessName}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" className="flex-shrink-0">
                        {action.label}
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Projects
          </h2>
          {projects.length > 5 && (
            <Link
              href="/projects"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View all projects
              <ArrowRight className="inline ml-1 h-4 w-4" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-5 bg-gray-200 rounded w-20" />
                      <div className="h-4 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recentProjects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                businessName={project.businessName}
                status={project.status as ProjectStatus}
                documentCount={project._count?.documents || 0}
                createdAt={project.createdAt}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-sm font-medium text-gray-900">
                  No projects yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new client onboarding project.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setShowNewProjectModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Client Onboarding
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />
    </div>
  );
}
