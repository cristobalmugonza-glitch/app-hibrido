import type { Datos } from '../tipos/modelo';
import { datosSemilla } from '../data/semilla';

const CLAVE = 'hibrido:datos:v1';

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

export function esDatosValidos(x: unknown): x is Datos {
  if (!esObjeto(x) || x.version !== 1) return false;
  const { perfil, rutina, cola } = x;
  return (
    esObjeto(perfil) &&
    typeof perfil.fcMax === 'number' &&
    esObjeto(rutina) &&
    Array.isArray(rutina.plantillas) &&
    Array.isArray(rutina.secuencia) &&
    esObjeto(cola) &&
    typeof cola.posicion === 'number' &&
    typeof cola.vueltasCompletadas === 'number'
  );
}

// Completa campos que falten (por ejemplo, un respaldo de una versión anterior) sin reinyectar datos de la semilla.
export function normalizar(d: Datos): Datos {
  const base = datosSemilla();
  return {
    ...d,
    perfil: { ...base.perfil, ...d.perfil },
    rutina: { ...d.rutina, prioridades: { ...base.rutina.prioridades, ...d.rutina.prioridades } },
    historialCola: d.historialCola ?? [],
    sesionesGym: d.sesionesGym ?? [],
    sesionesRunning: d.sesionesRunning ?? [],
    pesos: d.pesos ?? [],
    molestias: d.molestias ?? [],
    medidas: d.medidas ?? [],
    dominadas: d.dominadas ?? [],
  };
}

export function cargar(): Datos {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (crudo) {
      const obj: unknown = JSON.parse(crudo);
      if (esDatosValidos(obj)) return normalizar(obj);
    }
  } catch (e) {
    console.error('No se pudieron leer los datos guardados', e);
  }
  return datosSemilla();
}

export function guardar(datos: Datos): boolean {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos));
    return true;
  } catch (e) {
    console.error('No se pudieron guardar los datos', e);
    return false;
  }
}

export function nuevoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      // contexto no seguro (http en la red local): cae al id simple
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
