import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card p-5">
            <Skeleton className="mb-3 size-9 rounded-lg" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border/60 bg-card p-5">
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-4"
            >
              <Skeleton className="size-6 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-1/2 max-w-56" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
              <div className="shrink-0 text-right">
                <Skeleton className="ml-auto h-4 w-14" />
                <Skeleton className="mt-2 ml-auto h-3 w-10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
