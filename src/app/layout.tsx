import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Esquina — Inventario y Cuentas",
  description: "Bar de barrio — sistema de inventario, cuentas y ventas",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "La Esquina",
  },
};

export const viewport: Viewport = {
  themeColor: "#1c3829",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
