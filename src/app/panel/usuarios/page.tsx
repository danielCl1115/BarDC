import { requireSuperAdmin, esSuperAdmin } from "@/lib/super-admin";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { Card, PageHeader, Badge, Empty } from "@/components/ui";

type BarRow = { id: string; nombre: string };
type PerfilRow = {
  id: string;
  nombre: string;
  rol: "admin" | "operador";
  activo: boolean;
  bar_id: string;
};

export default async function PanelUsuariosPage() {
  await requireSuperAdmin();

  if (!isAdminClientConfigured) {
    return (
      <>
        <PageHeader title="Usuarios" description="Quién opera cada bar" />
        <Empty>Falta SUPABASE_SERVICE_ROLE_KEY.</Empty>
      </>
    );
  }

  const admin = createAdminClient();
  const [{ data: baresData }, { data: perfilesData }, { data: usersData }] = await Promise.all([
    admin.from("bares").select("id, nombre").order("nombre"),
    admin.from("profiles").select("id, nombre, rol, activo, bar_id").order("nombre"),
    admin.auth.admin.listUsers({ perPage: 200 }),
  ]);

  const bares = (baresData ?? []) as BarRow[];
  const perfiles = (perfilesData ?? []) as PerfilRow[];
  const emails = new Map(usersData?.users.map((u) => [u.id, u.email ?? "—"]) ?? []);

  // El super-usuario nunca aparece en estas listas, ni siquiera aquí.
  const perfilesPorBar = new Map<string, PerfilRow[]>();
  for (const p of perfiles) {
    if (esSuperAdmin(emails.get(p.id))) continue;
    const lista = perfilesPorBar.get(p.bar_id) ?? [];
    lista.push(p);
    perfilesPorBar.set(p.bar_id, lista);
  }

  return (
    <>
      <PageHeader title="Usuarios" description="Quién opera cada bar, con acceso a todos" />

      {bares.length === 0 ? (
        <Empty>Todavía no hay bares.</Empty>
      ) : (
        <div className="space-y-4">
          {bares.map((bar) => {
            const equipo = perfilesPorBar.get(bar.id) ?? [];
            return (
              <Card key={bar.id} title={bar.nombre} description={`${equipo.length} usuario(s)`}>
                {equipo.length === 0 ? (
                  <Empty>Sin usuarios todavía.</Empty>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-3">
                          <th className="pb-2 pr-4">Nombre</th>
                          <th className="pb-2 pr-4">Correo</th>
                          <th className="pb-2 pr-4">Rol</th>
                          <th className="pb-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipo.map((p) => (
                          <tr key={p.id} className="border-b border-line last:border-0">
                            <td className="py-2.5 pr-4 font-medium text-ink">{p.nombre}</td>
                            <td className="py-2.5 pr-4 text-ink-2">{emails.get(p.id) ?? "—"}</td>
                            <td className="py-2.5 pr-4">
                              <Badge tone={p.rol === "admin" ? "brand" : "neutral"}>
                                {p.rol === "admin" ? "Administrador" : "Operador"}
                              </Badge>
                            </td>
                            <td className="py-2.5">
                              <Badge tone={p.activo ? "good" : "crit"}>
                                {p.activo ? "Activo" : "Inactivo"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
