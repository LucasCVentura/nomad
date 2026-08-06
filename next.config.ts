import type { NextConfig } from "next";

// Cabeçalhos de segurança. A Vercel já manda HSTS por conta própria; o resto
// não vem de fábrica e precisa sair daqui.
//
// Não há CSP: a app usa estilo inline do Tailwind e o pdf.js monta worker em
// runtime, então uma CSP útil exigiria nonce em toda a árvore — trabalho que
// só compensa depois de medir o que realmente quebra. O `frame-ancestors`,
// que é a parte que protege contra clickjacking, está coberto pelo
// X-Frame-Options abaixo.
const securityHeaders = [
  // Impede que o site seja embutido num iframe de terceiro — sem isso dá para
  // sobrepor uma página invisível por cima e capturar cliques da aluna já
  // logada (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Barra o navegador de "adivinhar" o tipo de um arquivo servido: um upload
  // de imagem que na verdade é HTML não passa a ser executado como página.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Ao sair do site, manda só a origem — não o caminho completo. Sem isso, um
  // link a partir de /app/ler/<slug> entrega ao destino o que ela está lendo.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nada aqui usa câmera, microfone ou localização; negar por padrão evita que
  // um script de terceiro peça isso em nome do site.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
