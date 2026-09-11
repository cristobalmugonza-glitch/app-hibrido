import { describe, expect, it } from 'vitest';
import { datosSemilla } from '../data/semilla';
import type { Molestia } from '../tipos/modelo';
import { ajustesRunning, alertas } from './alertas';

const AHORA = new Date('2026-09-18T12:00:00.000Z');
const hace = (dias: number) => new Date(AHORA.getTime() - dias * 86_400_000).toISOString();
const tobillo = (dias: number, intensidad: 1 | 2 | 3): Molestia => ({ fecha: hace(dias), zona: 'tobillo_der', intensidad });
const ctx = { ciclo: 1, vuelta: 1, descarga: false };

describe('alertas', () => {
  it('semilla recién creada: sin alertas', () => {
    expect(alertas(datosSemilla(), AHORA)).toEqual([]);
  });

  it('tobillo ≥2 dos veces en 7 días: −20 % de running y alerta', () => {
    const d = datosSemilla();
    d.molestias = [tobillo(1, 2), tobillo(4, 2)];
    expect(ajustesRunning(d, AHORA, ctx)).toEqual({ factor: 0.8, calidadAZ2: false });
    expect(alertas(d, AHORA).map((a) => a.id)).toContain('tobillo2');
  });

  it('una sola molestia 2, o molestias viejas, no cambian nada', () => {
    const d = datosSemilla();
    d.molestias = [tobillo(1, 2), tobillo(9, 2)];
    expect(ajustesRunning(d, AHORA, ctx)).toEqual({ factor: 1, calidadAZ2: false });
  });

  it('tobillo 3: calidad pasa a Z2', () => {
    const d = datosSemilla();
    d.molestias = [tobillo(2, 3)];
    expect(ajustesRunning(d, AHORA, ctx).calidadAZ2).toBe(true);
    expect(alertas(d, AHORA).map((a) => a.id)).toContain('tobillo3');
  });

  it('descarga y tobillo se combinan (0,6 × 0,8)', () => {
    const d = datosSemilla();
    d.molestias = [tobillo(1, 2), tobillo(2, 3)];
    expect(ajustesRunning(d, AHORA, { ...ctx, vuelta: 4, descarga: true }).factor).toBeCloseTo(0.48, 5);
  });

  it('más de 38 km en 7 días: aviso de tope', () => {
    const d = datosSemilla();
    d.sesionesRunning = [1, 3, 5].map((k) => ({ id: String(k), fecha: hace(k), tipo: 'z2' as const, ciclo: 1, vuelta: 1, planificada: true, distanciaKm: 14, duracionMin: 80, fcPromedio: 140 }));
    expect(alertas(d, AHORA).map((a) => a.id)).toContain('tope');
  });

  it('más de 10 días sin la sesión que tiene el protocolo de tobillo', () => {
    const d = datosSemilla();
    const tarde = new Date('2026-09-25T12:00:00.000Z');
    expect(alertas(d, tarde).map((a) => a.id)).toContain('piernas');
  });
});
