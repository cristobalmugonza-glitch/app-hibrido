import type { EjercicioDef, SerieRegistrada, SesionGym } from '../tipos/modelo';
import { fmt2 } from './formato';

export type Motivo = 'primera_vez' | 'inicio' | 'subir' | 'mantener' | 'bajar' | 'descarga' | 'variante';

export type Sugerencia = {
  peso: number | null; // null = sin sugerencia de peso (primera vez o ejercicio sin carga)
  reps: number[]; // objetivo por serie
  series: number;
  motivo: Motivo;
  texto: string;
  porQue: string;
  saltoPct?: number; // presente si el incremento supera el 10 % de la carga
};

export type EntradaHistorial = { fecha: string; descarga: boolean; series: SerieRegistrada[] };

export function historialDe(ejercicioId: string, sesiones: SesionGym[]): EntradaHistorial[] {
  return sesiones
    .map((s) => ({ s, e: s.ejercicios.find((e) => e.ejercicioId === ejercicioId) }))
    .filter(({ e }) => e && e.series.length > 0)
    .map(({ s, e }) => ({ fecha: s.fecha, descarga: s.descarga, series: e!.series }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function redondearCarga(peso: number, incremento: number): number {
  const paso = incremento >= 2 ? incremento / 2 : 0.5;
  return Math.max(0, Math.round(peso / paso) * paso);
}

const lleno = (n: number, v: number) => Array.from({ length: n }, () => v);

function seriesDeTrabajo(def: EjercicioDef, series: SerieRegistrada[]) {
  if (def.modo !== 'carga') return { peso: 0, series };
  const peso = Math.max(...series.map((s) => s.peso));
  return { peso, series: series.filter((s) => s.peso === peso) };
}

const promedio = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

// Doble progresión genérica: solo mira el tipo, el rango, el incremento y el historial del ejercicio.
export function sugerir(def: EjercicioDef, historial: EntradaHistorial[], descarga: boolean): Sugerencia {
  const [min, max] = def.rangoReps;
  const series = descarga ? Math.max(1, Math.ceil(def.series / 2)) : def.series;
  const conCarga = def.modo === 'carga';
  const validas = historial.filter((h) => !h.descarga);
  const ultima = validas.at(-1) ?? historial.at(-1);

  if (!ultima) {
    if (!conCarga) {
      return { peso: null, reps: lleno(series, min), series, motivo: descarga ? 'descarga' : 'inicio', texto: `Apunta a ${min}${def.modo === 'tiempo' ? ' s' : ' reps'}.`, porQue: descarga ? 'descarga' : 'doble_progresion' };
    }
    if (def.pesoInicial === undefined) {
      return { peso: null, reps: lleno(series, min), series, motivo: 'primera_vez', texto: 'Primera vez: registra el peso que uses. Desde la próxima sesión te sugiero.', porQue: 'primera_vez' };
    }
    return {
      peso: def.pesoInicial,
      reps: lleno(series, min),
      series,
      motivo: descarga ? 'descarga' : 'inicio',
      texto: descarga ? 'Descarga: mitad de series, sin fallo.' : `Parte en ${fmt2(def.pesoInicial)} kg y apunta a ${min}–${max}.`,
      porQue: descarga ? 'descarga' : 'doble_progresion',
    };
  }

  const trabajo = seriesDeTrabajo(def, ultima.series);
  const peso = conCarga ? trabajo.peso : null;
  const repsUltima = trabajo.series.map((s) => s.reps);

  if (descarga) {
    return { peso, reps: lleno(series, min), series, motivo: 'descarga', texto: 'Descarga: mismo peso, mitad de series, sin fallo.', porQue: 'descarga' };
  }

  const tope = trabajo.series.length >= def.series && repsUltima.every((r) => r >= max);
  if (tope) {
    if (!conCarga) {
      const texto = def.modo === 'tiempo'
        ? 'Llegaste al tope: súbele la dificultad (ojos cerrados o superficie inestable) y vuelve al mínimo.'
        : 'Llegaste al tope: usa una variante más difícil (o una banda más dura) y vuelve al mínimo.';
      return { peso: null, reps: lleno(series, min), series, motivo: 'variante', texto, porQue: 'doble_progresion' };
    }
    const nuevo = redondearCarga(trabajo.peso + def.incrementoKg, def.incrementoKg);
    const saltoPct = trabajo.peso > 0 ? (def.incrementoKg / trabajo.peso) * 100 : undefined;
    const texto = trabajo.peso === 0 && def.tipo === 'calistenia_peso_corporal'
      ? `Hiciste ${max} en todas sin lastre: agrega ${fmt2(def.incrementoKg)} kg o usa una variante más difícil, y vuelve a ${min}.`
      : `Hiciste ${max} en todas: sube a ${fmt2(nuevo)} kg y vuelve a ${min}.`;
    return { peso: nuevo, reps: lleno(series, min), series, motivo: 'subir', texto, porQue: 'doble_progresion', saltoPct: saltoPct && saltoPct > 10 ? saltoPct : undefined };
  }

  const penultima = validas.at(-2);
  const bajoPiso = (h: EntradaHistorial) => promedio(seriesDeTrabajo(def, h.series).series.map((s) => s.reps)) < min;
  if (conCarga && penultima && ultima === validas.at(-1) && bajoPiso(ultima) && bajoPiso(penultima)) {
    if (trabajo.peso === 0) {
      return { peso: 0, reps: lleno(series, min), series, motivo: 'bajar', texto: `Dos sesiones bajo ${min} reps: usa una variante más fácil o asistida y reconstruye.`, porQue: 'bajar_10' };
    }
    const nuevo = redondearCarga(trabajo.peso * 0.9, def.incrementoKg);
    return { peso: nuevo, reps: lleno(series, min), series, motivo: 'bajar', texto: `Dos sesiones bajo ${min} reps: baja a ${fmt2(nuevo)} kg (−10 %) y reconstruye.`, porQue: 'bajar_10' };
  }

  const reps = Array.from({ length: series }, (_, i) => {
    const previa = repsUltima[i] ?? repsUltima.at(-1) ?? min;
    return Math.min(max, Math.max(min, previa + 1));
  });
  const unidad = def.modo === 'tiempo' ? ' s' : '';
  return {
    peso,
    reps,
    series,
    motivo: 'mantener',
    texto: def.modo === 'tiempo' ? `Mismo nivel: apunta a ${reps[0]}${unidad} o más.` : conCarga ? 'Mismo peso: apunta a una rep más por serie.' : 'Apunta a una rep más por serie.',
    porQue: 'doble_progresion',
  };
}
