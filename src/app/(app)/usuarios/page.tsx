import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { Card, Empty, PageHeader, Badge } from "@/components/ui";
import { ToggleSwitch } from "@/components/toggle-switch";
import { Icon } from "@/components/icons";
import { NuevoUsuario } from "./nuevo-usuario";
import { cambiarRol, toggleUsuarioActivo } from "./actions";
import type { Perfil } from "@/lib/types";

export default async function UsuariosPage() {
  const yo = await requireAdmin();
  const supabase = await createClient();

  const { data: perfilesData } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at");
  const perfiles = (perfilesData ?? []) as Perfil[];

  // Correos: solo disponibles con la service_role key
  const emails = new Map<string, string>();
  if (isAdminClientConfigured) {
    const { data } = await createAdminClient().auth.admin.listUsers({
      perPage: 200,
    });
    for (const u of data?.users ?? []) emails.set(u.id, u.email ?? "");
  }

  return (
    <>
      <PageHeader title="Usuarios" description="Crea operadores y administradores" />

      <Card title="Nuevo usuario">
        {isAdminClientConfigured ? (
          <NuevoUsuario />
        ) : (
          <Empty>
            Agrega <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> a{" "}
            <span className="font-mono">.env.local</span> para poder crear
            usuarios desde aquí.
          </Empty>
        )}
      </Card>

      <Card
        title="Equipo"
        action={
          <Badge tone={perfiles.length > 0 ? "brand" : "neutral"}>
            {perfiles.length}
          </Badge>
        }
      >
        {perfiles.length === 0 ? (
          <Empty>Todavía no hay usuarios.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <colgroup>
                <col className="w-40" />
                <col />
                <col className="w-52" />
                <col className="w-28" />
              </colgroup>
              <thead>
                <tr className="text-left text-ink-3">
                  <th className="pb-2 pr-4 font-medium">Nombre</th>
                  <th className="pb-2 pr-4 font-medium">Correo</th>
                  <th className="pb-2 pr-4 font-medium">Rol</th>
                  <th className="pb-2 font-medium">Activo</th>
                </tr>
              </thead>
              <tbody>
                {perfiles.map((p) => (
                  <tr key={p.id} className="border-t border-ink/6">
                    <td className="truncate py-3 pr-4 font-medium text-ink">
                      {p.nombre}
                      {p.id === yo.id ? (
                        <span className="ml-1.5 text-xs font-normal text-ink-3">
                          (tú)
                        </span>
                      ) : null}
                    </td>
                    <td className="truncate py-3 pr-4 text-ink-2">
                      {emails.get(p.id) ?? "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {p.id === yo.id ? (
                        <Badge tone="brand">Administrador</Badge>
                      ) : (
                        <form action={cambiarRol} className="flex items-center gap-1.5">
                          <input type="hidden" name="id" value={p.id} />
                          <select
                            name="rol"
                            defaultValue={p.rol}
                            className="h-8 rounded-md border border-ink/15 bg-surface px-2 text-xs text-ink outline-none focus:border-brand-500"
                          >
                            <option value="operador">Operador</option>
                            <option value="admin">Administrador</option>
                          </select>
                          <button
                            type="submit"
                            title="Guardar rol"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-500 text-white hover:bg-brand-600"
                          >
                            <Icon name="check" size={13} />
                          </button>
                        </form>
                      )}
                    </td>
                    <td className="py-3">
                      {p.id === yo.id ? (
                        <Badge tone="good">Activo</Badge>
                      ) : (
                        <form
                          action={toggleUsuarioActivo}
                          className="flex items-center gap-2"
                        >
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="activo" value={String(p.activo)} />
                          <ToggleSwitch
                            checked={p.activo}
                            label={p.activo ? "Desactivar" : "Activar"}
                          />
                          <span className={p.activo ? "text-ink-2" : "text-ink-3"}>
                            {p.activo ? "Activo" : "Inactivo"}
                          </span>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
