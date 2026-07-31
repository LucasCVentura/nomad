import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border/60">
        <div className="flex items-center gap-4 border-b border-border/60 bg-card/60 px-5 py-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 border-b border-border/60 px-5 py-4 last:border-0"
          >
            <Skeleton className="h-4 w-1/3 max-w-56" />
            <Skeleton className="hidden h-4 w-20 sm:block" />
            <Skeleton className="hidden h-4 w-16 sm:block" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
