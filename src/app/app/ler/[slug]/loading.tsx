import { Skeleton } from "@/components/ui/skeleton";

// Line widths that read like justified body copy: full-width lines with a
// short one closing each paragraph, so the placeholder page looks like a
// page of text instead of a stack of identical bars.
const PARAGRAPHS = [
  ["100%", "97%", "99%", "94%", "62%"],
  ["98%", "100%", "96%", "45%"],
  ["100%", "95%", "98%", "99%", "78%"],
  ["97%", "100%", "93%", "56%"],
];

function PageSkeleton() {
  return (
    // Roughly A4 portrait — the same proportion the real page images use,
    // so the card doesn't visibly resize when they load in.
    <div className="aspect-[0.77] w-full overflow-hidden rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8">
      <Skeleton className="mx-auto h-5 w-1/2" />
      <div className="mt-8 space-y-6">
        {PARAGRAPHS.map((lines, p) => (
          <div key={p} className="space-y-2.5">
            {lines.map((width, i) => (
              <Skeleton key={i} className="h-2.5" style={{ width }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <Skeleton className="h-5 w-40 sm:w-64" />
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Skeleton className="hidden h-2 w-28 rounded-full sm:block" />
          <Skeleton className="h-8 w-20 rounded-lg sm:w-28" />
          <Skeleton className="hidden h-8 w-44 rounded-lg sm:block" />
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="mx-auto w-full max-w-2xl px-6 py-12">
          <div className="rounded-3xl border border-border/60 bg-card/40 p-8 sm:p-12">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-3/4" />
            <Skeleton className="mt-6 h-4 w-full max-w-sm" />
            <div className="mt-8 space-y-7">
              <PageSkeleton />
              <PageSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
