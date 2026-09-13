import type { Datos, Musculo, PlantillaGym, RefBloque, TipoSemana } from '../tipos/modelo';
import { CATALOGO_POR_ID, desdeCatalogo } from '../data/catalogo';
import { MUSCULOS, NOMBRE_MUSCULO, OBJETIVO_SERIES, TREN_INFERIOR } from '../data/reglas-tipo';
import { ajustesRunning } from './alertas';
import { pendientes } from './benchmarks';
import { fmt0, fmt1, fmt2 } from './formato';
import { aplicarKcal, propuestaKcal } from './nutricion';
import {
  contextoSemana,
  corre,
  decidirTipo,
  hechasEnSemana,
  listaBloques,
  planGuardado,
  primeraSemana,
  SEMANAS_DE_CARGA,
  sesionesPlanificadas,
  TIPOS_RUNNING,
  totalSesiones,
  type ContextoSemana,
} from './planificacion';
import { historialDe, sugerir } from './progresion';
import { fondoKm, kmEnVentana, nombreCalidad, prescribir } from './running';
import { aFechaLocal, inicioSemana, sumarDias } from './semanas';
import { listaTexto } from './sugerencia';
import { seriesPlanificadas, seriesPorSesion } from './volumen';

export type Accion =
  | { tipo: 'series'; plantillaId: string; ejercicioId: string; delta: number }
  | { tipo: 'agregar'; plantillaId: string; catalogoId: string; series: number }
  | { tipo: 'veces'; ref: RefBloque; delta: number }
  | { tipo: 'kcal'; delta: number };

export type Ajuste = { id: string; titulo: string; detalle?: string; porQue: string; accion?: Accion };

export type Proyeccion = { inicio: string; tipo: TipoSemana; sesiones: number; bloques: string; ajustes: Ajuste[] };

// Subir el volumen de a poco: hasta 2 series por semana por músculo (práctica común).
const MAX_SERIES_SEMANA = 2;
const MAX_SERIES_EJERCICIO = 6;
const MAX_AJUSTES_VOLUMEN = 4;
export const UMBRAL_ADHERENCIA = 0.7;

// Ejercicio de catálogo para un músculo sin trabajo directo, y con qué músculo se agrupa al elegir la sesión.
const POR_DEFECTO: Record<Musculo, string> = {
  pecho: 'c_aperturas_polea',
  espalda: 'c_remo_polea',
  hombro_lateral: 'c_laterales_polea',
  hombro_posterior: 'c_face_pull',
  biceps: 'c_curl_mancuernas',
  triceps: 'c_triceps_polea',
  cuadriceps: 'c_extension_cuadriceps',
  isquios_gluteos: 'c_curl_femoral',
  gemelos: 'c_gemelos_pie',
  abdomen: 'c_crunch_polea',
};
const AFIN: Record<Musculo, Musculo[]> = {
  pecho: ['pecho'],
  triceps: ['pecho', 'triceps'],
  hombro_lateral: ['pecho', 'hombro_lateral'],
  espalda: ['espalda'],
  biceps: ['espalda', 'biceps'],
  hombro_posterior: ['espalda', 'hombro_posterior'],
  cuadriceps: TREN_INFERIOR,
  isquios_gluteos: TREN_INFERIOR,
  gemelos: TREN_INFERIOR,
  abdomen: [],
};

const total = (p: PlantillaGym) => p.ejercicios.reduce((a, e) => a + e.series, 0);

function sesionPara(activas: PlantillaGym[], m: Musculo, catalogoId: string): PlantillaGym | undefined {
  const candidatas = activas.filter((p) => !p.ejercicios.some((e) => e.id === catalogoId));
  const afinidad = (p: PlantillaGym) => {
    const s = seriesPorSesion(p);
    return AFIN[m].reduce((a, x) => a + s[x], 0);
  };
  return [...candidatas].sort((a, b) => afinidad(b) - afinidad(a) || total(a) - total(b))[0];
}

