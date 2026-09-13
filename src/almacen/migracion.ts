import type { Datos, EjercicioDef, Medidas, Molestia, Perfil, PlantillaGym, SesionGym, SesionRunning, TipoRunning, ZonaMolestia } from '../tipos/modelo';
import { PRIORIDADES_BASE } from '../data/reglas-tipo';
import { diaLocal } from '../motor/fechas';
import { inicioSemana } from '../motor/semanas';

// Datos leídos de localStorage o de un respaldo: se validan campo a campo antes de usarlos.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Suelto = any;

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const lista = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);
const numero = (x: unknown, defecto: number) => (typeof x === 'number' && isFinite(x) ? x : defecto);

const ZONAS: ZonaMolestia[] = ['tobillo', 'rodilla', 'cadera', 'espalda', 'hombro', 'otro'];

function perfilBase(ahora: Date): Perfil {
  return {
    sexo: 'hombre',
    altura: 170,
    pesoInicial: 70,
    fcMax: 190,
    fechaInicio: diaLocal(ahora),
    objetivo: 'mantener',
    caloriasObjetivo: 2200,
    proteinaObjetivo: 120,
    grasaObjetivo: 65,
    pisoKcal: 1500,
    topeKmSemanal: 30,
    topeFondoKm: 18,
    kmBaseSemanal: 20,
    metaRunning: 'mejorar',
    ritmoSemillaSegKm: 360,
  };
}

// Antes el perfil guardaba la distancia del Z2 y del fondo; ahora guarda los km semanales base.
function perfilActual(p: unknown, running: Record<TipoRunning, number>, ahora: Date, extra: Partial<Perfil> = {}): Perfil {
  const { z2Km, fondoKmInicial, ...resto } = (esObjeto(p) ? p : {}) as Suelto;
  const perfil: Perfil = { ...perfilBase(ahora), ...resto, ...extra };
  if (typeof resto.kmBaseSemanal !== 'number') {
    const km = numero(z2Km, 0) * running.z2 + numero(fondoKmInicial, 0) * running.fondo + 8 * running.calidad;
    perfil.kmBaseSemanal = km > 0 ? Math.round(km) : 20;
  }
  if (resto.metaRunning !== 'mantener' && resto.metaRunning !== 'mejorar') perfil.metaRunning = 'mejorar';
  return perfil;
}

export function migrar(crudo: unknown, ahora = new Date()): Datos | null {
  if (!esObjeto(crudo)) return null;
  if (crudo.version === 2) return esV2(crudo) ? normalizar(crudo as Suelto, ahora) : null;
  if (crudo.version === 1) return esV1(crudo) ? desdeV1(crudo as Suelto, ahora) : null;
  return null;
}

function esV2(x: Record<string, unknown>): boolean {
  const { perfil, rutina } = x;
  return esObjeto(perfil) && typeof perfil.fcMax === 'number' && esObjeto(rutina) && Array.isArray(rutina.plantillas) && esObjeto(rutina.running);
}

function esV1(x: Record<string, unknown>): boolean {
  const { perfil, rutina, cola } = x;
  return (
    esObjeto(perfil) &&
    typeof perfil.fcMax === 'number' &&
    esObjeto(rutina) &&
    Array.isArray(rutina.plantillas) &&
    Array.isArray(rutina.secuencia) &&
    esObjeto(cola) &&
    typeof cola.vueltasCompletadas === 'number'
  );
}

// Completa lo que falte en datos v2 (por ejemplo, un respaldo antiguo o editado a mano).
export function normalizar(d: Suelto, ahora = new Date()): Datos {
  const running = { z2: numero(d.rutina.running.z2, 0), calidad: numero(d.rutina.running.calidad, 0), fondo: numero(d.rutina.running.fondo, 0) };
  return {
    version: 2,
    perfil: perfilActual(d.perfil, running, ahora),
    rutina: {
      plantillas: lista<Suelto>(d.rutina.plantillas).map((p) => ({ id: String(p.id), nombre: String(p.nombre ?? 'Sesión'), ejercicios: lista<EjercicioDef>(p.ejercicios), vecesPorSemana: numero(p.vecesPorSemana, 1) })),
      running,
      prioridades: { ...PRIORIDADES_BASE, ...(esObjeto(d.rutina.prioridades) ? d.rutina.prioridades : {}) },
    },
    ejerciciosPropios: lista(d.ejerciciosPropios),
    planes: lista(d.planes),
    mesociclosPrevios: numero(d.mesociclosPrevios, 0),
    ...(typeof d.ultimoAjusteKcal === 'string' ? { ultimoAjusteKcal: d.ultimoAjusteKcal } : {}),
    sesionesGym: lista(d.sesionesGym),
    sesionesRunning: lista(d.sesionesRunning),
    pesos: lista(d.pesos),
    molestias: lista(d.molestias),
    medidas: lista(d.medidas),
    dominadas: lista(d.dominadas),
    ...(esObjeto(d.entrenoHoy) ? { entrenoHoy: d.entrenoHoy as Datos['entrenoHoy'] } : {}),
    ...(esObjeto(d.borradorGym) ? { borradorGym: d.borradorGym as Datos['borradorGym'] } : {}),
  };
}

