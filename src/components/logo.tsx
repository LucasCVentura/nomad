import { cn } from "@/lib/utils";

export function Logomark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8", className)}
    >
      <circle cx="20" cy="20" r="19" stroke="currentColor" strokeOpacity="0.35" />
      <path
        d="M13 27V13.6a.6.6 0 0 1 1.02-.43L26 24.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M26 13v11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M26 13.2h7.4" className="stroke-rose" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M26 18.7h5.2" className="stroke-rose" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Logomark className="text-gold" />
      <span className="font-heading text-xl tracking-tight text-foreground">
        Manual NF
      </span>
    </span>
  );
}
