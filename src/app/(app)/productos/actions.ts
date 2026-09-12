"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { mensajeDeError, type ActionState } from "@/lib/action";

const productoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  costo: z.coerce.number().min(0, "El costo no puede ser negativo"),
  precio: z.coerce.number().min(0, "El precio no puede ser negativo"),
  stock: z.coerce.number().min(0, "El stock no puede ser negativo"),
  stock_minimo: z.coerce.number().min(0, "El mínimo no puede ser negativo"),
});

export async function crearProducto(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = productoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("productos").insert(parsed.data);
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ya existe un producto con ese nombre."
          : mensajeDeError(error),
    };
  }

  revalidatePath("/productos");
  return { ok: true };
}

export async function actualizarProducto(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el producto." };

  const parsed = productoSchema
    .omit({ stock: true })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("productos")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: mensajeDeError(error) };

  revalidatePath("/productos");
  return { ok: true };
}

export async function eliminarProducto(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el producto." };

  const supabase = await createClient();
  const { error } = await supabase.from("productos").delete().eq("id", id);

  if (error) {
    // 23503 = viola llave foránea: el producto ya aparece en compras/cuentas/movimientos.
    if (error.code === "23503") {
      return {
        error:
          "No se puede eliminar: este producto ya tiene compras o ventas registradas. Desactívalo en vez de eliminarlo.",
      };
    }
    return { error: mensajeDeError(error) };
  }

  revalidatePath("/productos");
  return { ok: true };
}

export async function toggleActivo(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const activo = String(formData.get("activo") ?? "") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("productos").update({ activo: !activo }).eq("id", id);
  revalidatePath("/productos");
}
