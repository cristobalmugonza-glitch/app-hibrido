import type { Datos, EntrenoHoy, Perfil, RegistroPeso } from '../tipos/modelo';
import { diaLocal, enVentana } from './fechas';

export const PISO_KCAL = 1900;
export const PISO_GRASA_G_KG = 0.8;
export const PASO_KCAL = 150;
// "Sin bajar en 3 semanas" = menos de 0,1 kg por semana en promedio.
export const SIN_BAJAR_3_SEMANAS_KG = 0.3;

export function macros(perfil: Perfil) {
  const carbos = Math.max(0, Math.round((perfil.caloriasObjetivo - perfil.proteinaObjetivo * 4 - perfil.grasaObjetivo * 9) / 4));
  return { kcal: perfil.caloriasObjetivo, proteina: perfil.proteinaObjetivo, grasa: perfil.grasaObjetivo, carbos };
}

export function pesoActual(datos: Datos): number {
  return datos.pesos.at(-1)?.peso ?? datos.perfil.pesoInicial;
}

// Ventana i = días [7i, 7i+7) hacia atrás desde hoy. Semana 0 = últimos 7 días.
export function promediosSemanales(pesos: RegistroPeso[], ahora: Date, semanas = 4) {
  return Array.from({ length: semanas }, (_, i) => {
    const ps = pesos.filter((p) => enVentana(p.fecha, ahora, i * 7, i * 7 + 7)).map((p) => p.peso);
    return { semana: i, n: ps.length, promedio: ps.length >= 2 ? ps.reduce((a, b) => a + b, 0) / ps.length : null };
  });
}

// kg bajados por semana (positivo = bajó) entre ventanas consecutivas.
function perdidas(pesos: RegistroPeso[], ahora: Date, semanas: number): (number | null)[] {
  const s = promediosSemanales(pesos, ahora, semanas + 1);
  return Array.from({ length: semanas }, (_, i) => {
    const a = s[i].promedio;
    const b = s[i + 1].promedio;
    return a !== null && b !== null ? b - a : null;
  });
}

export function tasaSemanal(datos: Datos, ahora: Date): number | null {
  return perdidas(datos.pesos, ahora, 1)[0];
}

export function perdidaRapida(datos: Datos, ahora: Date): boolean {
  const [a, b] = perdidas(datos.pesos, ahora, 2);
  return a !== null && b !== null && a > 0.8 && b > 0.8;
}

export type Propuesta = { tipo: 'bajar' | 'subir' | 'pausa'; deltaKcal: number; texto: string; porQue: string };

export function propuestaKcal(datos: Datos, ahora: Date): Propuesta | null {
  const kcal = datos.perfil.caloriasObjetivo;
  const [a, b] = perdidas(datos.pesos, ahora, 2);
  if (a !== null && b !== null && a > 0.6 && b > 0.6) {
    return { tipo: 'subir', deltaKcal: PASO_KCAL, texto: `Bajaste más de 0,6 kg por semana dos semanas seguidas. Sube a ${kcal + PASO_KCAL} kcal para cuidar el músculo.`, porQue: 'calibracion' };
  }
  const s = promediosSemanales(datos.pesos, ahora, 4);
  const hoy = s[0].promedio;
  const hace3 = s[3].promedio;
  if (hoy !== null && hace3 !== null && hace3 - hoy < SIN_BAJAR_3_SEMANAS_KG) {
    if (kcal - PASO_KCAL < PISO_KCAL) {
      return { tipo: 'pausa', deltaKcal: 0, texto: `3 semanas sin bajar y ya estás cerca del piso de ${PISO_KCAL} kcal. Mejor 1–2 semanas en mantención antes de seguir.`, porQue: 'pausa' };
    }
    return { tipo: 'bajar', deltaKcal: -PASO_KCAL, texto: `3 semanas sin bajar. Baja a ${kcal - PASO_KCAL} kcal (el ajuste sale de los carbohidratos).`, porQue: 'calibracion' };
  }
  return null;
}

export function pisoGrasa(peso: number): number {
  return Math.round(peso * PISO_GRASA_G_KG);
}

export function proteinaPorComida(proteina: number, peso: number) {
  return { comidas: 3, gramos: Math.round(proteina / 3), minimo: Math.round(peso * 0.4) };
}

// Rango de proteína en déficit (2,3–3,1 g por kg de masa libre de grasa), si hay estimación de grasa.
export function rangoProteinaDeficit(datos: Datos): [number, number] | null {
  const grasa = datos.medidas.filter((m) => m.grasaNavy).at(-1)?.grasaNavy;
  if (!grasa) return null;
  const mlg = pesoActual(datos) * (1 - grasa / 100);
  return [Math.round(mlg * 2.3), Math.round(mlg * 3.1)];
}

export function guiaAyuno(entreno: EntrenoHoy | undefined, proteina: number, ahora = new Date()): { texto: string; porQue: string } | null {
  if (!entreno || entreno.fecha !== diaLocal(ahora)) return null;
  const porComida = Math.round(proteina / 3);
  if (entreno.hora === null) return { texto: `Sin entreno hoy: reparte la proteína en 3 comidas de ~${porComida} g.`, porQue: 'reparto_proteina' };
  const manana = Number(entreno.hora.split(':')[0]) < 12;
  if (manana && !entreno.ayunoRoto) return { texto: 'Entrenas en ayunas: rompe el ayuno con una comida alta en proteína dentro de la primera hora después.', porQue: 'ayuno_flexible' };
  if (entreno.ayunoRoto) return { texto: 'Come carbohidrato + proteína 60–90 min antes de entrenar.', porQue: 'pre_entreno' };
  return { texto: 'Entrenas aún en ayunas: agua, café o mate están bien. Prioriza proteína en la comida siguiente.', porQue: 'ayuno_flexible' };
}
