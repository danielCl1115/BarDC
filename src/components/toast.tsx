"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";

type Tono = "good" | "crit";
type Toast = { id: number; mensaje: string; tono: Tono };

const ToastContext = createContext<{ mostrarToast: (mensaje: string, tono?: Tono) => void } | null>(
  null,
);

/** Envolver la app con esto una vez (ya está en el layout). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const mostrarToast = useCallback((mensaje: string, tono: Tono = "good") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, mensaje, tono }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
              t.tono === "good" ? "bg-ink" : "bg-crit"
            }`}
          >
            <Icon name={t.tono === "good" ? "check" : "alert"} size={15} />
            {t.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Llama a mostrarToast("Guardado exitosamente") tras una acción que salió bien. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
