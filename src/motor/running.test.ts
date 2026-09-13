import { describe, expect, it } from 'vitest';
import type { Datos, Molestia } from '../tipos/modelo';
import { carrera, conCarrera, datosPrueba, dia } from '../pruebas/fixtures';
import { fijarTipoSemana } from './planificacion';
import { fcTest, objetivoKm, planRunning, prescribir, promedioReal, repartirKm, ritmoBase, saltoCarga, textoObjetivoKm, tipoCalidad, zonaDe, zonas } from './running';

const S1 = '2026-09-07';
const S2 = '2026-09-14';
const S3 = '2026-09-21';
const S4 = '2026-09-28';
const normal = { factor: 1, calidadAZ2: false };
const etapa = (semanaDeCarga = 1, descarga = false, mesociclo = 1) => ({ mesociclo, semanaDeCarga, descarga });

const correr = (d: Datos, dias: number[], km: number[]) => dias.reduce((acc, di, i) => conCarrera(acc, 'z2', dia(di), km[i]), d);

describe('zonas de FC', () => {
  it('con FCmáx 199 da 119/129/149/163/177', () => {
    expect(zonas(199).map((z) => [z.desde, z.hasta])).toEqual([
      [119, 129],
      [129, 149],
      [149, 163],
      [163, 177],
      [177, 199],
    ]);
    expect(zonaDe(140, 199)).toBe('Z2');
    expect(zonaDe(170, 199)).toBe('Z4');
  });

  it('el test se corre 4 lpm bajo el tope de la Z2', () => {
    expect(fcTest(199)).toBe(145);
    expect(fcTest(185)).toBe(135);
  });

  it('sin test usa el ritmo del perfil; con test usa el ritmo del test', () => {
    const d = datosPrueba();
    expect(ritmoBase(d)).toEqual({ segKm: 350, fuente: 'semilla' });
    const conTest = { ...d, sesionesRunning: [{ ...carrera('test', new Date()), duracionMin: 45 + 20 / 60 }] };
    expect(ritmoBase(conTest).fuente).toBe('test');
    expect(ritmoBase(conTest).segKm).toBeCloseTo(340, 5);
  });

  it('la calidad rota sola por bloque: fartlek → 800 → 1000', () => {
    expect([1, 2, 3, 4, 5].map(tipoCalidad)).toEqual(['fartlek', '800', '1000', 'fartlek', '800']);
  });
});

describe('km de la semana (progresión)', () => {
  it('la primera semana parte en tus km base', () => {
    expect(objetivoKm(datosPrueba(), S1, dia(9))).toEqual({ km: 22, motivo: 'base' });
  });

  it('sube 8 % si cumpliste el 80 % de tu última semana de carga', () => {
    const d = correr(datosPrueba(), [8, 10, 12], [6, 6, 6]);
    const o = objetivoKm(d, S2, dia(16));
    expect(o).toMatchObject({ km: 24, motivo: 'sube', anterior: 22, hechos: 18 });
    expect(textoObjetivoKm(o)).toBe('Sube a 24 km (+8 %): cumpliste 18 de 22 km en tu última semana de carga.');
  });

  it('la primera semana a medias se repite en vez de bajar', () => {
    expect(objetivoKm(correr(datosPrueba(), [11], [5]), S2, dia(16))).toMatchObject({ km: 22, motivo: 'repite' });
  });

  it('entre 50 y 80 % se repite; bajo 50 % baja 10 %', () => {
    const base = correr(datosPrueba(), [8, 10, 12], [6, 6, 6]); // semana 2: 24 km
    expect(objetivoKm(correr(base, [15, 17], [7, 7]), S3, dia(23))).toMatchObject({ km: 24, motivo: 'repite', hechos: 14 });
    expect(objetivoKm(correr(base, [15], [5]), S3, dia(23))).toMatchObject({ km: 22, motivo: 'baja' });
  });

  it('sin correr varias semanas baja de a poco, pero no de 2/3 de la base', () => {
    const base = correr(datosPrueba(), [8, 10, 12], [6, 6, 6]);
    expect(objetivoKm(base, '2026-10-19', dia(49)).km).toBe(15);
  });

  it('en descarga corres el 60 % de tu última semana de carga, y después se retoma', () => {
    let d = correr(datosPrueba(), [8, 10, 12], [6, 6, 6]);
    d = correr(d, [15, 17, 19], [7, 7, 7]); // 21 de 24
    d = fijarTipoSemana(d, S3, 'descarga');
    expect(objetivoKm(d, S3, dia(23))).toMatchObject({ km: 14, motivo: 'descarga' });
    expect(objetivoKm(d, S4, dia(30))).toMatchObject({ km: 26, motivo: 'sube', anterior: 24, hechos: 21 });
  });

  it('no pasa tu tope semanal', () => {
    const d = correr(datosPrueba(), [8, 10, 12], [6, 6, 6]);
    expect(objetivoKm({ ...d, perfil: { ...d.perfil, topeKmSemanal: 23 } }, S2, dia(16))).toMatchObject({ km: 23, motivo: 'tope' });
  });

  it('en modo mantener los km quedan fijos', () => {
    const d = correr(datosPrueba({ metaRunning: 'mantener' }), [8, 10, 12], [9, 9, 9]);
    expect(objetivoKm(d, S2, dia(16))).toEqual({ km: 22, motivo: 'mantener' });
  });

  it('con molestias de corredor en la semana anterior, no sube', () => {
    const m = (di: number): Molestia => ({ fecha: dia(di).toISOString(), zona: 'rodilla', intensidad: 2 });
    const d = { ...correr(datosPrueba(), [8, 10, 12], [6, 6, 6]), molestias: [m(9), m(11)] };
    expect(objetivoKm(d, S2, dia(16))).toMatchObject({ km: 22, motivo: 'molestias' });
  });

  it('al proyectar la semana siguiente asume que completas la actual', () => {
    const d = correr(datosPrueba(), [8, 10, 12], [6, 6, 6]);
    const o = objetivoKm(d, S3, dia(16));
    expect(o).toMatchObject({ km: 26, motivo: 'sube', anterior: 24, supone: true });
    expect(textoObjetivoKm(o)).toBe('Sube a 26 km (+8 %) si completas los 24 km de esta semana.');
  });

  it('sin salidas de running en el plan, no hay km', () => {
    expect(objetivoKm(datosPrueba({ corre: false }), S1, dia(9))).toEqual({ km: 0, motivo: 'sin_running' });
  });
});

