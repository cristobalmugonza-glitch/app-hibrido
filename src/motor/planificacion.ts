import type { Datos, PlanSemana, RefBloque, Rutina, TipoRunning, TipoSemana } from '../tipos/modelo';
import { historialDe, sugerir } from './progresion';
import { inicioSemana, sumarDias } from './semanas';

// Bloques de carga: 3 semanas de carga y 1 de descarga. Una semana con menos de la mitad
// de las sesiones planificadas cuenta como descanso y reinicia el bloque.
export const SEMANAS_DE_CARGA = 3;
export const UMBRAL_SEMANA_ENTRENADA = 0.5;

export const TIPOS_RUNNING: TipoRunning[] = ['z2', 'calidad', 'fondo'];

export const NOMBRE_RUNNING: Record<TipoRunning | 'test', string> = {
  z2: 'Running Z2',
  calidad: 'Running calidad',
  fondo: 'Fondo largo',
  test: 'Test 8 km',
};

export type Bloque = { key: string; ref: RefBloque; nombre: string; veces: number };

export const claveBloque = (ref: RefBloque): string => (ref.clase === 'gym' ? `gym:${ref.plantillaId}` : `run:${ref.tipo}`);

export function listaBloques(datos: Datos): Bloque[] {
  const gym: Bloque[] = datos.rutina.plantillas.map((p) => {
    const ref: RefBloque = { clase: 'gym', plantillaId: p.id };
    return { key: claveBloque(ref), ref, nombre: p.nombre, veces: p.vecesPorSemana };
  });
  const running: Bloque[] = TIPOS_RUNNING.map((tipo) => {
    const ref: RefBloque = { clase: 'running', tipo };
    return { key: claveBloque(ref), ref, nombre: NOMBRE_RUNNING[tipo], veces: datos.rutina.running[tipo] };
  });
  return [...gym, ...running];
}

export function contarSesiones(rutina: Rutina): number {
  return rutina.plantillas.reduce((a, p) => a + Math.max(0, p.vecesPorSemana), 0) + TIPOS_RUNNING.reduce((a, t) => a + Math.max(0, rutina.running[t]), 0);
}

export const sesionesPlanificadas = (datos: Datos) => contarSesiones(datos.rutina);

export const corre = (datos: Datos) => TIPOS_RUNNING.some((t) => datos.rutina.running[t] > 0);

// Índices memorizados por objeto Datos: la app nunca muta Datos, cada cambio crea uno nuevo.
const cacheConteo = new WeakMap<Datos, Map<string, Map<string, number>>>();

function conteo(datos: Datos): Map<string, Map<string, number>> {
  const previo = cacheConteo.get(datos);
  if (previo) return previo;
  const c = new Map<string, Map<string, number>>();
  const sumar = (fecha: string, key: string) => {
    const w = inicioSemana(fecha);
    const m = c.get(w) ?? new Map<string, number>();
    m.set(key, (m.get(key) ?? 0) + 1);
    c.set(w, m);
  };
  for (const s of datos.sesionesGym) sumar(s.fecha, `gym:${s.plantillaId}`);
  // El test de 8 km se corre en Z2 alta: cuenta como la salida de Z2.
  for (const s of datos.sesionesRunning) sumar(s.fecha, `run:${s.tipo === 'test' ? 'z2' : s.tipo}`);
  cacheConteo.set(datos, c);
  return c;
}

export function hechasEnSemana(datos: Datos, inicio: string): Map<string, number> {
  return conteo(datos).get(inicio) ?? new Map();
}

export function totalSesiones(datos: Datos, inicio: string): number {
  let n = 0;
  for (const v of hechasEnSemana(datos, inicio).values()) n += v;
  return n;
}

export const planGuardado = (datos: Datos, inicio: string): PlanSemana | undefined => datos.planes.find((p) => p.inicio === inicio);

export const primeraSemana = (datos: Datos) => inicioSemana(datos.perfil.fechaInicio);

// Compara con lo planificado cuando empezó esa semana, no con el plan de hoy.
export function semanaEntrenada(datos: Datos, inicio: string): boolean {
  const plan = planGuardado(datos, inicio)?.sesiones ?? sesionesPlanificadas(datos);
  return totalSesiones(datos, inicio) >= Math.max(1, Math.ceil(plan * UMBRAL_SEMANA_ENTRENADA));
}

const cacheTipo = new WeakMap<Datos, Map<string, TipoSemana>>();

