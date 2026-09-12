import Link from "next/link";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Empty, PageHeader, Badge } from "@/components/ui";
import { fmtMoney, fmtFecha } from "@/lib/format";
import { metodoLabel, metodoTone } from "@/lib/metodo-pago";
import { NuevaCuenta } from "./nueva-cuenta";
import type { Cuenta } from "@/lib/types";

export default async function CuentasPage() {
  await requirePerfil();
  const supabase = await createClient();

  const [{ data: abiertasData }, { data: cerradasData }] = await Promise.all([
    supabase
      .from("cuentas")
      .select("*")
      .eq("estado", "abierta")
      .order("abierta_en", { ascending: true }),
    supabase
      .from("cuentas")
      .select("*")
      .eq("estado", "cerrada")
      .order("cerrada_en", { ascending: false })
      .limit(15),
  ]);

  const abiertas = (abiertasData ?? []) as Cuenta[];
  const cerradas = (cerradasData ?? []) as Cuenta[];

  return (
    <>
      <PageHeader title="Cuentas" description="Abre una cuenta, agrega productos y cóbrala" />

      <Card title="Nueva cuenta">
        <NuevaCuenta />
      </Card>

      <Card
        title="Abiertas"
        action={
          <Badge tone={abiertas.length > 0 ? "brand" : "neutral"}>
            {abiertas.length}
          </Badge>
        }
      >
        {abiertas.length === 0 ? (
          <Empty>No hay cuentas abiertas.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {abiertas.map((c) => (
              <Link
                key={c.id}
                href={`/cuentas/${c.id}`}
                className="rounded-xl border-2 border-brand-100 bg-brand-50 p-4 transition-colors hover:border-brand-300 hover:bg-brand-100/70"
              >
                <div className="truncate text-base font-semibold text-ink">
                  {c.nombre_cliente}
                </div>
                <div className="mt-0.5 text-xs text-ink-3">
                  {fmtFecha(c.abierta_en)}
                </div>
                <div className="mt-3 text-xl font-bold text-brand-700">
                  {fmtMoney(c.total)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card title="Cerradas recientemente">
        {cerradas.length === 0 ? (
          <Empty>Aún no has cerrado ninguna cuenta.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col />
                <col className="w-44" />
                <col className="w-36" />
                <col className="w-28" />
              </colgroup>
              <thead>
                <tr className="text-left text-ink-3">
                  <th className="pb-2 pr-4 font-medium">Cliente</th>
                  <th className="pb-2 pr-4 font-medium">Cerrada</th>
                  <th className="pb-2 pr-4 font-medium">Pago</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {cerradas.map((c) => (
                  <tr key={c.id} className="border-t border-ink/6">
                    <td className="truncate py-3 pr-4">
                      <Link href={`/cuentas/${c.id}`} className="hover:underline">
                        {c.nombre_cliente}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{fmtFecha(c.cerrada_en)}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={metodoTone(c.metodo_pago)}>
                        {metodoLabel(c.metodo_pago)}
                      </Badge>
                    </td>
                    <td className="py-3 text-right font-medium text-ink">
                      {fmtMoney(c.total)}
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
