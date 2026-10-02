-- =============================================================================
--  GANANCIAS: pega TODO este archivo en Supabase -> SQL Editor -> Run.
--  Es seguro correrlo más de una vez. No borra ni cambia datos existentes:
--  agrega una columna, reemplaza cerrar_cuenta (ahora guarda el costo al
--  cobrar), crea 3 funciones de reporte y prende el módulo "ganancias" en los
--  negocios que ya tienen "reportes".
-- =============================================================================

-- A) Columna del costo por renglón + datos de ventas anteriores + funciones
-- =============================================================================
--  12. GANANCIAS  (módulo "ganancias")
--      Ganancia = lo vendido - lo que costó. Para que sea real, cada renglón
--      de una cuenta guarda el COSTO del producto en el momento de cobrar
--      (cerrar_cuenta lo congela). El costo del producto es el de la última
--      compra registrada.  Solo administradores pueden consultarlo.
-- =============================================================================
alter table public.cuenta_items
  add column if not exists costo_unitario numeric(12,2) check (costo_unitario >= 0);

-- Ventas ya cerradas antes de esta función: se aproximan con el costo actual
-- del producto (de ahí en adelante cada cobro guarda su costo exacto).
update public.cuenta_items ci
set costo_unitario = p.costo
from public.productos p, public.cuentas c
where ci.producto_id = p.id
  and ci.cuenta_id = c.id
  and c.estado = 'cerrada'
  and ci.costo_unitario is null;

-- Negocios nuevos nacen con el módulo incluido
alter table public.bares alter column modulos set default
  '["productos","compras","inventario","reportes","ganancias","historial","usuarios"]'::jsonb;

-- 12.1  Ventas, costo y # de cuentas por periodo (día / semana / mes / año) ---
--       Fechas y cortes en hora de Colombia. La semana empieza el lunes y su
--       clave es la fecha de ese lunes.
create or replace function public.ganancias_por_periodo(
  p_desde date, p_hasta date, p_bucket text
)
returns table (clave text, n_cuentas bigint, ventas numeric, costo numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ini timestamptz;
  v_fin timestamptz;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede ver las ganancias';
  end if;
  if p_bucket not in ('dia', 'semana', 'mes', 'anio') then
    raise exception 'Agrupación inválida';
  end if;

  v_ini := p_desde::timestamp at time zone 'America/Bogota';
  v_fin := (p_hasta + 1)::timestamp at time zone 'America/Bogota';

  return query
  select
    case p_bucket
      when 'dia'    then to_char(c.cerrada_en at time zone 'America/Bogota', 'YYYY-MM-DD')
      when 'semana' then to_char(date_trunc('week', c.cerrada_en at time zone 'America/Bogota'), 'YYYY-MM-DD')
      when 'mes'    then to_char(c.cerrada_en at time zone 'America/Bogota', 'YYYY-MM')
      else               to_char(c.cerrada_en at time zone 'America/Bogota', 'YYYY')
    end,
    count(distinct c.id),
    coalesce(sum(ci.cantidad * ci.precio_unitario), 0)::numeric,
    coalesce(sum(ci.cantidad * coalesce(ci.costo_unitario, 0)), 0)::numeric
  from public.cuentas c
  join public.cuenta_items ci on ci.cuenta_id = c.id
  where c.bar_id = public.mi_bar_id()
    and c.estado = 'cerrada'
    and c.cerrada_en >= v_ini
    and c.cerrada_en <  v_fin
  group by 1
  order by 1;
end;
$$;

-- 12.2  Ventas, costo y cantidad por producto en un rango de fechas ---------
create or replace function public.ganancias_por_producto(p_desde date, p_hasta date)
returns table (producto_id uuid, nombre text, cantidad numeric, ventas numeric, costo numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ini timestamptz;
  v_fin timestamptz;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede ver las ganancias';
  end if;

  v_ini := p_desde::timestamp at time zone 'America/Bogota';
  v_fin := (p_hasta + 1)::timestamp at time zone 'America/Bogota';

  return query
  select
    ci.producto_id,
    max(ci.nombre_producto),
    sum(ci.cantidad)::numeric,
    coalesce(sum(ci.cantidad * ci.precio_unitario), 0)::numeric,
    coalesce(sum(ci.cantidad * coalesce(ci.costo_unitario, 0)), 0)::numeric
  from public.cuentas c
  join public.cuenta_items ci on ci.cuenta_id = c.id
  where c.bar_id = public.mi_bar_id()
    and c.estado = 'cerrada'
    and c.cerrada_en >= v_ini
    and c.cerrada_en <  v_fin
  group by ci.producto_id
  order by sum(ci.cantidad * (ci.precio_unitario - coalesce(ci.costo_unitario, 0))) desc
  limit 500;
end;
$$;

-- 12.3  Foto del inventario actual: cuánto costó y cuánto dejaría vendido ---
create or replace function public.ganancias_stock()
returns table (productos bigint, valor_costo numeric, valor_venta numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede ver las ganancias';
  end if;

  return query
  select
    count(*),
    coalesce(sum(p.stock * p.costo), 0)::numeric,
    coalesce(sum(p.stock * p.precio), 0)::numeric
  from public.productos p
  where p.bar_id = public.mi_bar_id()
    and p.activo
    and p.stock > 0;
end;
$$;

revoke execute on function
  public.ganancias_por_periodo(date, date, text),
  public.ganancias_por_producto(date, date),
  public.ganancias_stock()
from public, anon;
grant execute on function
  public.ganancias_por_periodo(date, date, text),
  public.ganancias_por_producto(date, date),
  public.ganancias_stock()
to authenticated;

-- B) cerrar_cuenta ahora congela el costo de cada renglón al cobrar
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
  select * into v_cta from public.cuentas
  where id = p_cuenta_id and bar_id = public.mi_bar_id() for update;
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
    from public.productos
    where id = v_item.producto_id and bar_id = public.mi_bar_id() for update;

    if v_nuevo < 0 then
      raise exception 'Stock insuficiente de "%": no alcanza para % unidades',
        v_item.nombre_producto, v_item.cantidad;
    end if;

    update public.productos set stock = v_nuevo where id = v_item.producto_id;

    insert into public.movimientos_inventario
      (producto_id, tipo, cantidad, stock_resultante, referencia, nota, creado_por, bar_id)
    values
      (v_item.producto_id, 'venta', -v_item.cantidad, v_nuevo, p_cuenta_id::text,
       'Cuenta ' || v_cta.nombre_cliente, auth.uid(), public.mi_bar_id());
  end loop;

  -- Congela el costo de cada renglón en el momento de cobrar: así la ganancia
  -- de esta venta no cambia aunque el costo del producto suba o baje después.
  update public.cuenta_items ci
  set costo_unitario = p.costo
  from public.productos p
  where ci.cuenta_id = p_cuenta_id and p.id = ci.producto_id;

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

-- C) Prender el módulo "Ganancias" donde ya está "Reportes"
update public.bares
set modulos = modulos || '["ganancias"]'::jsonb
where modulos is not null
  and modulos ? 'reportes'
  and not (modulos ? 'ganancias');
