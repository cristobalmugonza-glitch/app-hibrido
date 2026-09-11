import { describe, expect, it } from 'vitest';
import { datosSemilla } from '../data/semilla';
import type { SesionRunning } from '../tipos/modelo';
import { fondoKm, prescribir, ritmoBase, saltoCarga, tipoCalidad, zonas, zonaDe } from './running';

const ctx = (ciclo: number, descarga = false) => ({ ciclo, vuelta: descarga ? 4 : 1, descarga });
const normal = { factor: 1, calidadAZ2: false };

const carrera = (diasAtras: number, km: number, ahora: Date, extra: Partial<SesionRunning> = {}): SesionRunning => ({
  id: String(diasAtras),
  fecha: new Date(ahora.getTime() - diasAtras * 86_400_000).toISOString(),
  tipo: 'z2',
  ciclo: 1,
  vuelta: 1,
  planificada: true,
  distanciaKm: km,
  duracionMin: km * 5.8,
  fcPromedio: 140,
  ...extra,
});

describe('zonas de FC', () => {
  it('con FCmáx 199 reproduce las zonas del usuario', () => {
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
});

describe('palancas de running', () => {
  it('la calidad rota sola por ciclo: fartlek → 800 → 1000', () => {
    expect([1, 2, 3, 4, 5].map(tipoCalidad)).toEqual(['fartlek', '800', '1000', 'fartlek', '800']);
  });

  it('el fondo sube 1 km cada 2 ciclos y respeta el tope', () => {
    const p = datosSemilla().perfil;
    expect([1, 2, 3, 4, 5, 9, 12].map((c) => fondoKm(p, c))).toEqual([14, 14, 15, 15, 16, 18, 18]);
  });

  it('sin test usa el ritmo semilla (5:50); con test usa el ritmo del test', () => {
    const d = datosSemilla();
    expect(ritmoBase(d)).toEqual({ segKm: 350, fuente: 'semilla' });
    d.sesionesRunning.push(carrera(1, 8, new Date(), { tipo: 'test', duracionMin: 45 + 20 / 60, fcPromedio: 145 }));
    expect(ritmoBase(d).fuente).toBe('test');
    expect(ritmoBase(d).segKm).toBeCloseTo(340, 5);
  });

  it('descarga: 60 % del volumen', () => {
    const d = datosSemilla();
    expect(prescribir('z2', d, ctx(1), normal).km).toBe(8);
    expect(prescribir('z2', d, ctx(1, true), { factor: 0.6, calidadAZ2: false }).km).toBe(5);
    expect(prescribir('fondo', d, ctx(1, true), { factor: 0.6, calidadAZ2: false }).km).toBe(8.5);
  });

  it('tobillo en intensidad 3: la calidad pasa a Z2', () => {
    const p = prescribir('calidad', datosSemilla(), ctx(2), { factor: 1, calidadAZ2: true });
    expect(p.etiqueta).toBe('Z2');
    expect(p.lineas[0].porQue).toBe('tobillo_alerta');
  });

  it('toda carrera incluye el equilibrio previo', () => {
    const d = datosSemilla();
    for (const t of ['z2', 'calidad', 'fondo'] as const) {
      expect(prescribir(t, d, ctx(1), normal).lineas.some((l) => l.porQue === 'tobillo_frecuencia')).toBe(true);
    }
  });
});

describe('salto de carga', () => {
  const ahora = new Date('2026-11-01T12:00:00.000Z');
  it('sin historial suficiente no opina', () => {
    const d = datosSemilla();
    d.sesionesRunning = [carrera(1, 10, ahora), carrera(9, 8, ahora)];
    expect(saltoCarga(d, ahora)).toBeNull();
  });

  it('compara los últimos 7 días con el promedio de las 4 semanas previas', () => {
    const d = datosSemilla();
    const previas = [8, 10, 15, 22, 29].flatMap((dia) => [carrera(dia, 5, ahora), carrera(dia + 2, 5, ahora)]).filter((s) => new Date(s.fecha) > new Date(ahora.getTime() - 35 * 86_400_000));
    d.sesionesRunning = [...previas, carrera(1, 20, ahora), carrera(3, 20, ahora)];
    const s = saltoCarga(d, ahora)!;
    expect(s.km7).toBe(40);
    expect(s.pct).toBeGreaterThan(30);
  });
});
