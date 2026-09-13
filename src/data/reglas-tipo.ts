import type { Musculo, Prioridad, TipoEjercicio } from '../tipos/modelo';

type Regla = {
  etiqueta: string;
  rango: [number, number];
  descansoSeg: [number, number];
  incrementoKg: number;
  falloUltimaSerie: boolean;
  porQueDescanso: string;
};

// Valores por defecto al crear un ejercicio. Cada ejercicio puede sobrescribir rango e incremento.
export const REGLAS_TIPO: Record<TipoEjercicio, Regla> = {
  compuesto_pesado: {
    etiqueta: 'Compuesto pesado',
    rango: [6, 10],
    descansoSeg: [120, 180],
    incrementoKg: 2.5,
    falloUltimaSerie: false,
    porQueDescanso: 'descanso_pesado',
  },
  compuesto_liviano: {
    etiqueta: 'Compuesto liviano',
    rango: [8, 12],
    descansoSeg: [90, 120],
    incrementoKg: 2.5,
    falloUltimaSerie: false,
    porQueDescanso: 'descanso_general',
  },
  aislamiento: {
    etiqueta: 'Aislamiento',
    rango: [10, 15],
    descansoSeg: [60, 90],
    incrementoKg: 2.5,
    falloUltimaSerie: true,
    porQueDescanso: 'descanso_general',
  },
  calistenia_peso_corporal: {
    etiqueta: 'Calistenia',
    rango: [8, 12],
    descansoSeg: [90, 120],
    incrementoKg: 2.5,
    falloUltimaSerie: false,
    porQueDescanso: 'descanso_general',
  },
};

export const NOMBRE_MUSCULO: Record<Musculo, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombro_lateral: 'Hombro lateral',
  hombro_posterior: 'Hombro posterior',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  cuadriceps: 'Cuádriceps',
  isquios_gluteos: 'Isquios y glúteos',
  gemelos: 'Gemelos',
  abdomen: 'Abdomen',
};

export const MUSCULOS = Object.keys(NOMBRE_MUSCULO) as Musculo[];

export const TREN_INFERIOR: Musculo[] = ['cuadriceps', 'isquios_gluteos'];

// Series por semana, contando secundarios como 0,5.
export const OBJETIVO_SERIES: Record<Prioridad, [number, number]> = {
  alta: [12, 20],
  media: [8, 14],
  mantencion: [4, 8],
};

export const NOMBRE_PRIORIDAD: Record<Prioridad, string> = {
  alta: 'Alta',
  media: 'Media',
  mantencion: 'Mantención',
};

// Prioridades para una rutina nueva: los grandes grupos en media; lo que ya recibe trabajo indirecto, en mantención.
export const PRIORIDADES_BASE: Record<Musculo, Prioridad> = {
  pecho: 'media',
  espalda: 'media',
  hombro_lateral: 'media',
  hombro_posterior: 'mantencion',
  biceps: 'media',
  triceps: 'media',
  cuadriceps: 'media',
  isquios_gluteos: 'media',
  gemelos: 'mantencion',
  abdomen: 'mantencion',
};
