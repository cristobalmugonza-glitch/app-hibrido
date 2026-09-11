import type { Datos, Perfil, SesionRunning, TipoRunning } from '../tipos/modelo';
import type { Contexto } from './secuencia';
import { enVentana } from './fechas';
import { rangoRitmo, ritmo } from './formato';

export const ritmoSesion = (s: SesionRunning) => (s.duracionMin * 60) / s.distanciaKm;

// Zonas por % de FC máxima. Con FCmáx 199 reproducen las zonas del usuario (119/129/149/163/177).
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

export function ritmoBase(datos: Datos): { segKm: number; fuente: 'test' | 'semilla' } {
  const test = datos.sesionesRunning.filter((s) => s.tipo === 'test' && s.distanciaKm > 0).at(-1);
  return test ? { segKm: ritmoSesion(test), fuente: 'test' } : { segKm: datos.perfil.ritmoSemillaSegKm, fuente: 'semilla' };
}

export type TipoCalidad = 'fartlek' | '800' | '1000';
export function tipoCalidad(ciclo: number): TipoCalidad {
  return (['fartlek', '800', '1000'] as const)[(ciclo - 1) % 3];
}
export function nombreCalidad(ciclo: number): string {
  return { fartlek: 'Fartlek', '800': '800 m', '1000': '1000 m' }[tipoCalidad(ciclo)];
}

// +1 km cada 2 ciclos (≈ 8 semanas), con tope.
export function fondoKm(perfil: Perfil, ciclo: number): number {
  return Math.min(perfil.topeFondoKm, perfil.fondoKmInicial + Math.floor((ciclo - 1) / 2));
}

export type AjustesRunning = { factor: number; calidadAZ2: boolean };

export type Prescripcion = {
  tipo: TipoRunning;
  etiqueta: string;
  km: number;
  lineas: { texto: string; porQue?: string }[];
};

const aMedio = (x: number) => Math.round(x * 2) / 2;

export function prescribir(tipo: TipoRunning, datos: Datos, ctx: Contexto, aj: AjustesRunning): Prescripcion {
  const { perfil } = datos;
  const base = ritmoBase(datos).segKm;
  const z = zonas(perfil.fcMax);
  const equilibrio = { texto: 'Antes: equilibrio unipodal 2 × 30 s por lado', porQue: 'tobillo_frecuencia' };

  if (tipo === 'z2' || (tipo === 'calidad' && aj.calidadAZ2)) {
    const lineas = [{ texto: `FC ${z[1].desde}–${z[1].hasta} lpm · guía ~${ritmo(base)}/km`, porQue: 'zonas_fc' }, equilibrio];
    if (tipo === 'calidad') lineas.unshift({ texto: 'Tobillo: esta calidad pasa a Z2', porQue: 'tobillo_alerta' });
    return { tipo, etiqueta: 'Z2', km: aMedio(perfil.z2Km * aj.factor), lineas };
  }

  if (tipo === 'fondo') {
    return {
      tipo,
      etiqueta: 'Fondo',
      km: aMedio(fondoKm(perfil, ctx.ciclo) * aj.factor),
      lineas: [{ texto: `Z2 a ${rangoRitmo(base + 10, base + 20)}/km; los últimos 2–3 km pueden subir a Z3 (${z[2].desde}–${z[2].hasta} lpm)`, porQue: 'fondo_progresion' }, equilibrio],
    };
  }

  const cual = tipoCalidad(ctx.ciclo);
  const def = {
    fartlek: { n: 6, kmPorRep: 0.75, texto: (n: number) => `${n} × 2 min a ${rangoRitmo(base - 60, base - 45)}/km, 2 min suave entre medio` },
    '800': { n: 5, kmPorRep: 1.15, texto: (n: number) => `${n} × 800 m a ${rangoRitmo(base - 90, base - 75)}/km, 2 min trotando entre series` },
    '1000': { n: 4, kmPorRep: 1.4, texto: (n: number) => `${n} × 1000 m a ${rangoRitmo(base - 80, base - 65)}/km, 2–3 min trotando entre series` },
  }[cual];
  const n = Math.max(2, Math.round(def.n * aj.factor));
  return {
    tipo,
    etiqueta: nombreCalidad(ctx.ciclo),
    km: aMedio(3.5 + n * def.kmPorRep),
    lineas: [{ texto: def.texto(n), porQue: 'calidad' }, { texto: 'Calentamiento 2 km en Z1–Z2 y 1,5 km suave al final', porQue: 'ritmos_test' }, equilibrio],
  };
}

export function kmEnVentana(datos: Datos, ahora: Date, desde: number, hasta: number): number {
  return datos.sesionesRunning.filter((s) => enVentana(s.fecha, ahora, desde, hasta)).reduce((a, s) => a + s.distanciaKm, 0);
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
