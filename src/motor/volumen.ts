import type { Datos, EjercicioDef, Musculo, PlantillaGym, Prioridad, Rutina, SesionGym } from '../tipos/modelo';
import { MUSCULOS, OBJETIVO_SERIES } from '../data/reglas-tipo';

export const ceros = (): Record<Musculo, number> => Object.fromEntries(MUSCULOS.map((m) => [m, 0])) as Record<Musculo, number>;

// Conteo fraccionado: 1 serie al músculo principal y 0,5 a cada secundario (Pelland 2026).
function sumar(total: Record<Musculo, number>, musculos: Musculo[], secundarios: Musculo[] | undefined, series: number) {
  for (const m of musculos) total[m] += series;
  for (const m of secundarios ?? []) total[m] += series * 0.5;
}

export function seriesPorSesion(p: PlantillaGym): Record<Musculo, number> {
  const total = ceros();
  for (const e of p.ejercicios) sumar(total, e.musculos, e.secundarios, e.series);
  return total;
}

// Series por semana según el plan: cada sesión cuenta tantas veces como se planifica.
export function seriesPlanificadas(rutina: Rutina, descarga = false): Record<Musculo, number> {
  const total = ceros();
  for (const p of rutina.plantillas) {
    if (p.vecesPorSemana <= 0) continue;
    for (const e of p.ejercicios) sumar(total, e.musculos, e.secundarios, (descarga ? Math.ceil(e.series / 2) : e.series) * p.vecesPorSemana);
  }
  return total;
}

export function definiciones(datos: Datos): Map<string, EjercicioDef> {
  const defs = new Map<string, EjercicioDef>();
  for (const e of datos.ejerciciosPropios) defs.set(e.id, e);
  for (const p of datos.rutina.plantillas) for (const e of p.ejercicios) defs.set(e.id, e);
  return defs;
}

// Series hechas. Usa la copia de músculos guardada con cada ejercicio; en sesiones sin copia busca la definición actual.
export function seriesHechas(sesiones: SesionGym[], defs: Map<string, EjercicioDef>): Record<Musculo, number> {
  const total = ceros();
  for (const s of sesiones) {
    for (const e of s.ejercicios) {
      const def = defs.get(e.ejercicioId);
      sumar(total, e.musculos ?? def?.musculos ?? [], e.secundarios ?? def?.secundarios, e.series.length);
    }
  }
  return total;
}

export type FilaVolumen = { musculo: Musculo; series: number; prioridad: Prioridad; objetivo: [number, number]; estado: 'bajo' | 'ok' | 'alto' };

export function analisisVolumen(rutina: Rutina): FilaVolumen[] {
  const series = seriesPlanificadas(rutina);
  return MUSCULOS.map((musculo) => {
    const prioridad = rutina.prioridades[musculo] ?? 'media';
    const objetivo = OBJETIVO_SERIES[prioridad];
    const s = series[musculo];
    const estado = s < objetivo[0] ? 'bajo' : s > objetivo[1] ? 'alto' : 'ok';
    return { musculo, series: s, prioridad, objetivo, estado };
  });
}
