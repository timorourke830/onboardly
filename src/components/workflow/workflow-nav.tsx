"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkflowNavProps {
  projectId: string;
  currentStep: "upload" | "review" | "transactions" | "export" | "report";
  nextDisabled?: boolean;
  nextDisabledReason?: string;
}

const WORKFLOW_STEPS = [
  { id: "upload", label: "Upload Documents", path: "upload" },
  { id: "review", label: "Review Documents", path: "documents" },
  { id: "transactions", label: "Extract Transactions", path: "transactions" },
  { id: "export", label: "Export Transactions", path: "export" },
  { id: "report", label: "Report & Chart of Accounts", path: "report" },
] as const;

export function WorkflowNav({
  projectId,
  currentStep,
  nextDisabled = false,
  nextDisabledReason,
}: WorkflowNavProps) {
  const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.id === currentStep);
  const prevStep = currentIndex > 0 ? WORKFLOW_STEPS[currentIndex - 1] : null;
  const nextStep = currentIndex < WORKFLOW_STEPS.length - 1 ? WORKFLOW_STEPS[currentIndex + 1] : null;

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Previous Step */}
        <div>
          {prevStep ? (
            <Link
              href={`/projects/${projectId}/${prevStep.path}`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back: {prevStep.label}
            </Link>
          ) : (
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Overview
            </Link>
          )}
        </div>

        {/* Next Step */}
        <div className="flex flex-col items-end">
          {nextStep && (
            <>
              {nextDisabled ? (
                <div className="text-right">
                  <Button disabled className="opacity-50 cursor-not-allowed">
                    Next: {nextStep.label}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  {nextDisabledReason && (
                    <p className="text-xs text-amber-600 mt-1">
                      {nextDisabledReason}
                    </p>
                  )}
                </div>
              ) : (
                <Link href={`/projects/${projectId}/${nextStep.path}`}>
                  <Button>
                    Next: {nextStep.label}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </>
          )}
          {!nextStep && currentStep === "report" && (
            <Link href="/projects">
              <Button>
                Complete & Return to Projects
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
