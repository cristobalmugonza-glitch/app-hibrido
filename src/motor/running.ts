import type { Datos, SesionRunning, TipoRunning, ZonaMolestia } from '../tipos/modelo';
import { diasEntre, enVentana } from './fechas';
import { fmt1, rangoRitmo, ritmo } from './formato';
import { contextoSemana, decidirTipo, primeraSemana, TIPOS_RUNNING, tipoSemana } from './planificacion';
import { inicioSemana, sumarDias } from './semanas';

export const ritmoSesion = (s: SesionRunning) => (s.duracionMin * 60) / s.distanciaKm;

// Zonas por % de FC máxima. Con FCmáx 199 dan 119/129/149/163/177.
const LIMITES = [0.6, 0.65, 0.75, 0.82, 0.89, 1];
export type Zona = { nombre: string; desde: number; hasta: number };
export function zonas(fcMax: number): Zona[] {
  return [1, 2, 3, 4, 5].map((z) => ({ nombre: `Z${z}`, desde: Math.round(fcMax * LIMITES[z - 1]), hasta: Math.round(fcMax * LIMITES[z]) }));
}
export function zonaDe(fc: number, fcMax: number): string {
  const z = zonas(fcMax).find((x) => fc >= x.desde && fc < x.hasta);
  if (z) return z.nombre;
  return fc >= fcMax ? 'Z5' : 'bajo Z1';
}

// El test de 8 km se corre en Z2 alta: 4 lpm bajo el tope de la Z2.
export const fcTest = (fcMax: number) => zonas(fcMax)[1].hasta - 4;

export function ritmoBase(datos: Datos): { segKm: number; fuente: 'test' | 'semilla' } {
  const test = datos.sesionesRunning.filter((s) => s.tipo === 'test' && s.distanciaKm > 0).at(-1);
  return test ? { segKm: ritmoSesion(test), fuente: 'test' } : { segKm: datos.perfil.ritmoSemillaSegKm, fuente: 'semilla' };
}

export type TipoCalidad = 'fartlek' | '800' | '1000';
export function tipoCalidad(mesociclo: number): TipoCalidad {
  return (['fartlek', '800', '1000'] as const)[(Math.max(1, mesociclo) - 1) % 3];
}
export function nombreCalidad(mesociclo: number): string {
  return { fartlek: 'Fartlek', '800': '800 m', '1000': '1000 m' }[tipoCalidad(mesociclo)];
}

export const tieneProtocoloTobillo = (datos: Datos) => datos.rutina.plantillas.some((p) => p.ejercicios.some((e) => e.esProtocoloTobillo));

export const salidasPorSemana = (datos: Datos) => TIPOS_RUNNING.reduce((a, t) => a + Math.max(0, datos.rutina.running[t]), 0);

export function kmEnVentana(datos: Datos, ahora: Date, desde: number, hasta: number): number {
  return datos.sesionesRunning.filter((s) => enVentana(s.fecha, ahora, desde, hasta)).reduce((a, s) => a + s.distanciaKm, 0);
}

export function kmHechosSemana(datos: Datos, inicio: string): number {
  return datos.sesionesRunning.filter((s) => inicioSemana(s.fecha) === inicio).reduce((a, s) => a + s.distanciaKm, 0);
}

// Promedio real de las últimas 4 semanas, cuando ya hay 3 semanas de historial.
export function promedioReal(datos: Datos, ahora: Date): number | null {
  const conHistoria = datos.sesionesRunning.some((s) => diasEntre(s.fecha, ahora) >= 21);
  return conHistoria ? kmEnVentana(datos, ahora, 0, 28) / 4 : null;
}

// ---------- Molestias ----------

export function estadoTobillo(datos: Datos, ahora: Date) {
  const recientes = datos.molestias.filter((m) => m.zona === 'tobillo' && enVentana(m.fecha, ahora, 0, 7));
  return {
    repetida: recientes.filter((m) => m.intensidad >= 2).length >= 2,
    severa: recientes.some((m) => m.intensidad === 3),
  };
}

export type AjustesRunning = { factor: number; calidadAZ2: boolean };

// Ajuste del día por el tobillo. La descarga ya viene incluida en los km de la semana.
export function ajustesRunning(datos: Datos, ahora: Date): AjustesRunning {
  const t = estadoTobillo(datos, ahora);
  return { factor: t.repetida ? 0.8 : 1, calidadAZ2: t.severa };
}

