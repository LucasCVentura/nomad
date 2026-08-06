import type { Metadata, Viewport } from "next";
import { Geist_Mono, Jost, Oswald, Roboto } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { CartProvider } from "@/lib/cart-context";
import { CartDrawer } from "@/components/cart-drawer";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// As faces do logo. Só ele as usa, então ficam fora de --font-heading e são
// aplicadas pontualmente em components/logo.tsx. O monograma NF não entra aqui:
// é contorno, gerado por scripts/build-brand.py.
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Manual NF — Estética & Beleza",
  description:
    "Materiais de estudo em estética profissional escritos pela Dra. Nathalia, com chat direto pra tirar dúvidas.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Manual NF",
  },
};

// viewport-fit=cover is what actually makes env(safe-area-inset-*) resolve
// to non-zero values — without it the bottom tab bar's safe-area padding is
// a no-op and content can sit under the home-indicator on notched phones.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1a1210",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${roboto.variable} ${geistMono.variable} ${oswald.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
