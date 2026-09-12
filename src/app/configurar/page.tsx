import { isSupabaseConfigured } from "@/lib/supabase/config";
import { redirect } from "next/navigation";

export default function ConfigurarPage() {
  if (isSupabaseConfigured) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-semibold">Falta conectar Supabase</h1>
      <p className="mt-2 text-sm text-ink-2">
        La app no arranca hasta que le des las claves de tu proyecto Supabase.
      </p>

      <ol className="mt-6 space-y-3 text-sm text-ink-2">
        <li>
          1. Entra a <span className="font-mono">supabase.com</span> y crea un
          proyecto (plan Free).
        </li>
        <li>
          2. Abre <span className="font-medium">SQL Editor</span> y ejecuta todo
          el archivo <span className="font-mono">supabase/schema.sql</span>.
        </li>
        <li>
          3. En <span className="font-medium">Project Settings → API</span> copia
          la <span className="font-mono">URL</span>, la{" "}
          <span className="font-mono">anon key</span> y la{" "}
          <span className="font-mono">service_role key</span>.
        </li>
        <li>
          4. Pégalas en el archivo <span className="font-mono">.env.local</span>{" "}
          y reinicia <span className="font-mono">npm run dev</span>.
        </li>
      </ol>

      <pre className="mt-6 overflow-x-auto rounded-md bg-ink p-4 text-xs text-white">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...`}
      </pre>
    </main>
  );
}
