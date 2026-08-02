import { cn } from "@/lib/utils";
import { MONOGRAM_F, MONOGRAM_N } from "@/components/logo-paths";

/**
 * Anel em ouro com o monograma NF.
 *
 * O monograma é contorno, e não <text>: webfont dentro de SVG não é confiável
 * no Safari — se nada mais na página usar a fonte, ele pode nem baixá-la, e o
 * logo sai quebrado no iPhone. Em contorno o desenho independe de fonte
 * carregada, e o site deixa de precisar da Bodoni.
 *
 * Os traçados vêm de scripts/build-brand.py, o mesmo que gera os PNGs da
 * marca, para não existirem duas cópias do desenho.
 */
export function Logomark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-9", className)}
      aria-hidden
    >
      <circle
        cx="50"
        cy="50"
        r="34"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      {/* N e F são ambos angulares e de haste vertical: sobrepô-los faz o F
          sumir dentro do N, então é a cor que separa as duas letras. */}
      <path d={MONOGRAM_N} fill="currentColor" />
      <path d={MONOGRAM_F} className="fill-rose" />
    </svg>
  );
}

/**
 * Lockup horizontal. `withSignature` acrescenta a assinatura da Dra. abaixo do
 * nome — cabe no rodapé e nas telas de acesso, mas na altura de um cabeçalho
 * ficaria pequena demais para ser legível.
 */
export function Logo({
  className,
  withSignature = false,
}: {
  className?: string;
  withSignature?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Logomark className="size-10 shrink-0 text-gold" />
      <span className="grid gap-1">
        <span
          className="text-lg leading-none tracking-[0.17em] text-foreground"
          style={{ fontFamily: "var(--font-oswald)" }}
        >
          MANUAL NF
        </span>
        {withSignature && (
          <span
            className="text-[0.5rem] leading-none tracking-[0.28em] text-gold"
            style={{ fontFamily: "var(--font-jost)" }}
          >
            DRA. NATHALIA FIALHO
          </span>
        )}
      </span>
    </span>
  );
}
