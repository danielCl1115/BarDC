import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "La Esquina — Inventario y Cuentas",
    short_name: "La Esquina",
    description: "Bar de barrio — inventario, cuentas y ventas",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f4ecd8",
    theme_color: "#1c3829",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
