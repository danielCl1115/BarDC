-- =============================================================================
--  SISTEMA DE INVENTARIO Y CUENTAS  ·  Esquema completo
--  Motor: PostgreSQL (Supabase)
--
--  Cómo aplicarlo:
--    Supabase  ->  SQL Editor  ->  New query  ->  pega TODO este archivo  ->  Run
--
--  Contenido:
--    1. Perfiles y roles          5. Movimientos e historial
--    2. Productos                 6. Lógica de negocio (funciones = transacciones)
--    3. Compras                   7. Vistas de consulta
--    4. Cuentas                   8. Seguridad (RLS)
--                                 9. Datos de prueba + cómo hacerte admin
-- =============================================================================

-- Zona horaria para el reporte diario. Cámbiala por la de tu país si hace falta:
-- 'America/Bogota' (CO), 'America/Mexico_City' (MX), 'America/Lima' (PE),
-- 'America/Argentina/Buenos_Aires' (AR), 'America/Santiago' (CL)...
-- (Se usa en la vista v_reporte_diario, más abajo.)


-- =============================================================================
--  1. PERFILES Y ROLES
-- =============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null default 'Sin nombre',
  rol         text not null default 'operador' check (rol in ('admin', 'operador')),
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Un registro por usuario de auth.users. El rol define qué puede hacer.';

-- Crea el perfil automáticamente cuando alguien se registra en Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers de rol. SECURITY DEFINER para poder usarlos dentro de las políticas RLS
-- sin caer en recursión infinita al leer la tabla profiles.
create or replace function public.mi_rol()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select rol from public.profiles where id = auth.uid();
$$;

create or replace function public.es_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.mi_rol() = 'admin', false);
$$;


