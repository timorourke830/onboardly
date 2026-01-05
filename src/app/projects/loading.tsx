import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Skeleton className="h-10 w-full sm:w-64" />
        <Skeleton className="h-10 w-full sm:w-40" />
      </div>

      {/* Table */}
      <SkeletonTable rows={6} />
    </div>
  );
}
