import type { Musculo, Prioridad, Rutina } from '../tipos/modelo';
import { MUSCULOS, OBJETIVO_SERIES } from '../data/reglas-tipo';

// Conteo fraccionado: 1 serie al músculo principal, 0,5 a cada secundario (Pelland 2026).
// Una plantilla cuenta tantas veces como aparezca en la secuencia.
export function seriesPorVuelta(rutina: Rutina): Record<Musculo, number> {
  const total = Object.fromEntries(MUSCULOS.map((m) => [m, 0])) as Record<Musculo, number>;
  for (const paso of rutina.secuencia) {
    if (paso.clase !== 'gym') continue;
    const plantilla = rutina.plantillas.find((p) => p.id === paso.plantillaId);
    if (!plantilla) continue;
    for (const ej of plantilla.ejercicios) {
      for (const m of ej.musculos) total[m] += ej.series;
      for (const m of ej.secundarios ?? []) total[m] += ej.series * 0.5;
    }
  }
  return total;
}

export type FilaVolumen = { musculo: Musculo; series: number; prioridad: Prioridad; objetivo: [number, number]; estado: 'bajo' | 'ok' | 'alto' };

export function analisisVolumen(rutina: Rutina): FilaVolumen[] {
  const series = seriesPorVuelta(rutina);
  return MUSCULOS.map((musculo) => {
    const prioridad = rutina.prioridades[musculo] ?? 'media';
    const objetivo = OBJETIVO_SERIES[prioridad];
    const s = series[musculo];
    const estado = s < objetivo[0] ? 'bajo' : s > objetivo[1] ? 'alto' : 'ok';
    return { musculo, series: s, prioridad, objetivo, estado };
  });
}
