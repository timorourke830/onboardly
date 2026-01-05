import { Skeleton, SkeletonCoaTable } from "@/components/ui/skeleton";

export default function CoaLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-5" />
          <div>
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-white p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>

      {/* Table */}
      <SkeletonCoaTable />
    </div>
  );
}