const ZONAS_CORREDOR: ZonaMolestia[] = ['tobillo', 'rodilla', 'cadera'];

function molestiasEnSemana(datos: Datos, inicio: string): boolean {
  const ms = datos.molestias.filter((m) => ZONAS_CORREDOR.includes(m.zona) && inicioSemana(m.fecha) === inicio);
  return ms.some((m) => m.intensidad === 3) || ms.filter((m) => m.intensidad >= 2).length >= 2;
}

// ---------- Km de la semana (progresión) ----------

export const SUBIDA_KM = 0.08;
export const CUMPLIMIENTO_SUBE = 0.8;
export const CUMPLIMIENTO_REPITE = 0.5;
export const BAJADA_KM = 0.9;
export const DESCARGA_KM = 0.6;
export const PISO_MANTENCION = 2 / 3;

export type MotivoKm = 'sin_running' | 'base' | 'mantener' | 'sube' | 'tope' | 'repite' | 'baja' | 'descarga' | 'molestias';

// anterior y hechos: la última semana de carga con la que se decidió. supone: se asumió que completas la semana en curso.
export type ObjetivoKm = { km: number; motivo: MotivoKm; anterior?: number; hechos?: number; supone?: boolean };

export const pisoKm = (datos: Datos) => Math.round(datos.perfil.kmBaseSemanal * PISO_MANTENCION);

const cacheKm = new WeakMap<Datos, Map<string, ObjetivoKm>>();

// Km objetivo de una semana, a partir de tu historial. Las semanas pasadas usan su tipo registrado;
// al proyectar la semana siguiente se asume que completas la semana en curso.
export function objetivoKm(datos: Datos, inicio: string, ahora: Date): ObjetivoKm {
  const actual = inicioSemana(ahora);
  let memo = cacheKm.get(datos);
  if (!memo) {
    memo = new Map();
    cacheKm.set(datos, memo);
  }
  const clave = `${inicio}|${actual}`;
  const guardado = memo.get(clave);
  if (guardado) return guardado;
  const r = calcularObjetivoKm(datos, inicio, ahora, actual);
  memo.set(clave, r);
  return r;
}

function calcularObjetivoKm(datos: Datos, inicio: string, ahora: Date, actual: string): ObjetivoKm {
  if (!salidasPorSemana(datos)) return { km: 0, motivo: 'sin_running' };
  const { perfil } = datos;
  const tope = perfil.topeKmSemanal;
  const base = Math.min(perfil.kmBaseSemanal, tope);
  const tipo = inicio < actual ? tipoSemana(datos, inicio) : decidirTipo(datos, inicio, inicio > actual ? actual : undefined).tipo;

  const primera = primeraSemana(datos);
  let previa = sumarDias(inicio, -7);
  while (previa >= primera && tipoSemana(datos, previa) === 'descarga') previa = sumarDias(previa, -7);

  if (previa < primera) return tipo === 'descarga' ? { km: Math.round(base * DESCARGA_KM), motivo: 'descarga', anterior: base } : { km: base, motivo: 'base' };

  const anterior = objetivoKm(datos, previa, ahora).km;
  if (tipo === 'descarga') return { km: Math.round(anterior * DESCARGA_KM), motivo: 'descarga', anterior };
  if (perfil.metaRunning === 'mantener') return { km: base, motivo: 'mantener' };

  const hechos = kmHechosSemana(datos, previa);
  const supone = previa === actual && inicio > actual;
  const cumplimiento = supone || anterior <= 0 ? 1 : hechos / anterior;
  const info = { anterior, hechos, ...(supone ? { supone } : {}) };

  if (molestiasEnSemana(datos, previa)) return { km: Math.min(anterior, tope), motivo: 'molestias', ...info };
  if (cumplimiento >= CUMPLIMIENTO_SUBE) {
    const km = Math.max(Math.round(anterior * (1 + SUBIDA_KM)), anterior + 1);
    return km >= tope ? { km: tope, motivo: 'tope', ...info } : { km, motivo: 'sube', ...info };
  }
  // La primera semana suele quedar a medias (empezaste a mitad de semana): se repite en vez de bajar.
  if (cumplimiento >= CUMPLIMIENTO_REPITE || previa === primera) return { km: Math.min(anterior, tope), motivo: 'repite', ...info };
  return { km: Math.max(pisoKm(datos), Math.round(anterior * BAJADA_KM)), motivo: 'baja', ...info };
}

