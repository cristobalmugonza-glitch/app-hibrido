import type { Datos, MetaRunning, Objetivo, Perfil, Rutina, Sexo } from '../tipos/modelo';
import { construirRutina, type IdRutina } from '../data/catalogo';
import { diaLocal } from './fechas';
import { asegurarPlanSemana, contarSesiones } from './planificacion';

// Gasto en reposo (Mifflin-St Jeor 1990), en kcal/día.
export const reposoMifflin = (sexo: Sexo, peso: number, altura: number, edad: number) => 10 * peso + 6.25 * altura - 5 * edad + (sexo === 'hombre' ? 5 : -161);

// FC máxima estimada (Tanaka 2001).
export const fcMaxTanaka = (edad: number) => Math.round(208 - 0.7 * edad);

// Acepta la altura en metros (1,78) o en centímetros (178) y la devuelve en centímetros.
export function alturaCm(n: number): number {
  return n >= 1 && n <= 2.5 ? Math.round(n * 100) : n;
}

// undefined = campo vacío; null = no es un número.
function leer(texto: string): number | null | undefined {
  const t = texto.trim();
  if (!t) return undefined;
  const n = Number(t.replace(',', '.'));
  return isFinite(n) ? n : null;
}

export type DatosBasicos = { edad: number; altura: number; peso: number; fcMax: number | null };

// Valida los datos del primer paso y explica en palabras qué corregir.
export function validarDatosBasicos(t: { edad: string; altura: string; peso: string; fcMax: string }): { valores: DatosBasicos | null; errores: string[]; faltan: boolean } {
  const edad = leer(t.edad);
  const alturaLeida = leer(t.altura);
  const altura = typeof alturaLeida === 'number' ? alturaCm(alturaLeida) : alturaLeida;
  const peso = leer(t.peso);
  const fcMax = leer(t.fcMax);
  const fuera = (v: number | null | undefined, min: number, max: number) => v === null || (v !== undefined && (v < min || v > max));

  const errores: string[] = [];
  if (fuera(edad, 14, 90)) errores.push('La edad debe estar entre 14 y 90 años.');
  if (fuera(altura, 120, 230)) errores.push('Escribe la altura en centímetros (178) o en metros (1,78).');
  if (fuera(peso, 30, 300)) errores.push('El peso debe estar entre 30 y 300 kg.');
  if (fuera(fcMax, 120, 230)) errores.push('La FC máxima debe estar entre 120 y 230 lpm, o déjala vacía.');

  const faltan = edad === undefined || altura === undefined || peso === undefined;
  const valores = !errores.length && !faltan ? { edad: edad as number, altura: altura as number, peso: peso as number, fcMax: fcMax ?? null } : null;
  return { valores, errores, faltan };
}

// Factor de actividad según sesiones por semana (práctica común; la calibración semanal corrige el error).
export function factorActividad(sesiones: number): number {
  if (sesiones <= 1) return 1.2;
  if (sesiones <= 3) return 1.375;
  if (sesiones <= 5) return 1.55;
  if (sesiones <= 7) return 1.725;
  return 1.9;
}

const a50 = (x: number) => Math.round(x / 50) * 50;
const arriba5 = (x: number) => Math.ceil(x / 5) * 5;
const acotar = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));

export type Objetivos = { reposo: number; gasto: number; kcal: number; proteina: number; grasa: number; piso: number };

export function calcularObjetivos(a: { sexo: Sexo; peso: number; altura: number; edad: number; objetivo: Objetivo; sesiones: number }): Objetivos {
  const reposo = reposoMifflin(a.sexo, a.peso, a.altura, a.edad);
  const gasto = reposo * factorActividad(a.sesiones);
  const piso = a50(Math.max(reposo, a.sexo === 'hombre' ? 1500 : 1200));
  // Perder: −20 % con tope de 500 kcal. Ganar: +10 %, el extremo conservador del superávit recomendado.
  const bruto = a.objetivo === 'perder_grasa' ? gasto - Math.min(500, gasto * 0.2) : a.objetivo === 'ganar_musculo' ? gasto * 1.1 : gasto;
  const kcal = Math.max(piso, a50(bruto));
  const gKg = a.objetivo === 'perder_grasa' ? 2.0 : a.objetivo === 'ganar_musculo' ? 1.8 : 1.6;
  const proteina = arriba5(a.peso * gKg);
  const grasa = arriba5(Math.max(a.peso * 0.8, (kcal * 0.25) / 9));
  return { reposo: Math.round(reposo), gasto: Math.round(gasto), kcal, proteina, grasa, piso };
}

