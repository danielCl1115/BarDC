"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { Icon, type IconName } from "@/components/icons";
import { LogoMark } from "@/components/logo";
import type { Rol } from "@/lib/types";

const LINKS: { href: string; label: string; icon: IconName; roles: Rol[] }[] = [
  { href: "/dashboard", label: "Inicio", icon: "home", roles: ["admin", "operador"] },
  { href: "/cuentas", label: "Cuentas", icon: "receipt", roles: ["admin", "operador"] },
  { href: "/productos", label: "Productos", icon: "box", roles: ["admin"] },
  { href: "/compras", label: "Compras", icon: "truck", roles: ["admin"] },
  { href: "/inventario", label: "Inventario", icon: "layers", roles: ["admin"] },
  { href: "/reportes", label: "Reportes", icon: "chart", roles: ["admin"] },
  { href: "/historial", label: "Historial", icon: "clock", roles: ["admin"] },
  { href: "/usuarios", label: "Usuarios", icon: "users", roles: ["admin"] },
];

export function Nav({
  nombre,
  rol,
  barNombre,
}: {
  nombre: string;
  rol: Rol;
  barNombre: string;
}) {
  const pathname = usePathname();
  const links = LINKS.filter((l) => l.roles.includes(rol));
  const inicial = nombre.trim().charAt(0).toUpperCase() || "?";

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-line bg-surface print:hidden md:h-dvh md:w-60 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <LogoMark size={34} className="shrink-0" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink">{barNombre}</div>
          <div className="truncate text-[11px] font-medium uppercase tracking-wider text-brand-600">
            Stockeo
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-wrap gap-0.5 overflow-y-auto px-2 pb-2 md:flex-col">
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-2 hover:bg-plane hover:text-ink"
              }`}
            >
              <Icon
                name={l.icon}
                className={active ? "text-brand-600" : "text-ink-3 group-hover:text-ink-2"}
              />
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-line px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/8 text-xs font-semibold text-ink-2">
          {inicial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink">{nombre}</div>
          <div className="text-xs text-ink-3">
            {rol === "admin" ? "Administrador" : "Operador"}
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            title="Cerrar sesión"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 hover:bg-plane hover:text-ink"
          >
            <Icon name="logout" size={17} />
          </button>
        </form>
      </div>
    </aside>
  );
}
