import type { Datos, EjercicioDef, SesionRunning } from '../tipos/modelo';
import { nuevoId } from '../almacen/storage';
import { ahoraIso } from './fechas';
import { completarPaso, contexto, pasoActual } from './secuencia';

export function iniciarGym(datos: Datos, plantillaId: string, pasoId: string | null): Datos {
  const plantilla = datos.rutina.plantillas.find((p) => p.id === plantillaId);
  if (!plantilla) return datos;
  const ctx = contexto(datos.cola);
  return {
    ...datos,
    borradorGym: {
      pasoId,
      indiceEjercicio: 0,
      sesion: {
        id: nuevoId(),
        fecha: ahoraIso(),
        plantillaId,
        nombre: plantilla.nombre,
        ciclo: ctx.ciclo,
        vuelta: ctx.vuelta,
        descarga: pasoId !== null && ctx.descarga,
        planificada: pasoId !== null,
        ejercicios: [],
      },
    },
  };
}

export function faltantesTobillo(datos: Datos): EjercicioDef[] {
  const b = datos.borradorGym;
  if (!b) return [];
  const plantilla = datos.rutina.plantillas.find((p) => p.id === b.sesion.plantillaId);
  return (plantilla?.ejercicios ?? []).filter((e) => e.esProtocoloTobillo && !b.sesion.ejercicios.some((r) => r.ejercicioId === e.id && r.series.length > 0));
}

export function terminarGym(datos: Datos): Datos {
  const b = datos.borradorGym;
  if (!b) return datos;
  const sesion = { ...b.sesion, ejercicios: b.sesion.ejercicios.filter((e) => e.series.length > 0) };
  let d: Datos = { ...datos, sesionesGym: [...datos.sesionesGym, sesion], borradorGym: undefined };
  if (b.pasoId && pasoActual(d.rutina, d.cola)?.id === b.pasoId) d = completarPaso(d, 'hecha', sesion.id);
  return d;
}

export function guardarRunning(datos: Datos, s: Omit<SesionRunning, 'id' | 'ciclo' | 'vuelta'>, pasoId: string | null): Datos {
  const ctx = contexto(datos.cola);
  const sesion: SesionRunning = { ...s, id: nuevoId(), ciclo: ctx.ciclo, vuelta: ctx.vuelta };
  let d: Datos = { ...datos, sesionesRunning: [...datos.sesionesRunning, sesion] };
  if (pasoId && pasoActual(d.rutina, d.cola)?.id === pasoId) d = completarPaso(d, 'hecha', sesion.id);
  return d;
}
