import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { ToastProvider } from "@/components/toast";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await requirePerfil();
  const supabase = await createClient();
  const { data: bar } = await supabase
    .from("bares")
    .select("nombre")
    .eq("id", perfil.bar_id)
    .single();

  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col md:flex-row">
        <Nav nombre={perfil.nombre} rol={perfil.rol} barNombre={bar?.nombre ?? "Stockeo"} />
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-6xl space-y-7">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
