import Link from "next/link";
import { Logo } from "@/components/logo";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center px-6 py-16">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-130 opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(50% 55% at 50% 0%, oklch(0.72 0.13 5 / 45%), transparent 70%)",
        }}
      />
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 flex justify-center">
          <Logo withSignature />
        </Link>
        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-2xl shadow-black/30">
          <h1 className="font-heading text-2xl text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          <div className="mt-7">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  );
}
