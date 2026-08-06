import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="grid gap-5 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card p-5">
            <Skeleton className="mb-3 size-9 rounded-lg" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-8 mb-3 h-10 w-full" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="mt-2 h-3.5 w-2/3" />
              <Skeleton className="mt-2 h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
