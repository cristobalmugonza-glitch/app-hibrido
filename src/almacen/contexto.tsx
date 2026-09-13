import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Datos } from '../tipos/modelo';
import { asegurarPlanSemana } from '../motor/planificacion';
import { borrarTodo, cargar, guardar } from './storage';

type Almacen = {
  datos: Datos | null; // null = primera vez: toca el onboarding
  actualizar: (f: (d: Datos) => Datos) => void;
  reemplazar: (d: Datos | null) => void;
};

const Ctx = createContext<Almacen | null>(null);

export function DatosProvider({ children }: { children: ReactNode }) {
  const [datos, setDatos] = useState<Datos | null>(() => cargar());

  const actualizar = useCallback((f: (d: Datos) => Datos) => {
    setDatos((prev) => {
      if (!prev) return prev;
      const siguiente = f(prev);
      if (siguiente !== prev) guardar(siguiente);
      return siguiente;
    });
  }, []);

  const reemplazar = useCallback((d: Datos | null) => {
    if (d) guardar(d);
    else borrarTodo();
    setDatos(d);
  }, []);

  // Pide almacenamiento persistente para que el navegador no borre los datos (iOS en especial).
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => undefined);
  }, []);

  // Datos recién migrados se guardan de inmediato en el formato nuevo.
  useEffect(() => {
    if (datos) guardar(datos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al abrir la app, y al volver a ella, fija el tipo de la semana en curso si todavía no lo tiene.
  useEffect(() => {
    const revisar = () => {
      if (document.visibilityState === 'visible') actualizar((d) => asegurarPlanSemana(d, new Date()));
    };
    revisar();
    document.addEventListener('visibilitychange', revisar);
    return () => document.removeEventListener('visibilitychange', revisar);
  }, [actualizar]);

  return <Ctx.Provider value={{ datos, actualizar, reemplazar }}>{children}</Ctx.Provider>;
}

export function useAlmacen(): Almacen {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAlmacen fuera de DatosProvider');
  return v;
}

// Para pantallas que solo existen cuando ya hay datos (después del onboarding).
export function useDatos(): { datos: Datos; actualizar: Almacen['actualizar']; reemplazar: Almacen['reemplazar'] } {
  const { datos, actualizar, reemplazar } = useAlmacen();
  if (!datos) throw new Error('useDatos sin datos: la pantalla debería estar detrás del onboarding');
  return { datos, actualizar, reemplazar };
}