function ajustesVolumen(datos: Datos): Ajuste[] {
  const activas = datos.rutina.plantillas.filter((p) => p.vecesPorSemana > 0);
  if (!activas.length) return [];
  const plan = seriesPlanificadas(datos.rutina);
  const peso = { alta: 0, media: 1, mantencion: 2 };
  const res: { orden: number; ajuste: Ajuste }[] = [];

  for (const m of MUSCULOS) {
    const prioridad = datos.rutina.prioridades[m] ?? 'media';
    const [min, max] = OBJETIVO_SERIES[prioridad];
    const s = plan[m];
    const nombre = NOMBRE_MUSCULO[m];
    const tope = (veces: number) => Math.max(1, Math.floor(MAX_SERIES_SEMANA / veces));

    // En mantención y sin ninguna serie planificada se entiende que no lo entrenas a propósito: no se insiste.
    if (s < min && !(s === 0 && prioridad === 'mantencion')) {
      const candidatos = activas
        .flatMap((p) => p.ejercicios.filter((e) => e.musculos.includes(m) && e.series < MAX_SERIES_EJERCICIO).map((e) => ({ p, e })))
        .sort((x, y) => Number(y.e.tipo === 'aislamiento') - Number(x.e.tipo === 'aislamiento') || x.e.series - y.e.series);
      const c = candidatos[0];
      if (c) {
        const delta = Math.max(1, Math.min(Math.ceil((min - s) / c.p.vecesPorSemana), tope(c.p.vecesPorSemana), MAX_SERIES_EJERCICIO - c.e.series));
        res.push({
          orden: peso[prioridad],
          ajuste: {
            id: `vol-${m}`,
            titulo: `${nombre}: ${fmt1(s)} series, bajo tu rango (${min}–${max})`,
            detalle: `Suma ${delta} ${delta === 1 ? 'serie' : 'series'} a ${c.e.nombre} en ${c.p.nombre}.`,
            porQue: 'progresion_volumen',
            accion: { tipo: 'series', plantillaId: c.p.id, ejercicioId: c.e.id, delta },
          },
        });
        continue;
      }
      const catalogoId = POR_DEFECTO[m];
      const destino = sesionPara(activas, m, catalogoId);
      if (!destino) continue;
      const series = Math.max(1, Math.min(3, Math.ceil((min - s) / destino.vecesPorSemana)));
      res.push({
        orden: peso[prioridad],
        ajuste: {
          id: `vol-${m}`,
          titulo: `${nombre}: ${fmt1(s)} series, bajo tu rango (${min}–${max})`,
          detalle: `Agrega ${CATALOGO_POR_ID[catalogoId].nombre} (${series} series) a ${destino.nombre}.`,
          porQue: 'progresion_volumen',
          accion: { tipo: 'agregar', plantillaId: destino.id, catalogoId, series },
        },
      });
    } else if (s > max) {
      // Si el exceso viene solo de ejercicios compuestos (series secundarias), no hay nada razonable que quitar.
      const c = activas
        .flatMap((p) => p.ejercicios.filter((e) => e.musculos.includes(m) && e.series > 1).map((e) => ({ p, e })))
        .sort((x, y) => y.e.series * y.p.vecesPorSemana - x.e.series * x.p.vecesPorSemana)[0];
      if (!c) continue;
      const delta = Math.max(1, Math.min(Math.ceil((s - max) / c.p.vecesPorSemana), tope(c.p.vecesPorSemana), c.e.series - 1));
      res.push({
        orden: 3,
        ajuste: {
          id: `vol-${m}`,
          titulo: `${nombre}: ${fmt1(s)} series, sobre tu rango (${min}–${max})`,
          detalle: `Quita ${delta} ${delta === 1 ? 'serie' : 'series'} a ${c.e.nombre} en ${c.p.nombre}.`,
          porQue: 'progresion_volumen',
          accion: { tipo: 'series', plantillaId: c.p.id, ejercicioId: c.e.id, delta: -delta },
        },
      });
    }
  }
  return res
    .sort((a, b) => a.orden - b.orden)
    .slice(0, MAX_AJUSTES_VOLUMEN)
    .map((r) => r.ajuste);
}

function ajustesCarga(datos: Datos): Ajuste[] {
  const suben: string[] = [];
  const bajan: string[] = [];
  const vistos = new Set<string>();
  for (const p of datos.rutina.plantillas) {
    if (p.vecesPorSemana <= 0) continue;
    for (const e of p.ejercicios) {
      if (vistos.has(e.id)) continue;
      vistos.add(e.id);
      const s = sugerir(e, historialDe(e.id, datos.sesionesGym), false);
      if (s.motivo === 'subir' && s.peso !== null) suben.push(`${e.nombre} ${fmt2(s.peso)} kg`);
      if (s.motivo === 'bajar') bajan.push(s.peso ? `${e.nombre} ${fmt2(s.peso)} kg` : e.nombre);
    }
  }
  const n = (k: number) => (k === 1 ? '1 ejercicio' : `${k} ejercicios`);
  const res: Ajuste[] = [];
  if (suben.length) res.push({ id: 'carga-sube', titulo: `Sube el peso en ${n(suben.length)}`, detalle: suben.join(' · '), porQue: 'doble_progresion' });
  if (bajan.length) res.push({ id: 'carga-baja', titulo: `Baja 10 % en ${n(bajan.length)}`, detalle: bajan.join(' · '), porQue: 'bajar_10' });
  return res;
}