-- =============================================================================
--  2. PRODUCTOS
-- =============================================================================
create table if not exists public.productos (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null unique,
  costo         numeric(12,2) not null default 0 check (costo >= 0),
  precio        numeric(12,2) not null default 0 check (precio >= 0),
  stock         numeric(12,3) not null default 0,
  stock_minimo  numeric(12,3) not null default 0 check (stock_minimo >= 0),
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists productos_activo_idx on public.productos (activo);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists productos_touch on public.productos;
create trigger productos_touch before update on public.productos
  for each row execute function public.touch_updated_at();


-- =============================================================================
--  3. COMPRAS  (entradas de inventario)
-- =============================================================================
create table if not exists public.compras (
  id          uuid primary key default gen_random_uuid(),
  proveedor   text,
  nota        text,
  total       numeric(12,2) not null default 0,
  creada_por  uuid references public.profiles (id),
  created_at  timestamptz not null default now()
);

create table if not exists public.compra_items (
  id              uuid primary key default gen_random_uuid(),
  compra_id       uuid not null references public.compras (id) on delete cascade,
  producto_id     uuid not null references public.productos (id),
  cantidad        numeric(12,3) not null check (cantidad > 0),
  costo_unitario  numeric(12,2) not null check (costo_unitario >= 0),
  subtotal        numeric(12,2) generated always as (cantidad * costo_unitario) stored
);

create index if not exists compra_items_compra_idx on public.compra_items (compra_id);


-- =============================================================================
--  4. CUENTAS  (mesas / tabs)  y sus renglones
-- =============================================================================
create table if not exists public.cuentas (
  id                  uuid primary key default gen_random_uuid(),
  nombre_cliente      text not null,
  estado              text not null default 'abierta' check (estado in ('abierta', 'cerrada')),
  total               numeric(12,2) not null default 0,
  metodo_pago         text check (metodo_pago in ('efectivo', 'transferencia', 'mixto')),
  pago_efectivo       numeric(12,2) not null default 0,
  pago_transferencia  numeric(12,2) not null default 0,
  abierta_por         uuid references public.profiles (id),
  cerrada_por         uuid references public.profiles (id),
  abierta_en          timestamptz not null default now(),
  cerrada_en          timestamptz
);

create index if not exists cuentas_estado_idx     on public.cuentas (estado);
create index if not exists cuentas_cerrada_en_idx on public.cuentas (cerrada_en);

create table if not exists public.cuenta_items (
  id               uuid primary key default gen_random_uuid(),
  cuenta_id        uuid not null references public.cuentas (id) on delete cascade,
  producto_id      uuid not null references public.productos (id),
  nombre_producto  text not null,                       -- copia: el nombre queda "congelado"
  cantidad         numeric(12,3) not null check (cantidad > 0),
  precio_unitario  numeric(12,2) not null check (precio_unitario >= 0),
  subtotal         numeric(12,2) generated always as (cantidad * precio_unitario) stored,
  created_at       timestamptz not null default now()
);

create index if not exists cuenta_items_cuenta_idx on public.cuenta_items (cuenta_id);


-- =============================================================================
--  5. MOVIMIENTOS DE INVENTARIO (kardex)  e  HISTORIAL (auditoría)
-- =============================================================================
create table if not exists public.movimientos_inventario (
  id                uuid primary key default gen_random_uuid(),
  producto_id       uuid not null references public.productos (id),
  tipo              text not null check (tipo in ('compra', 'venta', 'ajuste')),
  cantidad          numeric(12,3) not null,             -- (+) entra   (-) sale
  stock_resultante  numeric(12,3) not null,
  referencia        text,                               -- id de compra / cuenta / 'conteo'
  nota              text,
  creado_por        uuid references public.profiles (id),
  created_at        timestamptz not null default now()
);

create index if not exists movimientos_producto_idx
  on public.movimientos_inventario (producto_id, created_at desc);

create table if not exists public.historial (
  id            uuid primary key default gen_random_uuid(),
  actor         uuid references public.profiles (id),
  actor_nombre  text,
  accion        text not null,
  entidad       text not null,
  entidad_id    uuid,
  detalle       jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists historial_created_idx on public.historial (created_at desc);

create or replace function public.registrar_historial(
  p_accion text, p_entidad text, p_entidad_id uuid, p_detalle jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_nombre text;
begin
  select nombre into v_nombre from public.profiles where id = auth.uid();
  insert into public.historial (actor, actor_nombre, accion, entidad, entidad_id, detalle)
  values (auth.uid(), coalesce(v_nombre, 'sistema'), p_accion, p_entidad, p_entidad_id,
          coalesce(p_detalle, '{}'::jsonb));
end;
$$;


-- =============================================================================
--  6. LÓGICA DE NEGOCIO
--     Cada función es SECURITY DEFINER y corre como UNA transacción:
--     si una línea falla, se revierte TODO. Nunca queda a medias.
-- =============================================================================

-- 6.1  Abrir cuenta -----------------------------------------------------------
create or replace function public.abrir_cuenta(p_nombre_cliente text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  if coalesce(trim(p_nombre_cliente), '') = '' then
    raise exception 'El nombre del cliente es obligatorio';
  end if;

  insert into public.cuentas (nombre_cliente, abierta_por)
  values (trim(p_nombre_cliente), auth.uid())
  returning id into v_id;

  perform public.registrar_historial('abrir_cuenta', 'cuenta', v_id,
    jsonb_build_object('cliente', trim(p_nombre_cliente)));
  return v_id;
end;
$$;

-- 6.2  Agregar un producto a una cuenta abierta -----------------------------
--      Ojo: aquí el stock TODAVÍA NO baja. Baja al cerrar la cuenta.
create or replace function public.agregar_item_cuenta(
  p_cuenta_id uuid, p_producto_id uuid, p_cantidad numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado text;
  v_prod   public.productos%rowtype;
  v_existe uuid;
begin
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor a 0';
  end if;

  select estado into v_estado from public.cuentas where id = p_cuenta_id for update;
  if not found then raise exception 'La cuenta no existe'; end if;
  if v_estado <> 'abierta' then raise exception 'La cuenta ya está cerrada'; end if;

  select * into v_prod from public.productos where id = p_producto_id;
  if not found then raise exception 'El producto no existe'; end if;
  if not v_prod.activo then raise exception 'El producto está inactivo'; end if;

  -- Si el producto ya está en la cuenta, se suma a la cantidad existente
  select id into v_existe from public.cuenta_items
  where cuenta_id = p_cuenta_id and producto_id = p_producto_id;

  if v_existe is not null then
    update public.cuenta_items set cantidad = cantidad + p_cantidad where id = v_existe;
  else
    insert into public.cuenta_items
      (cuenta_id, producto_id, nombre_producto, cantidad, precio_unitario)
    values
      (p_cuenta_id, p_producto_id, v_prod.nombre, p_cantidad, v_prod.precio);
  end if;

  update public.cuentas
  set total = (select coalesce(sum(subtotal), 0)
               from public.cuenta_items where cuenta_id = p_cuenta_id)
  where id = p_cuenta_id;

  perform public.registrar_historial('agregar_item', 'cuenta', p_cuenta_id,
    jsonb_build_object('producto', v_prod.nombre, 'cantidad', p_cantidad));
end;
$$;

-- 6.3  Quitar un renglón de la cuenta --------------------------------------
create or replace function public.quitar_item_cuenta(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_cuenta uuid; v_estado text; v_nombre text;
begin
  select ci.cuenta_id, c.estado, ci.nombre_producto
  into v_cuenta, v_estado, v_nombre
  from public.cuenta_items ci
  join public.cuentas c on c.id = ci.cuenta_id
  where ci.id = p_item_id;

  if not found then raise exception 'El renglón no existe'; end if;
  if v_estado <> 'abierta' then raise exception 'La cuenta ya está cerrada'; end if;

  delete from public.cuenta_items where id = p_item_id;

  update public.cuentas
  set total = (select coalesce(sum(subtotal), 0)
               from public.cuenta_items where cuenta_id = v_cuenta)
  where id = v_cuenta;

  perform public.registrar_historial('quitar_item', 'cuenta', v_cuenta,
    jsonb_build_object('producto', v_nombre));
end;
$$;

-- 6.3b  Cambiar la cantidad de un renglón directamente (escribir "30" en vez
--       de tocar 30 veces). Si la nueva cantidad es 0, el renglón se borra.
create or replace function public.actualizar_cantidad_item(p_item_id uuid, p_cantidad numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_cuenta uuid; v_estado text; v_nombre text;
begin
  if p_cantidad is null or p_cantidad < 0 then
    raise exception 'La cantidad no puede ser negativa';
  end if;

  select ci.cuenta_id, c.estado, ci.nombre_producto
  into v_cuenta, v_estado, v_nombre
  from public.cuenta_items ci
  join public.cuentas c on c.id = ci.cuenta_id
  where ci.id = p_item_id;

  if not found then raise exception 'El renglón no existe'; end if;
  if v_estado <> 'abierta' then raise exception 'La cuenta ya está cerrada'; end if;

  if p_cantidad = 0 then
    delete from public.cuenta_items where id = p_item_id;
  else
    update public.cuenta_items set cantidad = p_cantidad where id = p_item_id;
  end if;

  update public.cuentas
  set total = (select coalesce(sum(subtotal), 0)
               from public.cuenta_items where cuenta_id = v_cuenta)
  where id = v_cuenta;

  perform public.registrar_historial('actualizar_cantidad', 'cuenta', v_cuenta,
    jsonb_build_object('producto', v_nombre, 'cantidad', p_cantidad));
end;
$$;

-- 6.4  CERRAR CUENTA  ->  el corazón del sistema --------------------------
--      1 transacción:  valida el pago  ->  descuenta inventario  ->
--      registra kardex  ->  cierra la cuenta  ->  audita.
create or replace function public.cerrar_cuenta(
  p_cuenta_id     uuid,
  p_metodo        text,
  p_efectivo      numeric default 0,
  p_transferencia numeric default 0
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cta       public.cuentas%rowtype;
  v_item      record;
  v_nuevo     numeric(12,3);
  v_efectivo  numeric(12,2) := coalesce(p_efectivo, 0);
  v_transf    numeric(12,2) := coalesce(p_transferencia, 0);
begin
  select * into v_cta from public.cuentas where id = p_cuenta_id for update;
  if not found then raise exception 'La cuenta no existe'; end if;
  if v_cta.estado <> 'abierta' then raise exception 'La cuenta ya está cerrada'; end if;
  if v_cta.total <= 0 then raise exception 'La cuenta no tiene productos'; end if;
  if p_metodo not in ('efectivo', 'transferencia', 'mixto') then
    raise exception 'Método de pago inválido';
  end if;

  -- Normaliza y valida el pago contra el total
  if p_metodo = 'efectivo' then
    v_efectivo := v_cta.total; v_transf := 0;
  elsif p_metodo = 'transferencia' then
    v_transf := v_cta.total; v_efectivo := 0;
  else  -- mixto
    if v_efectivo <= 0 or v_transf <= 0 then
      raise exception 'En pago mixto, efectivo y transferencia deben ser mayores a 0';
    end if;
    if abs((v_efectivo + v_transf) - v_cta.total) > 0.01 then
      raise exception 'El pago (% + % = %) no coincide con el total %',
        v_efectivo, v_transf, v_efectivo + v_transf, v_cta.total;
    end if;
  end if;

  -- Descuenta inventario renglón por renglón + deja rastro en el kardex
  for v_item in
    select producto_id, nombre_producto, sum(cantidad) as cantidad
    from public.cuenta_items
    where cuenta_id = p_cuenta_id
    group by producto_id, nombre_producto
  loop
    select stock - v_item.cantidad into v_nuevo
    from public.productos where id = v_item.producto_id for update;

    if v_nuevo < 0 then
      raise exception 'Stock insuficiente de "%": no alcanza para % unidades',
        v_item.nombre_producto, v_item.cantidad;
    end if;

    update public.productos set stock = v_nuevo where id = v_item.producto_id;

    insert into public.movimientos_inventario
      (producto_id, tipo, cantidad, stock_resultante, referencia, nota, creado_por)
    values
      (v_item.producto_id, 'venta', -v_item.cantidad, v_nuevo, p_cuenta_id::text,
       'Cuenta ' || v_cta.nombre_cliente, auth.uid());
  end loop;

  update public.cuentas
  set estado             = 'cerrada',
      metodo_pago        = p_metodo,
      pago_efectivo      = v_efectivo,
      pago_transferencia = v_transf,
      cerrada_por        = auth.uid(),
      cerrada_en         = now()
  where id = p_cuenta_id;

  perform public.registrar_historial('cerrar_cuenta', 'cuenta', p_cuenta_id,
    jsonb_build_object('total', v_cta.total, 'metodo', p_metodo,
                       'efectivo', v_efectivo, 'transferencia', v_transf));
end;
$$;

-- 6.4b  Reabrir una cuenta ya cerrada (solo admin) -------------------------
--       Corrige un cobro mal hecho: devuelve el inventario descontado al
--       cerrar y la deja "abierta" otra vez para editar y volver a cerrar.
create or replace function public.reabrir_cuenta(p_cuenta_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cta   public.cuentas%rowtype;
  v_item  record;
  v_nuevo numeric(12,3);
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede reabrir una cuenta';
  end if;

  select * into v_cta from public.cuentas where id = p_cuenta_id for update;
  if not found then raise exception 'La cuenta no existe'; end if;
  if v_cta.estado <> 'cerrada' then raise exception 'La cuenta no está cerrada'; end if;

  for v_item in
    select producto_id, nombre_producto, sum(cantidad) as cantidad
    from public.cuenta_items
    where cuenta_id = p_cuenta_id
    group by producto_id, nombre_producto
  loop
    update public.productos set stock = stock + v_item.cantidad
    where id = v_item.producto_id
    returning stock into v_nuevo;

    insert into public.movimientos_inventario
      (producto_id, tipo, cantidad, stock_resultante, referencia, nota, creado_por)
    values
      (v_item.producto_id, 'ajuste', v_item.cantidad, v_nuevo, p_cuenta_id::text,
       'Reapertura de cuenta ' || v_cta.nombre_cliente, auth.uid());
  end loop;

  update public.cuentas
  set estado             = 'abierta',
      metodo_pago        = null,
      pago_efectivo      = 0,
      pago_transferencia = 0,
      cerrada_por        = null,
      cerrada_en         = null
  where id = p_cuenta_id;

  perform public.registrar_historial('reabrir_cuenta', 'cuenta', p_cuenta_id,
    jsonb_build_object('cliente', v_cta.nombre_cliente, 'total', v_cta.total));
end;
$$;

grant execute on function public.reabrir_cuenta(uuid) to authenticated;

-- 6.5  Registrar compra  (solo admin) -------------------------------------
--      p_items: [{ "producto_id": "...", "cantidad": 10, "costo_unitario": 1800 }, ...]
create or replace function public.registrar_compra(
  p_proveedor text, p_nota text, p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_compra_id uuid;
  v_item      jsonb;
  v_pid       uuid;
  v_cant      numeric(12,3);
  v_costo     numeric(12,2);
  v_nuevo     numeric(12,3);
  v_total     numeric(12,2) := 0;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede registrar compras';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'La compra no tiene renglones';
  end if;

  insert into public.compras (proveedor, nota, creada_por)
  values (nullif(trim(coalesce(p_proveedor, '')), ''),
          nullif(trim(coalesce(p_nota, '')), ''),
          auth.uid())
  returning id into v_compra_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_pid   := (v_item ->> 'producto_id')::uuid;
    v_cant  := (v_item ->> 'cantidad')::numeric;
    v_costo := (v_item ->> 'costo_unitario')::numeric;

    if v_cant is null or v_cant <= 0 then raise exception 'Cantidad inválida en un renglón'; end if;
    if v_costo is null or v_costo < 0 then raise exception 'Costo inválido en un renglón'; end if;

    insert into public.compra_items (compra_id, producto_id, cantidad, costo_unitario)
    values (v_compra_id, v_pid, v_cant, v_costo);

    update public.productos
    set stock = stock + v_cant,
        costo = v_costo                     -- el costo del producto pasa a ser el de esta compra
    where id = v_pid
    returning stock into v_nuevo;

    if not found then raise exception 'Un renglón apunta a un producto inexistente'; end if;

    insert into public.movimientos_inventario
      (producto_id, tipo, cantidad, stock_resultante, referencia, nota, creado_por)
    values
      (v_pid, 'compra', v_cant, v_nuevo, v_compra_id::text, 'Compra', auth.uid());

    v_total := v_total + (v_cant * v_costo);
  end loop;

  update public.compras set total = v_total where id = v_compra_id;

  perform public.registrar_historial('registrar_compra', 'compra', v_compra_id,
    jsonb_build_object('total', v_total, 'renglones', jsonb_array_length(p_items)));
  return v_compra_id;
end;
$$;

-- 6.6  Ajuste de inventario tras conteo físico  (solo admin) -------------
create or replace function public.ajustar_inventario(
  p_producto_id uuid, p_nuevo_stock numeric, p_nota text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_actual numeric(12,3); v_dif numeric(12,3); v_nombre text;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede ajustar inventario';
  end if;
  if p_nuevo_stock is null or p_nuevo_stock < 0 then
    raise exception 'El stock no puede ser negativo';
  end if;

  select stock, nombre into v_actual, v_nombre
  from public.productos where id = p_producto_id for update;
  if not found then raise exception 'El producto no existe'; end if;

  v_dif := p_nuevo_stock - v_actual;
  update public.productos set stock = p_nuevo_stock where id = p_producto_id;

  insert into public.movimientos_inventario
    (producto_id, tipo, cantidad, stock_resultante, referencia, nota, creado_por)
  values
    (p_producto_id, 'ajuste', v_dif, p_nuevo_stock, 'conteo',
     coalesce(p_nota, 'Ajuste por conteo físico'), auth.uid());

  perform public.registrar_historial('ajustar_inventario', 'producto', p_producto_id,
    jsonb_build_object('antes', v_actual, 'despues', p_nuevo_stock,
                       'diferencia', v_dif, 'nota', p_nota));
end;
$$;


-- =============================================================================
--  7. VISTAS DE CONSULTA   (security_invoker = respetan el RLS de quien consulta)
-- =============================================================================
create or replace view public.v_inventario
with (security_invoker = on) as
select p.id, p.nombre, p.stock, p.stock_minimo, p.costo, p.precio,
       (p.stock * p.costo)::numeric(14,2) as valor_costo,
       (p.stock <= p.stock_minimo)        as alerta,
       p.activo
from public.productos p
order by p.nombre;

create or replace view public.v_stock_bajo
with (security_invoker = on) as
select id, nombre, stock, stock_minimo
from public.productos
where activo and stock <= stock_minimo
order by (stock - stock_minimo);

-- >>> Cambia 'America/Bogota' por tu zona horaria (ver arriba). <<<
create or replace view public.v_reporte_diario
with (security_invoker = on) as
select (cerrada_en at time zone 'America/Bogota')::date as dia,
       count(*)                                as cuentas,
       sum(total)::numeric(14,2)               as total,
       sum(pago_efectivo)::numeric(14,2)       as efectivo,
       sum(pago_transferencia)::numeric(14,2)  as transferencia
from public.cuentas
where estado = 'cerrada' and cerrada_en is not null
group by 1
order by 1 desc;


-- =============================================================================
--  8. SEGURIDAD  (Row Level Security)
--     Admin ve y hace todo.  Operador solo abre / edita / cierra cuentas
--     (y siempre a través de las funciones de arriba).
-- =============================================================================
alter table public.profiles                enable row level security;
alter table public.productos               enable row level security;
alter table public.compras                 enable row level security;
alter table public.compra_items            enable row level security;
alter table public.cuentas                 enable row level security;
alter table public.cuenta_items            enable row level security;
alter table public.movimientos_inventario  enable row level security;
alter table public.historial               enable row level security;

-- profiles -------------------------------------------------------------------
drop policy if exists profiles_select       on public.profiles;
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.es_admin());
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- productos: todos leen, solo admin escribe --------------------------------
drop policy if exists productos_select      on public.productos;
drop policy if exists productos_write_admin on public.productos;
create policy productos_select on public.productos
  for select to authenticated using (true);
create policy productos_write_admin on public.productos
  for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- compras: solo admin ------------------------------------------------------
drop policy if exists compras_admin      on public.compras;
drop policy if exists compra_items_admin on public.compra_items;
create policy compras_admin on public.compras
  for all to authenticated
  using (public.es_admin()) with check (public.es_admin());
create policy compra_items_admin on public.compra_items
  for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- cuentas / renglones: lectura para autenticados.
-- La escritura va SIEMPRE por las funciones SECURITY DEFINER, así que
-- no abrimos INSERT/UPDATE/DELETE directo desde el cliente.
drop policy if exists cuentas_select      on public.cuentas;
drop policy if exists cuenta_items_select on public.cuenta_items;
create policy cuentas_select on public.cuentas
  for select to authenticated using (true);
create policy cuenta_items_select on public.cuenta_items
  for select to authenticated using (true);

-- movimientos (kardex): lectura para autenticados -------------------------
drop policy if exists movimientos_select on public.movimientos_inventario;
create policy movimientos_select on public.movimientos_inventario
  for select to authenticated using (true);

-- historial: solo admin lo lee ------------------------------------------
drop policy if exists historial_admin on public.historial;
create policy historial_admin on public.historial
  for select to authenticated using (public.es_admin());

-- Permisos de ejecución de las funciones de negocio (solo usuarios logueados)
revoke execute on all functions in schema public from anon;
grant execute on function
  public.abrir_cuenta(text),
  public.agregar_item_cuenta(uuid, uuid, numeric),
  public.quitar_item_cuenta(uuid),
  public.actualizar_cantidad_item(uuid, numeric),
  public.cerrar_cuenta(uuid, text, numeric, numeric),
  public.registrar_compra(text, text, jsonb),
  public.ajustar_inventario(uuid, numeric, text)
to authenticated;

grant select on public.v_inventario, public.v_stock_bajo, public.v_reporte_diario
to authenticated;


-- =============================================================================
--  9. DATOS DE PRUEBA  (opcional, puedes borrar este bloque)
-- =============================================================================
insert into public.productos (nombre, costo, precio, stock, stock_minimo) values
  ('Cerveza 330ml', 1800, 4000, 48, 12),
  ('Agua 600ml',     600, 2000, 24,  6),
  ('Gaseosa 400ml',  900, 3000, 30,  6),
  ('Snack de papas',  700, 2500, 20,  5)
on conflict (nombre) do nothing;


-- =============================================================================
--  10. HACERTE ADMIN   ←   ejecutar DESPUÉS de crear tu primer usuario
-- =============================================================================
--  1) Crea tu usuario:  Supabase -> Authentication -> Users -> "Add user"
--     (marca "Auto Confirm User"), o regístrate desde la app.
--  2) Cambia el correo de abajo por el tuyo y ejecuta SOLO esta sentencia:
--
--  update public.profiles set rol = 'admin'
--  where id = (select id from auth.users where email = 'TU_CORREO@ejemplo.com');
--
--  A partir de ahí, desde la app (pantalla Usuarios) creas a los operadores.
-- =============================================================================


-- =============================================================================
--  11. MULTI-NEGOCIO (multi-tenant)  ·  PARTE 1: tabla `bares` + bar_id
--      Objetivo final: una sola app/base de datos puede atender a varios
--      bares, cada uno viendo solo sus propios productos, cuentas, etc.
--
--      Esta PARTE 1 es aditiva y segura de correr ya mismo:
--      - No borra ni cambia nada de lo que existe hoy.
--      - No cambia cómo se ve ni cómo funciona la app todavía.
--      - Solo prepara la base de datos: crea la tabla `bares`, le agrega
--        `bar_id` a cada tabla, y mete todo lo que ya tienes hoy dentro
--        de un bar llamado "La Esquina".
--
--      La PARTE 2 (seguridad: que cada bar solo vea lo suyo) viene después.
-- =============================================================================
create table if not exists public.bares (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  slug        text not null unique,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.bares is
  'Un registro por bar/negocio. Todo lo demás (productos, cuentas, etc.) queda amarrado a un bar_id.';

-- El bar que ya existe hoy, para no perder nada de lo que ya está cargado.
insert into public.bares (nombre, slug)
values ('La Esquina', 'la-esquina')
on conflict (slug) do nothing;

-- bar_id en cada tabla de negocio (nullable por ahora, se llena abajo)
alter table public.profiles               add column if not exists bar_id uuid references public.bares (id);
alter table public.productos              add column if not exists bar_id uuid references public.bares (id);
alter table public.compras                add column if not exists bar_id uuid references public.bares (id);
alter table public.compra_items           add column if not exists bar_id uuid references public.bares (id);
alter table public.cuentas                add column if not exists bar_id uuid references public.bares (id);
alter table public.cuenta_items           add column if not exists bar_id uuid references public.bares (id);
alter table public.movimientos_inventario add column if not exists bar_id uuid references public.bares (id);
alter table public.historial              add column if not exists bar_id uuid references public.bares (id);

-- Todo lo que ya existe hoy queda amarrado al bar "La Esquina"
do $$
declare v_bar_id uuid;
begin
  select id into v_bar_id from public.bares where slug = 'la-esquina';

  update public.profiles               set bar_id = v_bar_id where bar_id is null;
  update public.productos              set bar_id = v_bar_id where bar_id is null;
  update public.compras                set bar_id = v_bar_id where bar_id is null;
  update public.compra_items           set bar_id = v_bar_id where bar_id is null;
  update public.cuentas                set bar_id = v_bar_id where bar_id is null;
  update public.cuenta_items           set bar_id = v_bar_id where bar_id is null;
  update public.movimientos_inventario set bar_id = v_bar_id where bar_id is null;
  update public.historial              set bar_id = v_bar_id where bar_id is null;
end $$;

-- Ya con todo lleno, bar_id pasa a ser obligatorio
alter table public.profiles               alter column bar_id set not null;
alter table public.productos              alter column bar_id set not null;
alter table public.compras                alter column bar_id set not null;
alter table public.compra_items           alter column bar_id set not null;
alter table public.cuentas                alter column bar_id set not null;
alter table public.cuenta_items           alter column bar_id set not null;
alter table public.movimientos_inventario alter column bar_id set not null;
alter table public.historial              alter column bar_id set not null;

-- El nombre de producto ya no es único "global", sino único POR bar
-- (dos bares distintos sí pueden tener cada uno su "Cerveza 330ml").
alter table public.productos drop constraint if exists productos_nombre_key;
alter table public.productos add constraint productos_nombre_bar_unique unique (bar_id, nombre);

-- Índices para que filtrar por bar sea rápido
create index if not exists profiles_bar_idx              on public.profiles (bar_id);
create index if not exists productos_bar_idx              on public.productos (bar_id);
create index if not exists compras_bar_idx                on public.compras (bar_id);
create index if not exists compra_items_bar_idx           on public.compra_items (bar_id);
create index if not exists cuentas_bar_idx                on public.cuentas (bar_id);
create index if not exists cuenta_items_bar_idx           on public.cuenta_items (bar_id);
create index if not exists movimientos_inventario_bar_idx on public.movimientos_inventario (bar_id);
create index if not exists historial_bar_idx              on public.historial (bar_id);
-- =============================================================================
