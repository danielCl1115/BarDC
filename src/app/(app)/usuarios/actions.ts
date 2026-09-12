"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { mensajeDeError, type ActionState } from "@/lib/action";

const nuevoUsuarioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  rol: z.enum(["admin", "operador"]),
});

const resetPasswordSchema = z.object({
  id: z.string().uuid("Usuario inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export async function crearUsuario(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  if (!isAdminClientConfigured) {
    return {
      error:
        "Falta SUPABASE_SERVICE_ROLE_KEY en .env.local para poder crear usuarios.",
    };
  }

  const parsed = nuevoUsuarioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { nombre, email, password, rol } = parsed.data;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  });
  if (error || !data.user) {
    return { error: error ? mensajeDeError(error) : "No se pudo crear el usuario." };
  }

  // El trigger ya creó el profile con rol 'operador'. Ajustamos nombre y rol.
  const { error: upErr } = await admin
    .from("profiles")
    .update({ nombre, rol })
    .eq("id", data.user.id);
  if (upErr) return { error: mensajeDeError(upErr) };

  revalidatePath("/usuarios");
  return { ok: true };
}

export async function resetearPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  if (!isAdminClientConfigured) {
    return {
      error:
        "Falta SUPABASE_SERVICE_ROLE_KEY en .env.local para poder cambiar contraseñas.",
    };
  }

  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(parsed.data.id, {
    password: parsed.data.password,
  });
  if (error) return { error: mensajeDeError(error) };

  revalidatePath("/usuarios");
  return { ok: true };
}

export async function cambiarRol(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const rol = String(formData.get("rol") ?? "");
  if (!id || !["admin", "operador"].includes(rol)) return;

  const supabase = await createClient();
  await supabase.from("profiles").update({ rol }).eq("id", id);
  revalidatePath("/usuarios");
}

export async function toggleUsuarioActivo(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const activo = String(formData.get("activo") ?? "") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("profiles").update({ activo: !activo }).eq("id", id);
  revalidatePath("/usuarios");
}