// v1 (cola de sesiones) → v2 (plan semanal). Nada del historial se pierde.
function desdeV1(v: Suelto, ahora: Date): Datos {
  const secuencia = lista<Suelto>(v.rutina.secuencia);
  const running: Record<TipoRunning, number> = { z2: 0, calidad: 0, fondo: 0 };
  for (const paso of secuencia) if (paso.clase === 'running' && paso.tipo in running) running[paso.tipo as TipoRunning]++;

  const plantillas: PlantillaGym[] = lista<Suelto>(v.rutina.plantillas).map((p) => ({
    id: String(p.id),
    nombre: String(p.nombre),
    ejercicios: lista<EjercicioDef>(p.ejercicios),
    // Cada aparición de la sesión en la cola pasa a ser una vez por semana.
    vecesPorSemana: secuencia.filter((paso) => paso.clase === 'gym' && paso.plantillaId === p.id).length,
  }));
  const defs = new Map(plantillas.flatMap((p) => p.ejercicios.map((e) => [e.id, e] as const)));

  const sesionGym = (s: Suelto): SesionGym => ({
    id: String(s.id),
    fecha: String(s.fecha),
    plantillaId: String(s.plantillaId),
    nombre: String(s.nombre),
    descarga: !!s.descarga,
    ejercicios: lista<Suelto>(s.ejercicios).map((e) => {
      const def = defs.get(e.ejercicioId);
      return {
        ejercicioId: String(e.ejercicioId),
        nombre: String(e.nombre),
        musculos: e.musculos ?? def?.musculos ?? [],
        ...((e.secundarios ?? def?.secundarios) ? { secundarios: e.secundarios ?? def?.secundarios } : {}),
        series: lista(e.series),
        ...(e.notas ? { notas: e.notas } : {}),
      };
    }),
  });

  const sesionRunning = (s: Suelto): SesionRunning => ({
    id: String(s.id),
    fecha: String(s.fecha),
    tipo: s.tipo,
    distanciaKm: numero(s.distanciaKm, 0),
    duracionMin: numero(s.duracionMin, 0),
    fcPromedio: numero(s.fcPromedio, 0),
    ...(typeof s.fcMaxima === 'number' ? { fcMaxima: s.fcMaxima } : {}),
    ...(s.equilibrioHecho ? { equilibrioHecho: true } : {}),
    ...(s.notas ? { notas: s.notas } : {}),
  });

  const molestia = (m: Suelto): Molestia => ({
    fecha: String(m.fecha),
    zona: m.zona === 'tobillo_der' ? 'tobillo' : ZONAS.includes(m.zona) ? m.zona : 'otro',
    intensidad: m.intensidad,
    ...(m.nota ? { nota: m.nota } : {}),
  });

  const medida = (m: Suelto): Medidas => ({
    fecha: String(m.fecha),
    cintura: numero(m.cintura, 0),
    ...Object.fromEntries(['cuello', 'cadera', 'hombros', 'brazo', 'muslo', 'grasaNavy'].filter((k) => typeof m[k] === 'number').map((k) => [k, m[k]])),
    ...(m.fotoTomada ? { fotoTomada: true } : {}),
  });

  const vueltas = numero(v.cola.vueltasCompletadas, 0);
  const ciclo = Math.floor(vueltas / 4) + 1;
  const sesiones = plantillas.reduce((a, p) => a + p.vecesPorSemana, 0) + running.z2 + running.calidad + running.fondo;

  return {
    version: 2,
    // La v1 solo la usó el corte de sept 2026: objetivo de perder grasa con el piso de 1.900 kcal acordado.
    perfil: perfilActual(v.perfil, running, ahora, { objetivo: 'perder_grasa', pisoKcal: 1900 }),
    rutina: { plantillas, running, prioridades: { ...PRIORIDADES_BASE, ...(esObjeto(v.rutina.prioridades) ? v.rutina.prioridades : {}) } },
    // Los ejercicios de la rutina antigua quedan en la biblioteca propia, para reusarlos en cualquier sesión.
    ejerciciosPropios: [...defs.values()],
    // La vuelta 4 de la cola era descarga: si se estaba en ella, esta semana sigue siéndolo.
    planes: vueltas % 4 === 3 ? [{ inicio: inicioSemana(ahora), tipo: 'descarga', sesiones }] : [],
    mesociclosPrevios: ciclo - 1,
    sesionesGym: lista<Suelto>(v.sesionesGym).map(sesionGym),
    sesionesRunning: lista<Suelto>(v.sesionesRunning).map(sesionRunning),
    pesos: lista(v.pesos),
    molestias: lista<Suelto>(v.molestias).map(molestia),
    medidas: lista<Suelto>(v.medidas).map(medida),
    dominadas: lista<Suelto>(v.dominadas).map((d) => ({ fecha: String(d.fecha), lastreKg: numero(d.lastreKg, 0), reps: numero(d.reps, 0) })),
    ...(esObjeto(v.entrenoHoy) ? { entrenoHoy: v.entrenoHoy } : {}),
    ...(esObjeto(v.borradorGym) && esObjeto(v.borradorGym.sesion) ? { borradorGym: { sesion: sesionGym(v.borradorGym.sesion), indiceEjercicio: numero(v.borradorGym.indiceEjercicio, 0) } } : {}),
  };
}
