import { requireSuperAdmin } from "@/lib/super-admin";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { Card, PageHeader, Badge, Empty, StatTile } from "@/components/ui";
import { fmtMoney, fmtFecha } from "@/lib/format";
import { hoyYMD, ymdEnZona, primerDiaMes, sumarDias } from "@/lib/tz";
import { BarActivoControl } from "./bar-activo-control";

type BarRow = {
  id: string;
  nombre: string;
  slug: string;
  activo: boolean;
  created_at: string;
};

type Metrica = { hoy: number; dias30: number; mes: number; ultima: string | null };

export default async function PanelPage() {
  await requireSuperAdmin();

  if (!isAdminClientConfigured) {
    return (
      <>
        <PageHeader title="Bares" description="Todos los bares que usan Stockeo" />
        <Empty>
          Falta SUPABASE_SERVICE_ROLE_KEY para poder ver los datos de todos los bares.
        </Empty>
      </>
    );
  }

  const admin = createAdminClient();
  const hoy = hoyYMD();
  const inicioMes = primerDiaMes(hoy);
  const hace30 = sumarDias(hoy, -30);
  const hace90ISO = new Date(Date.now() - 90 * 86_400_000).toISOString();

  const [{ data: baresData }, { data: perfilesData }, { data: cuentasData }] = await Promise.all([
    admin.from("bares").select("id, nombre, slug, activo, created_at").order("created_at"),
    admin.from("profiles").select("id, nombre, bar_id"),
    admin
      .from("cuentas")
      .select("id, bar_id, total, cerrada_en")
      .eq("estado", "cerrada")
      .gte("cerrada_en", hace90ISO),
  ]);

  const bares = (baresData ?? []) as BarRow[];
  const cuentas = cuentasData ?? [];

  // Usuarios por bar (nombres, para saber quién opera cada uno)
  const usuariosPorBar = new Map<string, string[]>();
  for (const p of perfilesData ?? []) {
    const lista = usuariosPorBar.get(p.bar_id) ?? [];
    lista.push(p.nombre);
    usuariosPorBar.set(p.bar_id, lista);
  }

  // Ventas por bar (hoy / 30 días / mes / última venta)
  const metricasPorBar = new Map<string, Metrica>();
  for (const bar of bares) {
    metricasPorBar.set(bar.id, { hoy: 0, dias30: 0, mes: 0, ultima: null });
  }
  for (const c of cuentas) {
    const m = metricasPorBar.get(c.bar_id);
    if (!m || !c.cerrada_en) continue;
    const dia = ymdEnZona(c.cerrada_en);
    const total = Number(c.total ?? 0);
    if (dia === hoy) m.hoy += total;
    if (dia >= hace30) m.dias30 += total;
    if (dia >= inicioMes) m.mes += total;
    if (!m.ultima || c.cerrada_en > m.ultima) m.ultima = c.cerrada_en;
  }

  const totalHoy = bares.reduce((s, b) => s + (metricasPorBar.get(b.id)?.hoy ?? 0), 0);
  const totalMes = bares.reduce((s, b) => s + (metricasPorBar.get(b.id)?.mes ?? 0), 0);

  return (
    <>
      <PageHeader title="Bares" description="Todos los bares que usan Stockeo" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Bares" value={bares.length} icon="box" />
        <StatTile label="Ventas de hoy (todos)" value={fmtMoney(totalHoy)} icon="trend" />
        <StatTile label="Ventas del mes (todos)" value={fmtMoney(totalMes)} icon="trend" />
      </div>

      {bares.length === 0 ? (
        <Empty>Todavía no hay bares.</Empty>
      ) : (
        <div className="space-y-4">
          {bares.map((bar) => {
            const m = metricasPorBar.get(bar.id)!;
            const usuarios = usuariosPorBar.get(bar.id) ?? [];

            return (
              <Card
                key={bar.id}
                title={bar.nombre}
                description={`${usuarios.length} usuario(s)`}
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={bar.activo ? "good" : "crit"}>
                      {bar.activo ? "Activo" : "Desactivado"}
                    </Badge>
                    <BarActivoControl barId={bar.id} nombre={bar.nombre} activo={bar.activo} />
                  </div>
                }
              >
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <div className="text-xs text-ink-3">Hoy</div>
                    <div className="mt-0.5 text-sm font-semibold text-ink">{fmtMoney(m.hoy)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-3">Últimos 30 días</div>
                    <div className="mt-0.5 text-sm font-semibold text-ink">{fmtMoney(m.dias30)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-3">Este mes</div>
                    <div className="mt-0.5 text-sm font-semibold text-ink">{fmtMoney(m.mes)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-3">Última venta</div>
                    <div className="mt-0.5 text-sm font-semibold text-ink">{fmtFecha(m.ultima)}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
