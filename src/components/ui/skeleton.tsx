import { cn } from "@/lib/utils";

// One placeholder block. Compose these into the shape of the screen that's
// loading (see the loading.tsx files) rather than reaching for a spinner.
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div aria-hidden className={cn("skeleton rounded-md", className)} style={style} />;
}
