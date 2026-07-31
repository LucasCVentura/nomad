import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Manual NF",
    short_name: "Manual NF",
    description:
      "Materiais de estudo em estética profissional escritos pela Dra. Nathalia, com chat direto pra tirar dúvidas.",
    start_url: "/app",
    display: "standalone",
    background_color: "#1a1210",
    theme_color: "#1a1210",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
