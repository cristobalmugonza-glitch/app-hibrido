import type { Datos, Musculo } from '../tipos/modelo';
import { NOMBRE_MUSCULO, TREN_INFERIOR } from '../data/reglas-tipo';
import { diaLocal } from './fechas';
import { fmt0 } from './formato';
import { hechasEnSemana, listaBloques, NOMBRE_RUNNING, type Bloque } from './planificacion';
import { inicioSemana } from './semanas';
import { definiciones, seriesHechas, seriesPorSesion } from './volumen';

export const HORAS_MUSCULO = 48;
export const HORAS_IMPACTO = 24;
const SERIES_FUERTE = 3; // series (fraccionadas) desde las que un músculo quedó cargado

export type AvisoBloque = { texto: string; porQue: string };

export type EstadoBloque = Bloque & { hechas: number; pendientes: number; avisos: AvisoBloque[]; ultimaVez: string | null };

export const listaTexto = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`);
const horasTexto = (h: number) => (h < 1 ? 'menos de 1 h' : `${fmt0(h)} h`);
const horasDesde = (fecha: string, ahora: Date) => (ahora.getTime() - new Date(fecha).getTime()) / 3_600_000;

type Reciente = { nombre: string; horas: number };

// Horas desde la última sesión que cargó cada músculo con 3 series o más, dentro de las últimas 48 h.
function musculosCargados(datos: Datos, ahora: Date): Partial<Record<Musculo, number>> {
  const defs = definiciones(datos);
  const res: Partial<Record<Musculo, number>> = {};
  for (const s of datos.sesionesGym) {
    const h = horasDesde(s.fecha, ahora);
    if (h < 0 || h >= HORAS_MUSCULO) continue;
    const series = seriesHechas([s], defs);
    for (const m of Object.keys(series) as Musculo[]) {
      if (series[m] >= SERIES_FUERTE && (res[m] === undefined || h < res[m]!)) res[m] = h;
    }
  }
  return res;
}

function ultimaPiernas(datos: Datos, ahora: Date): Reciente | null {
  const defs = definiciones(datos);
  let mejor: Reciente | null = null;
  for (const s of datos.sesionesGym) {
    const h = horasDesde(s.fecha, ahora);
    if (h < 0 || h >= HORAS_IMPACTO) continue;
    const series = seriesHechas([s], defs);
    if (TREN_INFERIOR.reduce((a, m) => a + series[m], 0) >= 4 && (!mejor || h < mejor.horas)) mejor = { nombre: s.nombre, horas: h };
  }
  return mejor;
}

function ultimaExigente(datos: Datos, ahora: Date): Reciente | null {
  let mejor: Reciente | null = null;
  for (const s of datos.sesionesRunning) {
    if (s.tipo !== 'calidad' && s.tipo !== 'fondo') continue;
    const h = horasDesde(s.fecha, ahora);
    if (h >= 0 && h < HORAS_IMPACTO && (!mejor || h < mejor.horas)) mejor = { nombre: NOMBRE_RUNNING[s.tipo], horas: h };
  }
  return mejor;
}

function ultimaVezBloque(datos: Datos, b: Bloque): string | null {
  const ref = b.ref;
  const fechas =
    ref.clase === 'gym'
      ? datos.sesionesGym.filter((s) => s.plantillaId === ref.plantillaId).map((s) => s.fecha)
      : datos.sesionesRunning.filter((s) => (s.tipo === 'test' ? 'z2' : s.tipo) === ref.tipo).map((s) => s.fecha);
  return fechas.length ? fechas.reduce((a, f) => (f > a ? f : a)) : null;
}

export function estadoBloques(datos: Datos, ahora = new Date()): EstadoBloque[] {
  const hechas = hechasEnSemana(datos, inicioSemana(ahora));
  const cargados = musculosCargados(datos, ahora);
  const piernas = ultimaPiernas(datos, ahora);
  const exigente = ultimaExigente(datos, ahora);

  return listaBloques(datos).map((b) => {
    const avisos: AvisoBloque[] = [];
    const ref = b.ref;
    if (ref.clase === 'gym') {
      const plantilla = datos.rutina.plantillas.find((p) => p.id === ref.plantillaId);
      const porSesion = plantilla ? seriesPorSesion(plantilla) : null;
      if (porSesion) {
        const choque = (Object.keys(porSesion) as Musculo[]).filter((m) => porSesion[m] >= SERIES_FUERTE && cargados[m] !== undefined);
        if (choque.length) {
          const h = Math.min(...choque.map((m) => cargados[m]!));
          avisos.push({ texto: `Entrenaste ${listaTexto(choque.map((m) => NOMBRE_MUSCULO[m].toLowerCase()))} hace ${horasTexto(h)}: dales 48 h`, porQue: 'recuperacion' });
        }
        if (exigente && TREN_INFERIOR.some((m) => porSesion[m] >= SERIES_FUERTE)) {
          avisos.push({ texto: `${exigente.nombre} hace ${horasTexto(exigente.horas)}: las piernas llegan cansadas`, porQue: 'piernas_impacto' });
        }
      }
    } else if (ref.tipo !== 'z2') {
      if (piernas) avisos.push({ texto: `${piernas.nombre} hace ${horasTexto(piernas.horas)}: el impacto llega con las piernas cargadas`, porQue: 'piernas_impacto' });
      if (exigente) avisos.push({ texto: `${exigente.nombre} hace ${horasTexto(exigente.horas)}: separa las carreras exigentes con un día suave`, porQue: 'recuperacion' });
    }
    const n = hechas.get(b.key) ?? 0;
    return { ...b, hechas: n, pendientes: Math.max(0, b.veces - n), avisos, ultimaVez: ultimaVezBloque(datos, b) };
  });
}

export type SesionDeHoy = { nombre: string; clase: 'gym' | 'running'; horas: number };

// La sesión más reciente del día (para la guía de sesiones dobles).
export function sesionDeHoy(datos: Datos, ahora = new Date()): SesionDeHoy | null {
  const hoy = diaLocal(ahora);
  const candidatas: (SesionDeHoy & { fecha: string })[] = [
    ...datos.sesionesGym.filter((s) => diaLocal(s.fecha) === hoy).map((s) => ({ nombre: s.nombre, clase: 'gym' as const, fecha: s.fecha, horas: horasDesde(s.fecha, ahora) })),
    ...datos.sesionesRunning.filter((s) => diaLocal(s.fecha) === hoy).map((s) => ({ nombre: NOMBRE_RUNNING[s.tipo], clase: 'running' as const, fecha: s.fecha, horas: horasDesde(s.fecha, ahora) })),
  ];
  if (!candidatas.length) return null;
  const { fecha: _, ...ultima } = candidatas.reduce((a, b) => (b.fecha > a.fecha ? b : a));
  return ultima;
}

export type SugerenciaDia =
  | { tipo: 'bloque'; bloque: EstadoBloque; motivo: string }
  | { tipo: 'descanso'; motivo: string }
  | { tipo: 'completa' };

// Elige entre lo pendiente de la semana lo que no choca con la recuperación; a igualdad, lo que más falta y lo que hace más tiempo no haces.
export function sugerirBloque(estados: EstadoBloque[]): SugerenciaDia {
  const pendientes = estados.filter((e) => e.pendientes > 0);
  if (!pendientes.length) return { tipo: 'completa' };
  const libres = pendientes.filter((e) => !e.avisos.length);
  if (!libres.length) {
    return { tipo: 'descanso', motivo: `Lo que te queda (${listaTexto(pendientes.map((e) => e.nombre))}) pide recuperación. Descansa o haz algo suave.` };
  }
  const orden = estados.map((e) => e.key);
  const [mejor] = [...libres].sort(
    (a, b) => b.pendientes - a.pendientes || (a.ultimaVez ?? '').localeCompare(b.ultimaVez ?? '') || orden.indexOf(a.key) - orden.indexOf(b.key),
  );
  const motivo = mejor.pendientes > 1 ? `Te quedan ${mejor.pendientes} esta semana y estás recuperado para hacerlo.` : 'Pendiente esta semana y estás recuperado para hacerlo.';
  return { tipo: 'bloque', bloque: mejor, motivo };
}
