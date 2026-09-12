"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { mensajeDeError, type ActionState } from "@/lib/action";

export async function abrirCuenta(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePerfil();
  const nombre = String(formData.get("nombre_cliente") ?? "").trim();
  if (!nombre) return { error: "Escribe el nombre del cliente." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("abrir_cuenta", {
    p_nombre_cliente: nombre,
  });
  if (error) return { error: mensajeDeError(error) };

  revalidatePath("/cuentas");
  redirect(`/cuentas/${data as string}`);
}

export async function agregarItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePerfil();
  const cuentaId = String(formData.get("cuenta_id") ?? "");
  const productoId = String(formData.get("producto_id") ?? "");
  const cantidad = Number(formData.get("cantidad") ?? 0);

  if (!cuentaId || !productoId) return { error: "Elige un producto." };
  if (!(cantidad > 0)) return { error: "La cantidad debe ser mayor a 0." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("agregar_item_cuenta", {
    p_cuenta_id: cuentaId,
    p_producto_id: productoId,
    p_cantidad: cantidad,
  });
  if (error) return { error: mensajeDeError(error) };

  revalidatePath(`/cuentas/${cuentaId}`);
  return { ok: true };
}

/** Igual que agregarItem, pero para usarse directo en un <form action={...}>
 *  (los botones de la grilla de productos) sin pasar por useActionState. */
export async function agregarItemTile(formData: FormData) {
  await agregarItem(null, formData);
}

/** Cambia la cantidad de un renglón a un valor exacto (escribir "30" en vez
 *  de tocar el producto 30 veces). Cantidad 0 borra el renglón. */
export async function actualizarCantidad(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePerfil();
  const itemId = String(formData.get("item_id") ?? "");
  const cuentaId = String(formData.get("cuenta_id") ?? "");
  const cantidad = Number(formData.get("cantidad") ?? -1);
  if (!itemId) return { error: "Falta el producto." };
  if (!(cantidad >= 0)) return { error: "La cantidad no puede ser negativa." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("actualizar_cantidad_item", {
    p_item_id: itemId,
    p_cantidad: cantidad,
  });
  if (error) return { error: mensajeDeError(error) };

  revalidatePath(`/cuentas/${cuentaId}`);
  return { ok: true };
}

export async function quitarItem(formData: FormData) {
  await requirePerfil();
  const itemId = String(formData.get("item_id") ?? "");
  const cuentaId = String(formData.get("cuenta_id") ?? "");
  if (!itemId) return;

  const supabase = await createClient();
  await supabase.rpc("quitar_item_cuenta", { p_item_id: itemId });
  revalidatePath(`/cuentas/${cuentaId}`);
}

export async function cerrarCuenta(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePerfil();
  const cuentaId = String(formData.get("cuenta_id") ?? "");
  const metodo = String(formData.get("metodo") ?? "");
  const efectivo = Number(formData.get("efectivo") ?? 0);
  const transferencia = Number(formData.get("transferencia") ?? 0);

  if (!cuentaId) return { error: "Falta la cuenta." };
  if (!["efectivo", "transferencia", "mixto"].includes(metodo)) {
    return { error: "Elige la forma de pago." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("cerrar_cuenta", {
    p_cuenta_id: cuentaId,
    p_metodo: metodo,
    p_efectivo: efectivo,
    p_transferencia: transferencia,
  });
  if (error) return { error: mensajeDeError(error) };

  revalidatePath("/cuentas");
  revalidatePath(`/cuentas/${cuentaId}`);
  redirect(`/cuentas/${cuentaId}?cerrada=1`);
}

/** Corrige una cuenta ya cobrada: la vuelve a dejar abierta (solo admin). */
export async function reabrirCuenta(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const perfil = await requirePerfil();
  if (perfil.rol !== "admin") {
    return { error: "Solo un administrador puede reabrir cuentas." };
  }
  const cuentaId = String(formData.get("cuenta_id") ?? "");
  if (!cuentaId) return { error: "Falta la cuenta." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("reabrir_cuenta", { p_cuenta_id: cuentaId });
  if (error) return { error: mensajeDeError(error) };

  revalidatePath("/cuentas");
  revalidatePath(`/cuentas/${cuentaId}`);
  return { ok: true };
}