export type Respuestas = {
  sexo: Sexo;
  edad: number;
  altura: number;
  peso: number;
  fcMax: number | null;
  objetivo: Objetivo;
  rutina: IdRutina;
  corre: boolean;
  diasRunning: number; // 0 = recién empiezo
  kmSalida: number; // una salida normal
  kmLarga: number; // la salida más larga del último mes
  metaRunning: MetaRunning;
  ritmoSegKm: number;
};

// Salidas por semana según los días que ya corres. Con 2 días: 1 de calidad y 1 larga, lo mínimo para mantener.
export function salidasSegunDias(dias: number): Rutina['running'] {
  if (dias <= 0) return { z2: 2, calidad: 0, fondo: 1 };
  if (dias === 1) return { z2: 1, calidad: 0, fondo: 0 };
  if (dias === 2) return { z2: 0, calidad: 1, fondo: 1 };
  if (dias === 3) return { z2: 1, calidad: 1, fondo: 1 };
  if (dias === 4) return { z2: 2, calidad: 1, fondo: 1 };
  return { z2: 3, calidad: 1, fondo: 1 };
}

// Km semanales a partir de lo que un corredor sabe: días × salida normal, cambiando una por la más larga.
export function kmSemanaEstimado(dias: number, kmSalida: number, kmLarga: number): number {
  if (dias <= 0) return 0;
  return Math.round((dias - 1) * kmSalida + Math.max(kmLarga, kmSalida));
}

// Punto de partida y topes (práctica común; todo se edita en Ajustes).
export function distanciasRunning(kmSemana: number, kmLarga: number) {
  const base = Math.max(8, Math.round(kmSemana));
  return {
    kmBaseSemanal: base,
    topeKmSemanal: Math.max(base + 10, Math.round(base * 1.5)),
    topeFondoKm: acotar(Math.max(kmLarga, Math.round(base * 0.45)) + 6, 10, 32),
  };
}

const correEn = (r: Respuestas) => r.corre || r.rutina === 'hibrido';

function rutinaDe(r: Respuestas): Rutina {
  return construirRutina(r.rutina, { running: correEn(r) ? salidasSegunDias(r.diasRunning) : null, tobillo: false });
}

export function objetivosDe(r: Respuestas): Objetivos {
  return calcularObjetivos({ sexo: r.sexo, peso: r.peso, altura: r.altura, edad: r.edad, objetivo: r.objetivo, sesiones: contarSesiones(rutinaDe(r)) });
}

export const planDe = rutinaDe;

export function crearDatos(r: Respuestas, ahora = new Date()): Datos {
  const corre = correEn(r);
  const rutina = rutinaDe(r);
  const obj = calcularObjetivos({ sexo: r.sexo, peso: r.peso, altura: r.altura, edad: r.edad, objetivo: r.objetivo, sesiones: contarSesiones(rutina) });
  const perfil: Perfil = {
    sexo: r.sexo,
    edad: r.edad,
    altura: r.altura,
    pesoInicial: r.peso,
    fcMax: r.fcMax ?? fcMaxTanaka(r.edad),
    fechaInicio: diaLocal(ahora),
    objetivo: r.objetivo,
    caloriasObjetivo: obj.kcal,
    proteinaObjetivo: obj.proteina,
    grasaObjetivo: obj.grasa,
    pisoKcal: obj.piso,
    ...distanciasRunning(corre ? kmSemanaEstimado(r.diasRunning, r.kmSalida, r.kmLarga) : 15, corre ? r.kmLarga : 10),
    metaRunning: r.metaRunning,
    ritmoSemillaSegKm: r.ritmoSegKm,
  };
  const datos: Datos = {
    version: 2,
    perfil,
    rutina,
    ejerciciosPropios: [],
    planes: [],
    mesociclosPrevios: 0,
    sesionesGym: [],
    sesionesRunning: [],
    pesos: [{ fecha: ahora.toISOString(), peso: r.peso }],
    molestias: [],
    medidas: [],
    dominadas: [],
  };
  return asegurarPlanSemana(datos, ahora);
}
