import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Datos } from '../tipos/modelo';
import { cargar, guardar } from './storage';

type Valor = { datos: Datos; actualizar: (f: (d: Datos) => Datos) => void };

const Ctx = createContext<Valor | null>(null);

export function DatosProvider({ children }: { children: ReactNode }) {
  const [datos, setDatos] = useState<Datos>(cargar);

  const actualizar = useCallback((f: (d: Datos) => Datos) => {
    setDatos((prev) => {
      const siguiente = f(prev);
      guardar(siguiente);
      return siguiente;
    });
  }, []);

  // Pide almacenamiento persistente para que el navegador no borre los datos (iOS en especial).
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => undefined);
  }, []);

  return <Ctx.Provider value={{ datos, actualizar }}>{children}</Ctx.Provider>;
}

export function useDatos(): Valor {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDatos fuera de DatosProvider');
  return v;
}
