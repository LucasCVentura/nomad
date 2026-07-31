import { Skeleton } from "@/components/ui/skeleton";

// Serves both /app and /app/loja — they're the same shape, a grid of
// content cards.
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <Skeleton className="h-4 w-72 max-w-full" />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl border border-border/60 bg-card p-5"
          >
            <Skeleton className="mb-4 aspect-4/3 w-full rounded-lg" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-5 w-4/5" />
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <Skeleton className="mt-4 h-8 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
