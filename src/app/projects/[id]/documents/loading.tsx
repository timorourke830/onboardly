import { Skeleton, SkeletonDocumentCard } from "@/components/ui/skeleton";

export default function DocumentsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-5" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Skeleton className="h-10 w-full sm:w-64" />
        <Skeleton className="h-10 w-full sm:w-40" />
        <Skeleton className="h-10 w-full sm:w-40" />
      </div>

      {/* Document Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonDocumentCard key={i} />
        ))}
      </div>
    </div>
  );
}
