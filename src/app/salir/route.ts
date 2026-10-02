import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Cierra la sesión y manda a /login con el motivo. Se usa cuando el usuario o
 * su negocio fueron desactivados: ahí hay que borrar las cookies de verdad, y
 * eso solo se puede hacer en una ruta (no mientras se dibuja una página).
 * Sin esto, la sesión seguiría siendo válida y /login lo devolvería al panel
 * en un bucle.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const motivo = url.searchParams.get("m");

  const supabase = await createClient();
  await supabase.auth.signOut();

  const destino = new URL("/login", url);
  if (motivo === "inactivo" || motivo === "bar_inactivo") destino.searchParams.set(motivo, "1");
  return NextResponse.redirect(destino);
}
