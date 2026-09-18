"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/panel", label: "Bares" },
  { href: "/panel/usuarios", label: "Usuarios" },
  { href: "/panel/productos", label: "Qué se vende" },
  { href: "/panel/modulos", label: "Módulos" },
];

export function PanelNavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-line px-4 md:px-8">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-brand-500 text-ink"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
