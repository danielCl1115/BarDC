import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";
import { LogoMark } from "@/components/logo";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: bares } = await supabase
    .from("bares")
    .select("id, nombre")
    .eq("activo", true)
    .order("nombre");

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-plane px-4 py-12">
      {/* Resplandores ambientales, suaves sobre fondo blanco */}
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-20 blur-[110px]"
        style={{ background: "#22d3ee" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full opacity-15 blur-[110px]"
        style={{ background: "#a855f7" }}
      />

      <div className="relative w-full max-w-sm">
        <div className="flex justify-center drop-shadow-[0_8px_20px_rgba(8,145,178,0.25)]">
          <LogoMark size={88} />
        </div>
        <h1 className="mt-4 bg-gradient-to-r from-[#0891b2] to-[#9333ea] bg-clip-text text-center text-2xl font-bold uppercase tracking-[0.25em] text-transparent">
          Stockeo
        </h1>
        <p className="mt-1 text-center text-xs font-medium uppercase tracking-[0.2em] text-ink-3">
          Inventario y cuentas para bares
        </p>

        <div className="mt-7 rounded-2xl border border-line bg-surface p-7 shadow-[0_1px_2px_rgba(11,17,32,0.05),0_20px_50px_-20px_rgba(8,145,178,0.3)]">
          <LoginForm bares={bares ?? []} />
        </div>

        <p className="mt-5 text-center text-xs text-ink-3">
          ¿Sin usuario? El administrador los crea desde la pantalla de Usuarios.
        </p>
      </div>
    </main>
  );
}
