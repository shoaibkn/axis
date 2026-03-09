import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton({
  lines = 4,
  includeGrid = true,
}: {
  lines?: number;
  includeGrid?: boolean;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96" />
        {includeGrid ? (
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : null}
        <div className="space-y-2 rounded-lg border border-border p-4">
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </main>
  );
}