// Dos semanas seguidas bajo el 70 % de lo planificado: mejor un plan que sí se cumple.
function ajusteAdherencia(datos: Datos, actual: string): Ajuste | null {
  const plan = sesionesPlanificadas(datos);
  if (plan < 2) return null;
  const semanas = [sumarDias(actual, -7), sumarDias(actual, -14)];
  if (semanas.some((w) => w < primeraSemana(datos))) return null;
  const hechas = semanas.map((w) => totalSesiones(datos, w));
  const planes = semanas.map((w) => planGuardado(datos, w)?.sesiones ?? plan);
  if (!hechas.every((h, i) => h > 0 && h < planes[i] * UMBRAL_ADHERENCIA)) return null;
  const cumplimiento = (key: string, veces: number) => semanas.reduce((a, w) => a + (hechasEnSemana(datos, w).get(key) ?? 0), 0) / (2 * veces);
  const peor = listaBloques(datos)
    .filter((b) => b.veces > 0)
    .sort((a, b) => cumplimiento(a.key, a.veces) - cumplimiento(b.key, b.veces))[0];
  if (!peor) return null;
  return {
    id: 'adherencia',
    titulo: `Hiciste ${hechas[1]} y ${hechas[0]} de ${plan} sesiones las últimas 2 semanas`,
    detalle: `Un plan que sí cumples rinde más: saca 1 ${peor.nombre} por semana y reparte sus series en lo que sí haces.`,
    porQue: 'adherencia',
    accion: { tipo: 'veces', ref: peor.ref, delta: -1 },
  };
}

function ajustesDeRunning(datos: Datos, ctx: ContextoSemana, ctxActual: ContextoSemana, ahora: Date): Ajuste[] {
  if (!corre(datos)) return [];
  const { perfil, rutina } = datos;
  const aj = ajustesRunning(datos, ahora, ctx.descarga);
  const tipos = TIPOS_RUNNING.filter((t) => rutina.running[t] > 0);
  const salidas = tipos.reduce((a, t) => a + rutina.running[t], 0);
  const km = tipos.reduce((a, t) => a + rutina.running[t] * prescribir(t, datos, ctx.mesociclo, aj).km, 0);
  const subeFondo = rutina.running.fondo > 0 && fondoKm(perfil, ctx.mesociclo) > fondoKm(perfil, ctxActual.mesociclo);
  const partes: string[] = [];
  if (rutina.running.calidad > 0) partes.push(`calidad ${aj.calidadAZ2 ? 'en Z2 por el tobillo' : nombreCalidad(ctx.mesociclo)}`);
  if (rutina.running.fondo > 0) partes.push(`fondo de ${fmt1(prescribir('fondo', datos, ctx.mesociclo, aj).km)} km${subeFondo ? ' (sube 1 km)' : ''}`);

  const res: Ajuste[] = [
    {
      id: 'running',
      titulo: `Running: ${fmt1(km)} km en ${salidas} ${salidas === 1 ? 'salida' : 'salidas'}`,
      detalle: partes.length ? partes.join(' · ').replace(/^./, (c) => c.toUpperCase()) : undefined,
      porQue: subeFondo ? 'fondo_progresion' : 'calidad',
    },
  ];
  if (km > perfil.topeKmSemanal) {
    res.push({ id: 'running-tope', titulo: `Pasas tu tope de ${perfil.topeKmSemanal} km`, detalle: 'Acorta el fondo o saca una salida.', porQue: 'tope_km' });
  }
  const recientes = datos.sesionesRunning.filter((s) => (ahora.getTime() - new Date(s.fecha).getTime()) / 86_400_000 < 28);
  const promedio = kmEnVentana(datos, ahora, 0, 28) / 4;
  if (recientes.length >= 4 && promedio > 0 && km > promedio * 1.3) {
    res.push({ id: 'running-salto', titulo: `Son ${fmt0((km / promedio - 1) * 100)} % más km que tu promedio reciente`, detalle: `Promedio de 4 semanas: ${fmt1(promedio)} km. Sube de a poco.`, porQue: 'salto_carga' });
  }
  return res;
}

