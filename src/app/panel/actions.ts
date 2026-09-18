"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/super-admin";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { TODOS_LOS_MODULOS, type ModuloId } from "@/lib/modulos-catalogo";
import { mensajeDeError, type ActionState } from "@/lib/action";

async function setBarActivo(id: string, activo: boolean) {
  const admin = createAdminClient();
  const { error } = await admin.from("bares").update({ activo }).eq("id", id);
  revalidatePath("/panel");
  return error;
}

/** Reactivar un bar: acción directa, sin confirmación (es la dirección segura). */
export async function togglearBarActivo(formData: FormData) {
  await requireSuperAdmin();
  if (!isAdminClientConfigured) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await setBarActivo(id, true);
}

/** Desactivar un bar: pasa por un modal de confirmación (le corta el acceso a todo un negocio). */
export async function desactivarBarConfirmado(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSuperAdmin();
  if (!isAdminClientConfigured) {
    return { error: "Falta SUPABASE_SERVICE_ROLE_KEY." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el bar." };

  const error = await setBarActivo(id, false);
  if (error) return { error: mensajeDeError(error) };
  return { ok: true };
}

/** Prende o apaga un solo módulo de un bar (interruptor individual). */
export async function toggleModuloBar(formData: FormData) {
  await requireSuperAdmin();
  if (!isAdminClientConfigured) return;

  const barId = String(formData.get("bar_id") ?? "");
  const modulo = String(formData.get("modulo") ?? "") as ModuloId;
  const prendido = String(formData.get("prendido") ?? "") === "true";
  if (!barId || !modulo) return;

  const admin = createAdminClient();
  const { data: bar } = await admin.from("bares").select("modulos").eq("id", barId).single();
  const actuales = new Set<ModuloId>((bar?.modulos as ModuloId[] | null) ?? TODOS_LOS_MODULOS);

  if (prendido) actuales.delete(modulo);
  else actuales.add(modulo);

  await admin.from("bares").update({ modulos: Array.from(actuales) }).eq("id", barId);
  revalidatePath("/panel/modulos");
  revalidatePath("/panel");
}
