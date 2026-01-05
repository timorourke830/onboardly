import { Skeleton, SkeletonStats, SkeletonProjectCard } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats */}
      <SkeletonStats />

      {/* Continue Section */}
      <div>
        <Skeleton className="h-6 w-56 mb-4" />
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonProjectCard />
          <SkeletonProjectCard />
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonProjectCard />
          <SkeletonProjectCard />
          <SkeletonProjectCard />
        </div>
      </div>
    </div>
  );
}
