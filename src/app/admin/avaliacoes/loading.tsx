import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex items-center gap-6 rounded-2xl border border-border/60 bg-card p-5">
        <div>
          <Skeleton className="h-8 w-12" />
          <Skeleton className="mt-2 h-3.5 w-24" />
        </div>
        <Skeleton className="h-4 w-40" />
      </div>

      <Skeleton className="mt-8 mb-3 h-6 w-32" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-1.5 h-4 w-2/3" />
            <Skeleton className="mt-3 h-3 w-44" />
          </div>
        ))}
      </div>
    </div>
  );
}
