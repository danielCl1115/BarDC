"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { mensajeDeError, type ActionState } from "@/lib/action";

export async function ajustarInventario(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const productoId = String(formData.get("producto_id") ?? "");
  const nuevoStock = Number(formData.get("nuevo_stock") ?? -1);
  const nota = String(formData.get("nota") ?? "").trim() || null;

  if (!productoId) return { error: "Falta el producto." };
  if (!(nuevoStock >= 0)) return { error: "El stock no puede ser negativo." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("ajustar_inventario", {
    p_producto_id: productoId,
    p_nuevo_stock: nuevoStock,
    p_nota: nota,
  });
  if (error) return { error: mensajeDeError(error) };

  revalidatePath("/inventario");
  return { ok: true };
}
