import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function ProjectDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Skeleton className="h-5 w-5 mt-1" />
          <div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-16 mt-2" />
              </div>
              {i < 3 && <Skeleton className="h-0.5 w-full -mt-6" />}
            </div>
          ))}
        </div>
      </div>

      {/* Action Section */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
    </div>
  );
}
