import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

// En Next.js 16 el antiguo `middleware` se llama `proxy`. Runtime: Node.js.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todas las rutas menos:
     * - _next/static, _next/image  (assets de Next)
     * - favicon, manifest e íconos (los necesita el navegador/celular sin sesión)
     * - archivos de imagen
     */
    "/((?!_next/static|_next/image|favicon.ico|apple-icon|icon|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
