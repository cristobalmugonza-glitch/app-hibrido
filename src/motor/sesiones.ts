import type { Datos, EjercicioDef, SesionRunning } from '../tipos/modelo';
import { nuevoId } from '../almacen/storage';
import { ahoraIso } from './fechas';

export function iniciarGym(datos: Datos, plantillaId: string, descarga: boolean): Datos {
  const plantilla = datos.rutina.plantillas.find((p) => p.id === plantillaId);
  if (!plantilla || datos.borradorGym) return datos;
  return {
    ...datos,
    borradorGym: {
      indiceEjercicio: 0,
      sesion: { id: nuevoId(), fecha: ahoraIso(), plantillaId, nombre: plantilla.nombre, descarga, ejercicios: [] },
    },
  };
}

export function faltantesTobillo(datos: Datos): EjercicioDef[] {
  const b = datos.borradorGym;
  if (!b) return [];
  const plantilla = datos.rutina.plantillas.find((p) => p.id === b.sesion.plantillaId);
  return (plantilla?.ejercicios ?? []).filter((e) => e.esProtocoloTobillo && !b.sesion.ejercicios.some((r) => r.ejercicioId === e.id && r.series.length > 0));
}

// Guarda la sesión con una copia de los músculos de cada ejercicio: el historial no cambia si después editas la rutina.
export function terminarGym(datos: Datos): Datos {
  const b = datos.borradorGym;
  if (!b) return datos;
  const defs = datos.rutina.plantillas.find((p) => p.id === b.sesion.plantillaId)?.ejercicios ?? [];
  const ejercicios = b.sesion.ejercicios
    .filter((e) => e.series.length > 0)
    .map((e) => {
      const def = defs.find((d) => d.id === e.ejercicioId);
      return def ? { ...e, musculos: [...def.musculos], ...(def.secundarios?.length ? { secundarios: [...def.secundarios] } : {}) } : e;
    });
  return { ...datos, sesionesGym: [...datos.sesionesGym, { ...b.sesion, ejercicios }], borradorGym: undefined };
}

export function guardarRunning(datos: Datos, s: Omit<SesionRunning, 'id'>): Datos {
  return { ...datos, sesionesRunning: [...datos.sesionesRunning, { ...s, id: nuevoId() }] };
}

export function borrarSesion(datos: Datos, id: string): Datos {
  return {
    ...datos,
    sesionesGym: datos.sesionesGym.filter((s) => s.id !== id),
    sesionesRunning: datos.sesionesRunning.filter((s) => s.id !== id),
  };
}
