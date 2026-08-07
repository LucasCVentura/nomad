import { MONOGRAM_F, MONOGRAM_N } from "@/components/logo-paths";

// Satori (o motor por trás de ImageResponse) não entende oklch() nem classes
// Tailwind — só cor sólida em atributo/estilo inline. Valores abaixo são os
// tokens de globals.css convertidos pra hex via canvas (renderiza o oklch de
// verdade e lê o pixel, em vez de confiar em regex sobre a string bruta).
const GOLD = "#cfb384";
const ROSE = "#e8809a";
const BG = "#120b0a";
const FG = "#f9f5ee";

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * O card de compartilhamento (WhatsApp, Telegram, etc.) — sem isso, o
 * crawler pega a primeira imagem grande da home, que era a foto da Dra.
 *
 * Mesma hierarquia de três níveis já usada nos e-mails transacionais e no
 * lockup vertical (scripts/build-brand.py): marca, nome, categoria, divisor,
 * assinatura. O monograma usa os mesmos paths do componente `Logomark`, só
 * com preenchimento sólido em vez de `currentColor` — Satori não herda cor
 * do CSS.
 */
export function OgImageContent() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: BG,
      }}
    >
      <svg width={132} height={132} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="34" fill="none" stroke={GOLD} strokeWidth="1.7" />
        <path d={MONOGRAM_N} fill={GOLD} />
        <path d={MONOGRAM_F} fill={ROSE} />
      </svg>

      <div
        style={{
          marginTop: 36,
          fontSize: 64,
          fontWeight: 600,
          letterSpacing: 12,
          color: FG,
        }}
      >
        MANUAL NF
      </div>

      <div
        style={{
          marginTop: 18,
          fontSize: 22,
          letterSpacing: 8,
          color: FG,
          opacity: 0.8,
        }}
      >
        ESTÉTICA AVANÇADA
      </div>

      <div style={{ display: "flex", width: 120, height: 1, backgroundColor: GOLD, opacity: 0.6, marginTop: 26, marginBottom: 26 }} />

      <div
        style={{
          fontSize: 20,
          letterSpacing: 6,
          color: GOLD,
        }}
      >
        DRA. NATHALIA FIALHO
      </div>
    </div>
  );
}
