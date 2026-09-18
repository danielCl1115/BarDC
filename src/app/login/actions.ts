"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { esSuperAdmin } from "@/lib/super-admin";
import type { ActionState } from "@/lib/action";

export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const barId = String(formData.get("bar_id") ?? "");

  if (!email || !password) {
    return { error: "Escribe tu correo y tu contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  if (esSuperAdmin(email)) {
    revalidatePath("/", "layout");
    redirect("/panel");
  }

  // Si la pantalla mostró selector de bar, el correo debe ser de ese bar
  // y ese bar debe seguir activo.
  if (barId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: perfil } = await supabase
      .from("profiles")
      .select("bar_id")
      .eq("id", user?.id ?? "")
      .single();

    if (!perfil || perfil.bar_id !== barId) {
      await supabase.auth.signOut();
      return { error: "Ese correo no pertenece al bar que seleccionaste." };
    }

    const { data: bar } = await supabase
      .from("bares")
      .select("activo")
      .eq("id", barId)
      .single();

    if (!bar || !bar.activo) {
      await supabase.auth.signOut();
      return { error: "Este bar no tiene acceso activo. Contacta al administrador." };
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
