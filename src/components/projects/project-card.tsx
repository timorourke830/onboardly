"use client";

import { useRouter } from "next/navigation";
import { Folder, FileText, Calendar, ChevronRight, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, ProjectStatus } from "./status-badge";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  id: string;
  name: string;
  businessName: string;
  status: ProjectStatus;
  documentCount: number;
  createdAt: string | Date;
  className?: string;
  onDelete?: () => void;
}

export function ProjectCard({
  id,
  name,
  businessName,
  status,
  documentCount,
  createdAt,
  className,
  onDelete,
}: ProjectCardProps) {
  const router = useRouter();

  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-teal-200 group",
        className
      )}
      onClick={() => router.push(`/projects/${id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50">
              <Folder className="h-5 w-5 text-teal-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-slate-900 truncate">{name}</h3>
              <p className="text-sm text-slate-500 truncate">{businessName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all"
                title="Delete project"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <StatusBadge status={status} />
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {documentCount}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
