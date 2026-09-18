/**
 * Catálogo de módulos activables por bar. Sin dependencias de servidor:
 * lo puede importar tanto código de servidor como componentes de cliente
 * (ej. los checkboxes del panel del dueño).
 */
export const MODULOS_OPCIONALES = [
  { id: "productos", label: "Productos" },
  { id: "compras", label: "Compras" },
  { id: "inventario", label: "Inventario" },
  { id: "reportes", label: "Reportes" },
  { id: "historial", label: "Historial" },
  { id: "usuarios", label: "Usuarios" },
] as const;

export type ModuloId = (typeof MODULOS_OPCIONALES)[number]["id"];

export const TODOS_LOS_MODULOS: ModuloId[] = MODULOS_OPCIONALES.map((m) => m.id);
