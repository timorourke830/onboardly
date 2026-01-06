"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileSearch,
  DollarSign,
  Download,
  ClipboardList,
  Check,
  ArrowLeft,
  Menu,
  X,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  businessName: string;
  status: string;
  _count?: {
    documents: number;
  };
}

interface Transaction {
  id: string;
}

interface WorkflowStep {
  id: string;
  number: number;
  label: string;
  shortLabel: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [transactionCount, setTransactionCount] = useState(0);
  const [hasCoA, setHasCoA] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Define workflow steps
  const workflowSteps: WorkflowStep[] = [
    {
      id: "upload",
      number: 1,
      label: "Upload Documents",
      shortLabel: "Upload",
      href: `/projects/${projectId}/upload`,
      icon: Upload,
      description: "Upload client documents",
    },
    {
      id: "review",
      number: 2,
      label: "Review Documents",
      shortLabel: "Review",
      href: `/projects/${projectId}/documents`,
      icon: FileSearch,
      description: "Review AI classifications",
    },
    {
      id: "transactions",
      number: 3,
      label: "Extract Transactions",
      shortLabel: "Transactions",
      href: `/projects/${projectId}/transactions`,
      icon: DollarSign,
      description: "Extract transaction data",
    },
    {
      id: "export",
      number: 4,
      label: "Export Transactions",
      shortLabel: "Export",
      href: `/projects/${projectId}/export`,
      icon: Download,
      description: "Export transaction data",
    },
    {
      id: "report",
      number: 5,
      label: "Report & Chart of Accounts",
      shortLabel: "Report & CoA",
      href: `/projects/${projectId}/report`,
      icon: ClipboardList,
      description: "Generate final deliverables",
    },
  ];

  // Load project data
  useEffect(() => {
    async function loadData() {
      try {
        const [projectRes, transRes, coaRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/extract-transactions?projectId=${projectId}`),
          fetch(`/api/coa/${projectId}`),
        ]);

        if (projectRes.ok) {
          const projectData = await projectRes.json();
          setProject(projectData);
        }

        if (transRes.ok) {
          const transData = await transRes.json();
          setTransactionCount(transData.transactions?.length || 0);
        }

        setHasCoA(coaRes.ok);
      } catch (error) {
        console.error("Error loading project data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [projectId]);

  // Get current step based on pathname
  const getCurrentStep = () => {
    if (pathname.endsWith("/upload")) return "upload";
    if (pathname.endsWith("/documents")) return "review";
    if (pathname.endsWith("/transactions")) return "transactions";
    if (pathname.endsWith("/export")) return "export";
    if (pathname.endsWith("/report")) return "report";
    if (pathname.endsWith("/coa")) return "report"; // Redirect CoA to report
    return null;
  };

  const currentStep = getCurrentStep();
  const currentStepIndex = workflowSteps.findIndex((s) => s.id === currentStep);

  // Determine step status
  const getStepStatus = (step: WorkflowStep) => {
    const docCount = project?._count?.documents || 0;

    switch (step.id) {
      case "upload":
        return docCount > 0 ? "complete" : "current";
      case "review":
        return docCount === 0 ? "disabled" :
               currentStepIndex > 1 ? "complete" :
               currentStep === "review" ? "current" : "available";
      case "transactions":
        return docCount === 0 ? "disabled" :
               transactionCount > 0 ? "complete" :
               currentStep === "transactions" ? "current" : "available";
      case "export":
        return transactionCount === 0 ? "disabled" :
               currentStepIndex > 3 ? "complete" :
               currentStep === "export" ? "current" : "available";
      case "report":
        return currentStep === "report" ? "current" : "available";
      default:
        return "available";
    }
  };

  // Check if step should show warning
  const getStepWarning = (step: WorkflowStep) => {
    const docCount = project?._count?.documents || 0;

    switch (step.id) {
      case "transactions":
        return docCount === 0 ? "Upload documents first" : null;
      case "export":
        return transactionCount === 0 ? "Extract transactions first" : null;
      case "report":
        return docCount === 0 ? "Upload documents first" : null;
      default:
        return null;
    }
  };

  // Handle step click
  const handleStepClick = (step: WorkflowStep, e: React.MouseEvent) => {
    const status = getStepStatus(step);
    if (status === "disabled") {
      e.preventDefault();
      return;
    }
    setIsMobileSidebarOpen(false);
  };

  const isOverviewPage = pathname === `/projects/${projectId}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="truncate">
              <p className="font-medium text-gray-900 truncate">
                {project?.name || "Loading..."}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {project?.businessName}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            {isMobileSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-72 bg-white border-r border-gray-200 transition-transform duration-300",
            "lg:translate-x-0",
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Sidebar Header */}
          <div className="hidden lg:block p-4 border-b border-gray-200">
            <Link
              href="/projects"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-3"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Projects</span>
            </Link>
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ) : (
              <div>
                <h2 className="font-semibold text-gray-900 truncate">
                  {project?.name}
                </h2>
                <p className="text-sm text-gray-500 truncate">
                  {project?.businessName}
                </p>
              </div>
            )}
          </div>

          {/* Workflow Steps */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-120px)]">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
              Workflow
            </p>

            {/* Overview Link */}
            <Link
              href={`/projects/${projectId}`}
              onClick={() => setIsMobileSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isOverviewPage
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                  isOverviewPage
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-500"
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </div>
              <span>Overview</span>
            </Link>

            <div className="h-px bg-gray-200 my-3" />

            {/* Workflow Steps */}
            {workflowSteps.map((step) => {
              const Icon = step.icon;
              const status = getStepStatus(step);
              const warning = getStepWarning(step);
              const isActive = currentStep === step.id;
              const isDisabled = status === "disabled";
              const isComplete = status === "complete";

              return (
                <Link
                  key={step.id}
                  href={step.href}
                  onClick={(e) => handleStepClick(step, e)}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive && "bg-indigo-50 text-indigo-700 font-medium",
                    !isActive && !isDisabled && "text-gray-600 hover:bg-gray-100",
                    isDisabled && "text-gray-400 cursor-not-allowed"
                  )}
                >
                  {/* Step Number Circle */}
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                      isComplete && "bg-green-100 text-green-700",
                      isActive && "bg-indigo-600 text-white",
                      !isComplete && !isActive && !isDisabled && "bg-gray-100 text-gray-500 group-hover:bg-gray-200",
                      isDisabled && "bg-gray-50 text-gray-300"
                    )}
                  >
                    {isComplete ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      step.number
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">{step.shortLabel}</span>
                    {warning && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                        <AlertCircle className="h-3 w-3" />
                        {warning}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
            <div className="text-xs text-gray-500">
              <p className="font-medium text-gray-700 mb-1">Quick Stats</p>
              <p>{project?._count?.documents || 0} documents</p>
              <p>{transactionCount} transactions</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 lg:ml-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
