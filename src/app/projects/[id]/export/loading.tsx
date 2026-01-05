import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function ExportLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-5" />
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>

      {/* Summary Card */}
      <div className="rounded-lg border bg-white p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-5 w-28" />
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} className="h-72" />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  );
}
