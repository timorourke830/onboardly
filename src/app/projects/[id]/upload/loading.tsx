import { Skeleton } from "@/components/ui/skeleton";

export default function UploadLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-5" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Upload Zone */}
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <Skeleton className="h-16 w-16 rounded-full mb-4" />
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-48 mb-4" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* File List */}
      <div className="rounded-lg border bg-white p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Skeleton className="h-8 w-8" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
