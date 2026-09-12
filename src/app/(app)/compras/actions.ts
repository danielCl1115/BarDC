"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { mensajeDeError, type ActionState } from "@/lib/action";

const itemSchema = z.object({
  producto_id: z.string().uuid(),
  cantidad: z.coerce.number().positive(),
  costo_unitario: z.coerce.number().min(0),
});

export async function registrarCompra(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const proveedor = String(formData.get("proveedor") ?? "");
  const nota = String(formData.get("nota") ?? "");

  let itemsRaw: unknown;
  try {
    itemsRaw = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "No se pudieron leer los renglones." };
  }

  const parsed = z.array(itemSchema).min(1, "Agrega al menos un renglón").safeParse(itemsRaw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Renglones inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("registrar_compra", {
    p_proveedor: proveedor,
    p_nota: nota,
    p_items: parsed.data,
  });
  if (error) return { error: mensajeDeError(error) };

  revalidatePath("/compras");
  revalidatePath("/inventario");
  return { ok: true };
}
