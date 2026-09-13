import type { Datos, EntrenoHoy, Perfil, RegistroPeso } from '../tipos/modelo';
import { diaLocal, diasEntre, enVentana } from './fechas';
import { fmt0, fmt1 } from './formato';

export const PISO_GRASA_G_KG = 0.8;
export const PASO_KCAL = 150;
export const ESPERA_AJUSTE_DIAS = 14;

// Umbrales como fracción del peso, para que sirvan a cualquier persona.
export const RITMO = {
  perderMin: 0.0035, // por semana
  perderMax: 0.0075,
  perdidaRapida: 0.01,
  ganarMin: 0.0025,
  ganarMax: 0.005,
  mantenerTres: 0.01, // cambio aceptable en 3 semanas
};

export function macros(perfil: Perfil) {
  const carbos = Math.max(0, Math.round((perfil.caloriasObjetivo - perfil.proteinaObjetivo * 4 - perfil.grasaObjetivo * 9) / 4));
  return { kcal: perfil.caloriasObjetivo, proteina: perfil.proteinaObjetivo, grasa: perfil.grasaObjetivo, carbos };
}

export function pesoActual(datos: Datos): number {
  if (!datos.pesos.length) return datos.perfil.pesoInicial;
  return datos.pesos.reduce((a, b) => (b.fecha > a.fecha ? b : a)).peso;
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
  const limite = pesoActual(datos) * RITMO.perdidaRapida;
  const [a, b] = perdidas(datos.pesos, ahora, 2);
  return a !== null && b !== null && a > limite && b > limite;
}

export function metaSemanal(perfil: Perfil, peso: number): string {
  if (perfil.objetivo === 'perder_grasa') return `Meta: bajar ${fmt1(peso * RITMO.perderMin)}–${fmt1(peso * RITMO.perderMax)} kg por semana.`;
  if (perfil.objetivo === 'ganar_musculo') return `Meta: subir ${fmt1(peso * RITMO.ganarMin)}–${fmt1(peso * RITMO.ganarMax)} kg por semana.`;
  return 'Meta: mantener tu peso estable.';
}

export type Propuesta = { tipo: 'bajar' | 'subir' | 'pausa'; deltaKcal: number; texto: string; porQue: string };

export function propuestaKcal(datos: Datos, ahora: Date): Propuesta | null {
  // Un cambio de calorías tarda en verse en el peso: se espera 2 semanas antes de volver a proponer.
  if (datos.ultimoAjusteKcal && diasEntre(datos.ultimoAjusteKcal, ahora) < ESPERA_AJUSTE_DIAS) return null;

  const { perfil } = datos;
  const kcal = perfil.caloriasObjetivo;
  const peso = pesoActual(datos);
  const [a, b] = perdidas(datos.pesos, ahora, 2);
  const s = promediosSemanales(datos.pesos, ahora, 4);
  const cambio3 = s[0].promedio !== null && s[3].promedio !== null ? s[0].promedio - s[3].promedio : null; // positivo = subió
  const dosSemanas = (f: (bajo: number) => boolean) => a !== null && b !== null && f(a) && f(b);

  const subir = (motivo: string): Propuesta => ({ tipo: 'subir', deltaKcal: PASO_KCAL, texto: `${motivo} Sube a ${fmt0(kcal + PASO_KCAL)} kcal.`, porQue: 'calibracion' });
  const bajar = (motivo: string): Propuesta =>
    kcal - PASO_KCAL < perfil.pisoKcal
      ? { tipo: 'pausa', deltaKcal: 0, texto: `${motivo} Ya estás cerca del piso de ${fmt0(perfil.pisoKcal)} kcal: mejor 1–2 semanas en mantención antes de seguir.`, porQue: 'pausa' }
      : { tipo: 'bajar', deltaKcal: -PASO_KCAL, texto: `${motivo} Baja a ${fmt0(kcal - PASO_KCAL)} kcal (el ajuste sale de los carbohidratos).`, porQue: 'calibracion' };

  if (perfil.objetivo === 'perder_grasa') {
    if (dosSemanas((x) => x > peso * RITMO.perderMax)) return subir(`Bajaste más de ${fmt1(peso * RITMO.perderMax)} kg por semana dos semanas seguidas: cuida el músculo.`);
    if (cambio3 !== null && -cambio3 < peso * RITMO.perderMin) return bajar('3 semanas sin bajar.');
    return null;
  }
  if (perfil.objetivo === 'ganar_musculo') {
    if (dosSemanas((x) => -x > peso * RITMO.ganarMax)) return bajar(`Subiste más de ${fmt1(peso * RITMO.ganarMax)} kg por semana dos semanas seguidas: parte de eso es grasa.`);
    if (cambio3 !== null && cambio3 < peso * RITMO.ganarMin) return subir('3 semanas sin subir de peso.');
    return null;
  }
  if (cambio3 !== null && cambio3 > peso * RITMO.mantenerTres) return bajar('3 semanas subiendo de peso.');
  if (cambio3 !== null && cambio3 < -peso * RITMO.mantenerTres) return subir('3 semanas bajando de peso.');
  return null;
}

export function aplicarKcal(datos: Datos, delta: number, ahora = new Date()): Datos {
  return { ...datos, perfil: { ...datos.perfil, caloriasObjetivo: datos.perfil.caloriasObjetivo + delta }, ultimoAjusteKcal: ahora.toISOString() };
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
