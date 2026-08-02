import { cn } from "@/lib/utils";

/**
 * Anel em ouro com o monograma NF.
 *
 * O monograma é <text> dentro do próprio SVG, e não um span ao lado: assim ele
 * escala junto com o anel em qualquer tamanho, sem recalcular o corpo da fonte
 * a cada uso. N e F são ambos angulares e de haste vertical, então sobrepô-los
 * faz o F sumir dentro do N — é a cor que separa as duas letras, não a forma.
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
      {/* 40 = 40% do diâmetro; acima de ~44 as serifas encostam no anel. */}
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="40"
        style={{ fontFamily: "var(--font-bodoni)" }}
      >
        <tspan fill="currentColor">N</tspan>
        <tspan dx="-4" className="fill-rose">
          F
        </tspan>
      </text>
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
