# Inventario y Cuentas

Sistema de inventario, cuentas (mesas/tabs) y ventas para un negocio pequeño.

- **Frontend:** Next.js 16 (App Router) · React · TypeScript · Tailwind CSS 4
- **Backend / BD:** Supabase (PostgreSQL + Auth + RLS)
- **Lógica de negocio:** Server Actions + funciones SQL (transacciones)
- **Costo en producción:** $0 (Vercel Hobby + Supabase Free)

---

## 1. Requisitos

- Node.js 20.9+ y npm (ya instalados si `node --version` funciona)
- Una cuenta gratis en [supabase.com](https://supabase.com)
- Una cuenta gratis en [vercel.com](https://vercel.com) (para publicar)

## 2. Configurar Supabase

1. Crea un proyecto nuevo en Supabase (plan Free).
2. Abre **SQL Editor → New query**, pega **todo** el archivo
   [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
   - Antes de correrlo, si tu país no es Colombia, cambia `'America/Bogota'`
     por tu zona horaria (está comentado arriba del archivo y en la vista
     `v_reporte_diario`).
3. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon` `public` key
   - `service_role` key (secreta)

## 3. Configurar el proyecto local

Copia `.env.example` a `.env.local` y rellena los 3 valores:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

Instala dependencias y arranca:

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## 4. Crear tu usuario administrador

1. En Supabase: **Authentication → Users → Add user** (marca *Auto Confirm User*).
   Usa tu correo y una contraseña.
2. En **SQL Editor**, ejecuta (con tu correo):

   ```sql
   update public.profiles set rol = 'admin'
   where id = (select id from auth.users where email = 'TU_CORREO@ejemplo.com');
   ```

3. Inicia sesión en la app. Desde **Usuarios** ya puedes crear a los operadores.

---

## Estructura del código

```
src/
  proxy.ts                 Protege rutas y refresca la sesión (antes "middleware")
  lib/
    supabase/              Clientes de Supabase (navegador / servidor / admin)
    auth.ts                requirePerfil() / requireAdmin()
    types.ts               Tipos de la app
    format.ts              Moneda y fechas
    action.ts              Tipo ActionState + manejo de errores
  components/              Nav + piezas de UI reutilizables
  app/
    login/                 Inicio de sesión
    configurar/            Pantalla de ayuda si falta .env.local
    (app)/                 Zona protegida (con menú lateral)
      dashboard/           Inicio: ventas de hoy, cuentas abiertas, stock bajo
      cuentas/             Abrir cuenta, agregar productos, cerrar y cobrar
      productos/           Catálogo (costo, precio, stock mínimo)   [admin]
      compras/             Registrar entradas de inventario         [admin]
      inventario/          Stock en vivo + ajuste por conteo         [admin]
      reportes/            Ventas por día                            [admin]
      historial/           Auditoría de acciones                     [admin]
      usuarios/            Crear operadores/admins                   [admin]
supabase/
  schema.sql               Tablas + RLS + funciones de negocio
```

### Dónde vive la lógica de negocio

Las operaciones que tocan varias tablas (cerrar cuenta, registrar compra,
ajustar inventario) son **funciones SQL** en `supabase/schema.sql`. Cada una
corre como **una transacción**: si algo falla, se revierte todo. Las Server
Actions (`app/**/actions.ts`) solo validan y llaman a esas funciones vía
`supabase.rpc(...)`.

---

## 5. Publicar en producción (gratis)

1. Sube el código a un repo de GitHub.
2. En Vercel: **Add New → Project** e importa el repo.
3. En **Environment Variables** pega las mismas 3 claves del `.env.local`.
4. **Deploy**. Vercel te da una URL `https://...vercel.app`.

Cada `git push` vuelve a desplegar automáticamente.

---

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Chequeo de tipos |
