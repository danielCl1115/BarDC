import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventario y Cuentas",
  description: "Sistema de inventario, cuentas y ventas",
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
