import { requireSuperAdmin } from "@/lib/super-admin";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { Card, PageHeader, Empty } from "@/components/ui";
import { ToggleSwitch } from "@/components/toggle-switch";
import { MODULOS_OPCIONALES, TODOS_LOS_MODULOS, type ModuloId } from "@/lib/modulos-catalogo";
import { toggleModuloBar } from "../actions";

type BarRow = {
  id: string;
  nombre: string;
  modulos: ModuloId[] | null;
};

export default async function PanelModulosPage() {
  await requireSuperAdmin();

  if (!isAdminClientConfigured) {
    return (
      <>
        <PageHeader title="Módulos" description="Qué tiene contratado cada bar" />
        <Empty>Falta SUPABASE_SERVICE_ROLE_KEY.</Empty>
      </>
    );
  }

  const admin = createAdminClient();
  const { data: baresData } = await admin
    .from("bares")
    .select("id, nombre, modulos")
    .order("nombre");
  const bares = (baresData ?? []) as BarRow[];

  return (
    <>
      <PageHeader
        title="Módulos"
        description="Inicio y Cuentas siempre están incluidos. Prende o apaga el resto por bar para armar planes distintos."
      />

      {bares.length === 0 ? (
        <Empty>Todavía no hay bares.</Empty>
      ) : (
        <Card title="Qué tiene contratado cada bar">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-3">
                  <th className="pb-3 pr-4">Bar</th>
                  {MODULOS_OPCIONALES.map((m) => (
                    <th key={m.id} className="pb-3 pr-4 text-center font-medium">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bares.map((bar) => {
                  const modulos = bar.modulos ?? TODOS_LOS_MODULOS;
                  return (
                    <tr key={bar.id} className="border-b border-line last:border-0">
                      <td className="py-3 pr-4 font-medium text-ink">{bar.nombre}</td>
                      {MODULOS_OPCIONALES.map((m) => {
                        const prendido = modulos.includes(m.id);
                        return (
                          <td key={m.id} className="py-3 pr-4 text-center">
                            <form action={toggleModuloBar} className="inline-block">
                              <input type="hidden" name="bar_id" value={bar.id} />
                              <input type="hidden" name="modulo" value={m.id} />
                              <input type="hidden" name="prendido" value={String(prendido)} />
                              <ToggleSwitch checked={prendido} label={`${m.label} · ${bar.nombre}`} />
                            </form>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