export function proyectarSemana(datos: Datos, ahora = new Date()): Proyeccion {
  const actual = inicioSemana(ahora);
  const inicio = sumarDias(actual, 7);
  // La semana en curso cuenta como entrenada: la proyección asume que la completas.
  const decision = decidirTipo(datos, inicio, actual);
  const ctx = contextoSemana(datos, inicio, actual);
  const ctxActual = contextoSemana(datos, actual);
  const descarga = decision.tipo === 'descarga';

  const tipo: Ajuste = descarga
    ? {
        id: 'tipo',
        titulo: 'Semana de descarga',
        detalle:
          decision.motivo === 'estancamiento'
            ? `Se adelanta: ${listaTexto(decision.estancados)} llevan dos sesiones bajo su rango. Mismo peso, mitad de series, sin fallo y 60 % de los km.`
            : `Terminas ${SEMANAS_DE_CARGA} semanas de carga. Mismo peso, mitad de series, sin fallo y 60 % de los km.`,
        porQue: decision.motivo === 'estancamiento' ? 'cuando_descargar' : 'descarga',
      }
    : {
        id: 'tipo',
        titulo: `Semana de carga ${ctx.semanaDeCarga} de ${SEMANAS_DE_CARGA}`,
        detalle: ctx.semanaDeCarga === SEMANAS_DE_CARGA ? 'Después viene una semana de descarga.' : undefined,
        porQue: 'cuando_descargar',
      };

  const kcal = propuestaKcal(datos, ahora);
  const tests = pendientes(datos, aFechaLocal(inicio));
  const adherencia = ajusteAdherencia(datos, actual);

  const ajustes: Ajuste[] = [
    tipo,
    ...(descarga ? [] : ajustesCarga(datos)),
    ...(adherencia ? [adherencia] : []),
    ...(descarga ? [] : ajustesVolumen(datos)),
    ...ajustesDeRunning(datos, ctx, ctxActual, ahora),
    ...(kcal ? [{ id: 'kcal', titulo: kcal.texto, porQue: kcal.porQue, accion: kcal.deltaKcal ? ({ tipo: 'kcal', delta: kcal.deltaKcal } as Accion) : undefined }] : []),
    ...(tests.length ? [{ id: 'tests', titulo: `Toca registrar: ${listaTexto(tests)}`, porQue: 'benchmarks' }] : []),
  ];

  const bloques = listaBloques(datos)
    .filter((b) => b.veces > 0)
    .map((b) => (b.veces > 1 ? `${b.nombre} ×${b.veces}` : b.nombre))
    .join(', ');

  return { inicio, tipo: decision.tipo, sesiones: sesionesPlanificadas(datos), bloques, ajustes };
}

const cambiarPlantilla = (datos: Datos, id: string, f: (p: PlantillaGym) => PlantillaGym): Datos => ({
  ...datos,
  rutina: { ...datos.rutina, plantillas: datos.rutina.plantillas.map((p) => (p.id === id ? f(p) : p)) },
});

export function aplicarAccion(datos: Datos, accion: Accion, ahora = new Date()): Datos {
  switch (accion.tipo) {
    case 'series':
      return cambiarPlantilla(datos, accion.plantillaId, (p) => ({
        ...p,
        ejercicios: p.ejercicios.map((e) => (e.id === accion.ejercicioId ? { ...e, series: Math.max(1, e.series + accion.delta) } : e)),
      }));
    case 'agregar':
      return cambiarPlantilla(datos, accion.plantillaId, (p) =>
        p.ejercicios.some((e) => e.id === accion.catalogoId) ? p : { ...p, ejercicios: [...p.ejercicios, desdeCatalogo(accion.catalogoId, accion.series)] },
      );
    case 'veces': {
      const ref = accion.ref;
      if (ref.clase === 'gym') return cambiarPlantilla(datos, ref.plantillaId, (p) => ({ ...p, vecesPorSemana: Math.max(0, p.vecesPorSemana + accion.delta) }));
      return { ...datos, rutina: { ...datos.rutina, running: { ...datos.rutina.running, [ref.tipo]: Math.max(0, datos.rutina.running[ref.tipo] + accion.delta) } } };
    }
    case 'kcal':
      return aplicarKcal(datos, accion.delta, ahora);
  }
}