// Tipo de una semana pasada: el guardado o, si la app no se abrió esa semana, el que le tocaba por bloque.
export function tipoSemana(datos: Datos, inicio: string): TipoSemana {
  let memo = cacheTipo.get(datos);
  if (!memo) {
    memo = new Map();
    cacheTipo.set(datos, memo);
  }
  const previo = memo.get(inicio);
  if (previo) return previo;
  const tipo = planGuardado(datos, inicio)?.tipo ?? (cargasSeguidas(datos, inicio) >= SEMANAS_DE_CARGA ? 'descarga' : 'carga');
  memo.set(inicio, tipo);
  return tipo;
}

// Semanas de carga seguidas justo antes de `inicio`. `enCurso` cuenta como entrenada aunque no haya terminado.
export function cargasSeguidas(datos: Datos, inicio: string, enCurso?: string): number {
  const primera = primeraSemana(datos);
  let n = 0;
  for (let w = sumarDias(inicio, -7); w >= primera && n < 12; w = sumarDias(w, -7)) {
    if (tipoSemana(datos, w) === 'descarga') break;
    if (w !== enCurso && !semanaEntrenada(datos, w)) break;
    n++;
  }
  return n;
}

// Ejercicios planificados que llevan dos sesiones seguidas bajo el mínimo de su rango.
export function estancados(datos: Datos): string[] {
  const nombres: string[] = [];
  for (const p of datos.rutina.plantillas) {
    if (p.vecesPorSemana <= 0) continue;
    for (const e of p.ejercicios) {
      if (nombres.includes(e.nombre)) continue;
      if (sugerir(e, historialDe(e.id, datos.sesionesGym), false).motivo === 'bajar') nombres.push(e.nombre);
    }
  }
  return nombres;
}

export type Decision = {
  tipo: TipoSemana;
  cargasPrevias: number;
  motivo: 'guardado' | 'bloque' | 'estancamiento' | 'carga';
  estancados: string[];
};

export function decidirTipo(datos: Datos, inicio: string, enCurso?: string): Decision {
  const n = cargasSeguidas(datos, inicio, enCurso);
  const guardado = planGuardado(datos, inicio);
  if (guardado) return { tipo: guardado.tipo, cargasPrevias: n, motivo: 'guardado', estancados: [] };
  if (n >= SEMANAS_DE_CARGA) return { tipo: 'descarga', cargasPrevias: n, motivo: 'bloque', estancados: [] };
  const est = n >= 2 ? estancados(datos) : [];
  if (est.length >= 2) return { tipo: 'descarga', cargasPrevias: n, motivo: 'estancamiento', estancados: est };
  return { tipo: 'carga', cargasPrevias: n, motivo: 'carga', estancados: [] };
}

// Número de bloque (mesociclo) al que pertenece la semana: sube después de cada descanso que siguió a semanas de carga.
export function mesociclo(datos: Datos, inicio: string, enCurso?: string): number {
  let n = 0;
  let huboCarga = false;
  for (let w = primeraSemana(datos); w < inicio; w = sumarDias(w, 7)) {
    const descanso = tipoSemana(datos, w) === 'descarga' || (w !== enCurso && !semanaEntrenada(datos, w));
    if (!descanso) huboCarga = true;
    else if (huboCarga) {
      n++;
      huboCarga = false;
    }
  }
  return datos.mesociclosPrevios + 1 + n;
}

export type ContextoSemana = { inicio: string; tipo: TipoSemana; descarga: boolean; mesociclo: number; semanaDeCarga: number };

export function contextoSemana(datos: Datos, inicio: string, enCurso?: string): ContextoSemana {
  const d = decidirTipo(datos, inicio, enCurso);
  return {
    inicio,
    tipo: d.tipo,
    descarga: d.tipo === 'descarga',
    mesociclo: mesociclo(datos, inicio, enCurso),
    semanaDeCarga: Math.min(SEMANAS_DE_CARGA, d.cargasPrevias + 1),
  };
}

// Al abrir la app en una semana nueva se fija su tipo, con lo que se sabe al empezarla.
export function asegurarPlanSemana(datos: Datos, ahora = new Date()): Datos {
  const inicio = inicioSemana(ahora);
  if (planGuardado(datos, inicio)) return datos;
  const { tipo } = decidirTipo(datos, inicio);
  return { ...datos, planes: [...datos.planes, { inicio, tipo, sesiones: sesionesPlanificadas(datos) }] };
}

export function fijarTipoSemana(datos: Datos, inicio: string, tipo: TipoSemana): Datos {
  const sesiones = planGuardado(datos, inicio)?.sesiones ?? sesionesPlanificadas(datos);
  return { ...datos, planes: [...datos.planes.filter((p) => p.inicio !== inicio), { inicio, tipo, sesiones, manual: true }] };
}
