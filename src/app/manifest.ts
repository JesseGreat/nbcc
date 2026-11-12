import type { MetadataRoute } from "next";
import { ORG } from "@/lib/config";

/** Installable PWA (no offline caching, by design). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: ORG.portalName,
    short_name: ORG.shortName,
    description: `Membership portal for the ${ORG.name}`,
    start_url: "/member",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F8FA",
    theme_color: "#0B2545",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
