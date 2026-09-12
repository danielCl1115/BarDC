/** Resultado estándar de una Server Action usada con `useActionState`. */
export type ActionState = { error?: string; ok?: boolean } | null;

/** Convierte el error de una RPC/consulta de Supabase en un mensaje legible. */
export function mensajeDeError(e: unknown): string {
  if (typeof e === "object" && e !== null) {
    const obj = e as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message.length > 0) {
      return obj.message;
    }
    if (typeof obj.hint === "string" && obj.hint.length > 0) return obj.hint;
  }
  if (typeof e === "string" && e.length > 0) return e;
  return "Ocurrió un error. Intenta de nuevo.";
}
