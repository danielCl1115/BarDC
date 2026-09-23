import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stockeo — Inventario y Ventas para tu Negocio",
  description: "Software de inventario, cuentas y ventas para tiendas y negocios pequeños",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stockeo",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f7fb",
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
