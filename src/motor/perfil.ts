import type { Datos, Objetivo, Perfil, Sexo } from '../tipos/modelo';
import { construirRutina, type IdRutina } from '../data/catalogo';
import { diaLocal } from './fechas';
import { asegurarPlanSemana, contarSesiones } from './planificacion';

// Gasto en reposo (Mifflin-St Jeor 1990), en kcal/día.
export const reposoMifflin = (sexo: Sexo, peso: number, altura: number, edad: number) => 10 * peso + 6.25 * altura - 5 * edad + (sexo === 'hombre' ? 5 : -161);

// FC máxima estimada (Tanaka 2001).
export const fcMaxTanaka = (edad: number) => Math.round(208 - 0.7 * edad);

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
  tobillo: boolean;
  kmSemana: number;
  ritmoSegKm: number;
};

export function objetivosDe(r: Respuestas): Objetivos {
  const rutina = construirRutina(r.rutina, { running: r.corre, tobillo: r.tobillo });
  return calcularObjetivos({ sexo: r.sexo, peso: r.peso, altura: r.altura, edad: r.edad, objetivo: r.objetivo, sesiones: contarSesiones(rutina) });
}

// Distancias iniciales a partir de los km que ya corre (práctica común; todo se edita en Ajustes).
export function distanciasRunning(kmSemana: number) {
  const fondo = acotar(Math.round(kmSemana * 0.35), 5, 16);
  return {
    z2Km: acotar(Math.round(kmSemana * 0.25), 4, 10),
    fondoKmInicial: fondo,
    topeFondoKm: acotar(fondo + 6, 10, 21),
    topeKmSemanal: Math.max(kmSemana + 5, Math.round(kmSemana * 1.3)),
  };
}

export function crearDatos(r: Respuestas, ahora = new Date()): Datos {
  const corre = r.corre || r.rutina === 'hibrido';
  const rutina = construirRutina(r.rutina, { running: corre, tobillo: r.tobillo });
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
    ...distanciasRunning(corre ? r.kmSemana : 20),
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
