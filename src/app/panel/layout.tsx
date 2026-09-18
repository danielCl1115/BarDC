import { requireSuperAdmin } from "@/lib/super-admin";
import { logout } from "@/app/login/actions";
import { LogoMark } from "@/components/logo";
import { Icon } from "@/components/icons";
import { ToastProvider } from "@/components/toast";
import { PanelNavTabs } from "./nav-tabs";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();

  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col">
        <div className="bg-surface">
          <header className="flex items-center justify-between px-4 py-4 md:px-8">
            <div className="flex items-center gap-2.5">
              <LogoMark size={30} />
              <div>
                <div className="text-sm font-semibold text-ink">Stockeo</div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-brand-600">
                  Panel del dueño
                </div>
              </div>
            </div>
            <form action={logout}>
              <button
                type="submit"
                title="Cerrar sesión"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-3 hover:bg-plane hover:text-ink"
              >
                <Icon name="logout" size={18} />
              </button>
            </form>
          </header>
          <PanelNavTabs />
        </div>
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-6xl space-y-7">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