export function textoObjetivoKm(o: ObjetivoKm): string {
  const km = `${fmt1(o.km)} km`;
  const antes = fmt1(o.anterior ?? 0);
  const hechos = fmt1(o.hechos ?? 0);
  switch (o.motivo) {
    case 'sin_running':
      return '';
    case 'base':
      return `Parte en tus ${km} base.`;
    case 'mantener':
      return `Mantención: tus ${km} base cada semana, con la calidad para no perder el ritmo.`;
    case 'descarga':
      return 'Descarga: 60 % de tu última semana de carga.';
    case 'sube':
      return o.supone ? `Sube a ${km} (+8 %) si completas los ${antes} km de esta semana.` : `Sube a ${km} (+8 %): cumpliste ${hechos} de ${antes} km en tu última semana de carga.`;
    case 'tope':
      return `Llegas a tu tope de ${km}: no sube más.`;
    case 'repite':
      return `Repite ${km}: hiciste ${hechos} de ${antes} km. Sube cuando cumplas el 80 %.`;
    case 'baja':
      return `Baja a ${km}: hiciste ${hechos} de ${antes} km. Retoma de a poco.`;
    case 'molestias':
      return `Se queda en ${km} por las molestias de tu última semana de carga.`;
  }
}

export const porQueObjetivoKm = (o: ObjetivoKm) => (o.motivo === 'mantener' ? 'mantener_running' : o.motivo === 'descarga' ? 'descarga' : 'progresion_running');

// ---------- Reparto de los km en las salidas ----------

const BASE_REPS: Record<TipoCalidad, number> = { fartlek: 5, '800': 4, '1000': 3 };
const KM_POR_REP: Record<TipoCalidad, number> = { fartlek: 0.75, '800': 1.15, '1000': 1.4 };

const aMedio = (x: number) => Math.round(x * 2) / 2;
const acotar = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));

// Con pocas salidas el fondo pesa más en la semana (práctica común).
const fraccionFondo = (salidas: number) => (salidas <= 2 ? 0.55 : salidas === 3 ? 0.45 : salidas === 4 ? 0.4 : 0.33);

export type Reparto = { z2: number; calidad: number; fondo: number; repeticiones: number; total: number };
export type EtapaSemana = { mesociclo: number; semanaDeCarga: number; descarga: boolean };

// Fondo como la salida larga, calidad según sus repeticiones y el resto en Z2.
// Las repeticiones de calidad suben una por semana de carga y bajan una en descarga.
export function repartirKm(datos: Datos, km: number, etapa: EtapaSemana): Reparto {
  const n = datos.rutina.running;
  const salidas = salidasPorSemana(datos);
  const kmRef = km > 0 ? km : datos.perfil.kmBaseSemanal;
  const cual = tipoCalidad(etapa.mesociclo);
  const escala = acotar(kmRef / 30, 0.6, 1);
  const repeticiones = Math.max(2, Math.round((BASE_REPS[cual] + (etapa.descarga ? -1 : etapa.semanaDeCarga - 1)) * escala));
  const calidad = aMedio(3.5 + repeticiones * KM_POR_REP[cual]);
  let fondo = aMedio(acotar((kmRef * fraccionFondo(Math.max(1, salidas))) / Math.max(1, n.fondo), 4, datos.perfil.topeFondoKm));
  const resto = kmRef - n.calidad * calidad - n.fondo * fondo;
  const z2 = n.z2 ? aMedio(Math.max(3, resto / n.z2)) : aMedio(Math.max(4, kmRef * 0.25));
  if (!n.z2 && n.fondo && resto > 0) fondo = aMedio(Math.min(datos.perfil.topeFondoKm, fondo + resto / n.fondo));
  const total = km > 0 ? n.z2 * z2 + n.calidad * calidad + n.fondo * fondo : 0;
  return { z2, calidad, fondo, repeticiones, total };
}

export type PlanRunning = EtapaSemana & { objetivo: ObjetivoKm; reparto: Reparto };

