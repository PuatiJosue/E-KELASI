import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "E-KLASS",
    short_name: "E-KLASS",
    description: "Suivi scolaire — écoles, professeurs et parents.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#1E2F6D",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
