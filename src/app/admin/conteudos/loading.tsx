import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="grid gap-5 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card p-5">
            <Skeleton className="mb-3 size-9 rounded-lg" />
            <Skeleton className="h-7 w-12" />
            <Skeleton className="mt-2 h-4 w-28" />
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-56 rounded-xl" />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <Skeleton className="aspect-4/3 w-full rounded-none" />
            <div className="p-5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-5 w-4/5" />
              <Skeleton className="mt-1.5 h-3 w-24" />
              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-14" />
              </div>
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-8 flex-1 rounded-lg" />
                <Skeleton className="h-8 flex-1 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