describe('reparto de los km en las salidas', () => {
  const d = datosPrueba();

  it('3 salidas y 30 km: fondo 45 %, calidad según repeticiones y el resto en Z2', () => {
    expect(repartirKm(d, 30, etapa())).toEqual({ z2: 9, calidad: 7.5, fondo: 13.5, repeticiones: 5, total: 30 });
  });

  it('la calidad suma una repetición por semana de carga y resta una en descarga', () => {
    expect(repartirKm(d, 30, etapa(3)).repeticiones).toBe(7);
    expect(repartirKm(d, 30, etapa(1, true)).repeticiones).toBe(4);
    expect(repartirKm(d, 30, etapa(1, false, 2)).repeticiones).toBe(4); // bloque de 800 m
  });

  it('con poco volumen la calidad se acorta, y el fondo respeta su tope', () => {
    expect(repartirKm(d, 12, etapa())).toEqual({ z2: 3, calidad: 6, fondo: 5.5, repeticiones: 3, total: 14.5 });
    expect(repartirKm({ ...d, perfil: { ...d.perfil, topeFondoKm: 10 } }, 30, etapa()).fondo).toBe(10);
  });

  it('planRunning junta el objetivo y el reparto de la semana', () => {
    const p = planRunning(d, S1, dia(9));
    expect(p.objetivo.km).toBe(22);
    expect(p.reparto).toEqual({ z2: 5.5, calidad: 6.5, fondo: 10, repeticiones: 4, total: 22 });
  });
});

describe('prescripción de cada salida', () => {
  const d = datosPrueba();
  const plan = { ...planRunning(d, S1, dia(9)), reparto: repartirKm(d, 30, etapa()) };

  it('Z2 y fondo toman sus km del reparto; con molestias de tobillo bajan 20 %', () => {
    expect(prescribir('z2', d, plan, normal).km).toBe(9);
    expect(prescribir('z2', d, plan, { factor: 0.8, calidadAZ2: false }).km).toBe(7);
    expect(prescribir('fondo', d, plan, normal)).toMatchObject({ km: 13.5, etiqueta: 'Fondo' });
  });

  it('la calidad usa sus repeticiones', () => {
    expect(prescribir('calidad', d, plan, normal).lineas[0].texto).toMatch(/^5 × 2 min/);
    expect(prescribir('calidad', d, plan, { factor: 0.8, calidadAZ2: false }).lineas[0].texto).toMatch(/^4 × 2 min/);
  });

  it('tobillo en intensidad 3: la calidad pasa a Z2', () => {
    const p = prescribir('calidad', d, plan, { factor: 1, calidadAZ2: true });
    expect(p.etiqueta).toBe('Z2');
    expect(p.lineas[0].porQue).toBe('tobillo_alerta');
  });

  it('el equilibrio previo aparece solo si el plan tiene protocolo de tobillo', () => {
    const sin = datosPrueba({}, undefined, false);
    for (const t of ['z2', 'calidad', 'fondo'] as const) {
      expect(prescribir(t, d, plan, normal).lineas.some((l) => l.porQue === 'tobillo_frecuencia')).toBe(true);
      expect(prescribir(t, sin, plan, normal).lineas.some((l) => l.porQue === 'tobillo_frecuencia')).toBe(false);
    }
  });
});

describe('km reales', () => {
  it('promedio de 4 semanas cuando ya hay 3 semanas de historial', () => {
    const ahora = dia(30, 12);
    const d = { ...datosPrueba(), sesionesRunning: [carrera('z2', dia(29), 10), carrera('z2', dia(15), 10), carrera('z2', dia(8), 20)] };
    expect(promedioReal(d, ahora)).toBe(10);
    expect(promedioReal({ ...d, sesionesRunning: [carrera('z2', dia(29), 10)] }, ahora)).toBeNull();
  });
});

describe('salto de carga', () => {
  const ahora = new Date('2026-11-01T12:00:00.000Z');
  const hace = (dias: number, km: number) => carrera('z2', new Date(ahora.getTime() - dias * 86_400_000), km);

  it('sin historial suficiente no opina', () => {
    expect(saltoCarga({ ...datosPrueba(), sesionesRunning: [hace(1, 10), hace(9, 8)] }, ahora)).toBeNull();
  });

  it('compara los últimos 7 días con el promedio de las 4 semanas previas', () => {
    const previas = [8, 10, 15, 22, 29].flatMap((d) => [hace(d, 5), hace(d + 2, 5)]).filter((s) => new Date(s.fecha) > new Date(ahora.getTime() - 35 * 86_400_000));
    const s = saltoCarga({ ...datosPrueba(), sesionesRunning: [...previas, hace(1, 20), hace(3, 20)] }, ahora)!;
    expect(s.km7).toBe(40);
    expect(s.pct).toBeGreaterThan(30);
  });
});