export function planRunning(datos: Datos, inicio: string, ahora: Date): PlanRunning {
  const actual = inicioSemana(ahora);
  const ctx = contextoSemana(datos, inicio, inicio > actual ? actual : undefined);
  const etapa = { mesociclo: ctx.mesociclo, semanaDeCarga: ctx.semanaDeCarga, descarga: ctx.descarga };
  const objetivo = objetivoKm(datos, inicio, ahora);
  return { ...etapa, objetivo, reparto: repartirKm(datos, objetivo.km, etapa) };
}

// ---------- Prescripción de una salida ----------

export type Prescripcion = {
  tipo: TipoRunning;
  etiqueta: string;
  km: number;
  lineas: { texto: string; porQue?: string }[];
};

export function prescribir(tipo: TipoRunning, datos: Datos, plan: PlanRunning, aj: AjustesRunning): Prescripcion {
  const { perfil } = datos;
  const { reparto, mesociclo } = plan;
  const base = ritmoBase(datos).segKm;
  const z = zonas(perfil.fcMax);
  const tobillo = tieneProtocoloTobillo(datos) ? [{ texto: 'Antes: equilibrio unipodal 2 × 30 s por lado', porQue: 'tobillo_frecuencia' }] : [];

  if (tipo === 'z2' || (tipo === 'calidad' && aj.calidadAZ2)) {
    const lineas = [{ texto: `FC ${z[1].desde}–${z[1].hasta} lpm · guía ~${ritmo(base)}/km`, porQue: 'zonas_fc' }, ...tobillo];
    if (tipo === 'calidad') lineas.unshift({ texto: 'Tobillo: esta calidad pasa a Z2', porQue: 'tobillo_alerta' });
    return { tipo, etiqueta: 'Z2', km: aMedio((tipo === 'z2' ? reparto.z2 : reparto.calidad) * aj.factor), lineas };
  }

  if (tipo === 'fondo') {
    return {
      tipo,
      etiqueta: 'Fondo',
      km: aMedio(reparto.fondo * aj.factor),
      lineas: [{ texto: `Z2 a ${rangoRitmo(base + 10, base + 20)}/km; los últimos 2–3 km pueden subir a Z3 (${z[2].desde}–${z[2].hasta} lpm)`, porQue: 'progresion_running' }, ...tobillo],
    };
  }

  const cual = tipoCalidad(mesociclo);
  const n = Math.max(2, Math.round(reparto.repeticiones * aj.factor));
  const texto = {
    fartlek: `${n} × 2 min a ${rangoRitmo(base - 60, base - 45)}/km, 2 min suave entre medio`,
    '800': `${n} × 800 m a ${rangoRitmo(base - 90, base - 75)}/km, 2 min trotando entre series`,
    '1000': `${n} × 1000 m a ${rangoRitmo(base - 80, base - 65)}/km, 2–3 min trotando entre series`,
  }[cual];
  return {
    tipo,
    etiqueta: nombreCalidad(mesociclo),
    km: aMedio(3.5 + n * KM_POR_REP[cual]),
    lineas: [{ texto, porQue: 'calidad' }, { texto: 'Calentamiento 2 km en Z1–Z2 y 1,5 km suave al final', porQue: 'ritmos_test' }, ...tobillo],
  };
}

// km de los últimos 7 días vs. el promedio semanal de las 4 semanas previas.
export function saltoCarga(datos: Datos, ahora: Date): { km7: number; promedioPrevio: number; pct: number } | null {
  const previas = datos.sesionesRunning.filter((s) => enVentana(s.fecha, ahora, 7, 35));
  if (previas.length < 4) return null;
  const km7 = kmEnVentana(datos, ahora, 0, 7);
  const promedioPrevio = previas.reduce((a, s) => a + s.distanciaKm, 0) / 4;
  if (promedioPrevio <= 0) return null;
  return { km7, promedioPrevio, pct: (km7 / promedioPrevio - 1) * 100 };
}

// Ritmo en sesiones Z2/test con FC promedio en Z2 o menos: la palanca de densidad aeróbica.
export function tendenciaZ2(datos: Datos): { fecha: string; segKm: number }[] {
  const tope = zonas(datos.perfil.fcMax)[1].hasta;
  return datos.sesionesRunning
    .filter((s) => (s.tipo === 'z2' || s.tipo === 'test') && s.fcPromedio > 0 && s.fcPromedio <= tope && s.distanciaKm > 0)
    .map((s) => ({ fecha: s.fecha, segKm: ritmoSesion(s) }));
}
