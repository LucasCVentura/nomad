import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col px-6 py-16">
      <div className="mx-auto w-full max-w-6xl">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-4 h-10 w-80 max-w-full" />
        <Skeleton className="mt-4 h-4 w-full max-w-lg" />

        <div className="mt-10 flex flex-wrap gap-2">
          {["4rem", "5.5rem", "4.5rem", "6rem"].map((width, i) => (
            <Skeleton key={i} className="h-8 rounded-full" style={{ width }} />
          ))}
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col rounded-2xl border border-border/60 bg-card p-5"
            >
              <Skeleton className="mb-4 aspect-4/3 w-full rounded-lg" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-5 w-4/5" />
              <Skeleton className="mt-3 h-3 w-full" />
              <Skeleton className="mt-1.5 h-3 w-2/3" />
              <div className="mt-5 flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
