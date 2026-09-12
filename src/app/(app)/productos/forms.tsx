"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { crearProducto, actualizarProducto, eliminarProducto } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputClass, Modal, buttonVariants } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/toast";
import type { ActionState } from "@/lib/action";
import type { Producto } from "@/lib/types";

export function NuevoProducto() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    crearProducto,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const { mostrarToast } = useToast();

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      mostrarToast("Producto creado exitosamente");
    }
  }, [state, mostrarToast]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end"
    >
      <div className="lg:col-span-2">
        <Field label="Nombre">
          <input name="nombre" required className={inputClass} />
        </Field>
      </div>
      <Field label="Costo">
        <input name="costo" type="number" min="0" step="0.01" defaultValue="0" className={inputClass} />
      </Field>
      <Field label="Precio">
        <input name="precio" type="number" min="0" step="0.01" defaultValue="0" className={inputClass} />
      </Field>
      <Field label="Stock inicial">
        <input name="stock" type="number" min="0" step="0.001" defaultValue="0" className={inputClass} />
      </Field>
      <Field label="Stock mínimo">
        <input name="stock_minimo" type="number" min="0" step="0.001" defaultValue="0" className={inputClass} />
      </Field>

      {state?.error ? (
        <p className="text-sm text-crit sm:col-span-2 lg:col-span-6">
          {state.error}
        </p>
      ) : null}

      <div className="sm:col-span-2 lg:col-span-6">
        <SubmitButton pendingText="Creando..." icon="plus">
          Crear producto
        </SubmitButton>
      </div>
    </form>
  );
}

export function EditarProducto({ producto }: { producto: Producto }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState<ActionState, FormData>(
    actualizarProducto,
    null,
  );
  const { mostrarToast } = useToast();

  useEffect(() => {
    if (state?.ok) {
      dialogRef.current?.close();
      mostrarToast("Guardado exitosamente");
    }
  }, [state, mostrarToast]);

  const cerrar = () => dialogRef.current?.close();

  return (
    <>
      <button
        onClick={() => dialogRef.current?.showModal()}
        title="Editar producto"
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-3 hover:bg-plane hover:text-ink"
      >
        <Icon name="pencil" size={15} />
      </button>

      <Modal dialogRef={dialogRef} title={`Editar «${producto.nombre}»`} onClose={cerrar}>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={producto.id} />

          <Field label="Nombre">
            <input name="nombre" defaultValue={producto.nombre} className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Costo">
              <input
                name="costo"
                type="number"
                step="0.01"
                defaultValue={producto.costo}
                className={inputClass}
              />
            </Field>
            <Field label="Precio">
              <input
                name="precio"
                type="number"
                step="0.01"
                defaultValue={producto.precio}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Stock mínimo" hint="Debajo de esto se marca como alerta">
            <input
              name="stock_minimo"
              type="number"
              step="0.001"
              defaultValue={producto.stock_minimo}
              className={inputClass}
            />
          </Field>

          {state?.error ? <p className="text-sm text-crit">{state.error}</p> : null}

          <div className="flex justify-end gap-2 border-t border-ink/8 pt-4">
            <button
              type="button"
              onClick={cerrar}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${buttonVariants.secondary}`}
            >
              Cancelar
            </button>
            <SubmitButton pendingText="Guardando...">Guardar cambios</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

/** Botón rojo del modal de eliminar: arranca deshabilitado ~1s para que
 *  nadie lo confirme sin alcanzar a leer la pregunta. */
function BotonConfirmarEliminar({ listo }: { listo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || !listo}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants.danger}`}
    >
      <Icon name="trash" size={16} />
      {pending ? "Eliminando..." : listo ? "Sí, eliminar" : "Espera..."}
    </button>
  );
}

export function EliminarProducto({ producto }: { producto: Producto }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [listo, setListo] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(
    eliminarProducto,
    null,
  );
  const { mostrarToast } = useToast();

  useEffect(() => {
    if (state?.ok) {
      dialogRef.current?.close();
      mostrarToast("Producto eliminado");
    }
  }, [state, mostrarToast]);

  const abrir = () => {
    setListo(false);
    dialogRef.current?.showModal();
    setTimeout(() => setListo(true), 900);
  };
  const cerrar = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        title="Eliminar producto"
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-3 hover:bg-crit/10 hover:text-crit"
      >
        <Icon name="trash" size={15} />
      </button>

      <Modal dialogRef={dialogRef} title="Eliminar producto" onClose={cerrar}>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={producto.id} />

          <p className="text-sm text-ink-2">
            ¿Seguro que deseas eliminar <strong className="text-ink">«{producto.nombre}»</strong>?
            Esta acción no se puede deshacer.
          </p>

          {state?.error ? <p className="text-sm text-crit">{state.error}</p> : null}

          <div className="flex justify-end gap-2 border-t border-ink/8 pt-4">
            <button
              type="button"
              onClick={cerrar}
              autoFocus
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${buttonVariants.secondary}`}
            >
              Cancelar
            </button>
            <BotonConfirmarEliminar listo={listo} />
          </div>
        </form>
      </Modal>
    </>
  );
}
