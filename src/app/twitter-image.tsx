import { ImageResponse } from "next/og";
import { OG_SIZE, OgImageContent } from "@/lib/og-image";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Manual NF — Dra. Nathalia Fialho";

export default function TwitterImage() {
  return new ImageResponse(<OgImageContent />, size);
}
