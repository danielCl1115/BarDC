// Crea un bar nuevo + su primer usuario administrador.
// No toca diseño ni requiere desplegar nada nuevo: usa la misma base de
// datos y el mismo sitio web, solo agrega un bar más.
//
// Uso:
//   node --env-file=.env.local scripts/crear-bar.mjs "Nombre del bar" "Nombre del admin" correo@ejemplo.com "contraseña"
//
// Ejemplo:
//   node --env-file=.env.local scripts/crear-bar.mjs "El Rincón" "Carlos Pérez" carlos@elrincon.com clave123

import { createClient } from "@supabase/supabase-js";

const [, , nombreBar, nombreAdmin, email, password] = process.argv;

if (!nombreBar || !nombreAdmin || !email || !password) {
  console.error(
    'Uso: node --env-file=.env.local scripts/crear-bar.mjs "Nombre del bar" "Nombre del admin" correo@ejemplo.com "contraseña"',
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function slugDisponible(slug) {
  const { data } = await admin.from("bares").select("id").eq("slug", slug).maybeSingle();
  return !data;
}

async function main() {
  const slugBase = slugify(nombreBar) || "bar";
  let slug = slugBase;
  let intento = 1;
  while (!(await slugDisponible(slug))) {
    intento += 1;
    slug = `${slugBase}-${intento}`;
  }

  const { data: bar, error: barError } = await admin
    .from("bares")
    .insert({ nombre: nombreBar, slug })
    .select("id, nombre, slug")
    .single();
  if (barError) {
    console.error("No se pudo crear el bar:", barError.message);
    process.exit(1);
  }

  const { data: usuario, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre: nombreAdmin, bar_id: bar.id },
  });
  if (userError || !usuario.user) {
    console.error("El bar se creó pero el usuario no:", userError?.message ?? "error desconocido");
    console.error(`Bar creado igual: "${bar.nombre}" (bar_id: ${bar.id}). Crea el usuario a mano y asígnale ese bar_id.`);
    process.exit(1);
  }

  const { error: rolError } = await admin
    .from("profiles")
    .update({ nombre: nombreAdmin, rol: "admin" })
    .eq("id", usuario.user.id);
  if (rolError) {
    console.error("El usuario se creó pero no quedó como administrador:", rolError.message);
    process.exit(1);
  }

  console.log("");
  console.log("¡Listo! Bar nuevo creado:");
  console.log(`  Bar:     ${bar.nombre}`);
  console.log(`  Admin:   ${email}`);
  console.log(`  Entra en la misma página con ese correo y esa contraseña.`);
  console.log("");
}

main();
