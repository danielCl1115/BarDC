/**
 * Tipos de la aplicación (versión a mano, legible).
 * Para generar los tipos exactos desde la base:
 *   npx supabase gen types typescript --project-id TU_ID > src/lib/database.types.ts
 */

export type Rol = "admin" | "operador";
export type EstadoCuenta = "abierta" | "cerrada";
export type MetodoPago = "efectivo" | "transferencia" | "mixto";
export type TipoMovimiento = "compra" | "venta" | "ajuste";

export interface Perfil {
  id: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  created_at: string;
}

export interface Producto {
  id: string;
  nombre: string;
  costo: number;
  precio: number;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cuenta {
  id: string;
  nombre_cliente: string;
  estado: EstadoCuenta;
  total: number;
  metodo_pago: MetodoPago | null;
  pago_efectivo: number;
  pago_transferencia: number;
  abierta_por: string | null;
  cerrada_por: string | null;
  abierta_en: string;
  cerrada_en: string | null;
}

export interface CuentaItem {
  id: string;
  cuenta_id: string;
  producto_id: string;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
}

export interface Compra {
  id: string;
  proveedor: string | null;
  nota: string | null;
  total: number;
  creada_por: string | null;
  created_at: string;
}

export interface MovimientoInventario {
  id: string;
  producto_id: string;
  tipo: TipoMovimiento;
  cantidad: number;
  stock_resultante: number;
  referencia: string | null;
  nota: string | null;
  creado_por: string | null;
  created_at: string;
}

export interface HistorialEntrada {
  id: string;
  actor: string | null;
  actor_nombre: string | null;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  detalle: Record<string, unknown> | null;
  created_at: string;
}

export interface InventarioFila {
  id: string;
  nombre: string;
  stock: number;
  stock_minimo: number;
  costo: number;
  precio: number;
  valor_costo: number;
  alerta: boolean;
  activo: boolean;
}

export interface ReporteDia {
  dia: string;
  cuentas: number;
  total: number;
  efectivo: number;
  transferencia: number;
}
