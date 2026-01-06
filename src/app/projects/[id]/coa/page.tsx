"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * CoA page redirect
 * Chart of Accounts functionality has been merged into the Report page (Step 5).
 * This page redirects to maintain backwards compatibility with any existing links.
 */
export default function ChartOfAccountsRedirect() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  useEffect(() => {
    router.replace(`/projects/${projectId}/report`);
  }, [projectId, router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
        <p className="text-gray-500">Redirecting to Report & Chart of Accounts...</p>
      </div>
    </div>
  );
}
