import { describe, expect, it } from 'vitest';
import type { Molestia } from '../tipos/modelo';
import { carrera, conGym, datosPrueba, dia } from '../pruebas/fixtures';
import { ajustesRunning, alertas } from './alertas';

const AHORA = dia(16, 12);
const hace = (dias: number) => new Date(AHORA.getTime() - dias * 86_400_000);
const tobillo = (dias: number, intensidad: 1 | 2 | 3): Molestia => ({ fecha: hace(dias).toISOString(), zona: 'tobillo', intensidad });

describe('alertas', () => {
  it('datos recién creados: sin alertas', () => {
    expect(alertas(datosPrueba(), dia(9, 12))).toEqual([]);
  });

  it('tobillo ≥2 dos veces en 7 días: −20 % de running y alerta', () => {
    const d = { ...datosPrueba(), molestias: [tobillo(1, 2), tobillo(4, 2)] };
    expect(ajustesRunning(d, AHORA, false)).toEqual({ factor: 0.8, calidadAZ2: false });
    const a = alertas(d, AHORA).find((x) => x.id === 'tobillo2')!;
    expect(a.texto).toContain('equilibrio');
  });

  it('sin protocolo de tobillo en el plan, la alerta no pide equilibrio', () => {
    const d = { ...datosPrueba({ tobillo: false }), molestias: [tobillo(1, 2), tobillo(4, 2)] };
    expect(alertas(d, AHORA).find((x) => x.id === 'tobillo2')!.texto).not.toContain('equilibrio');
  });

  it('una sola molestia 2, o molestias viejas, no cambian nada', () => {
    const d = { ...datosPrueba(), molestias: [tobillo(1, 2), tobillo(9, 2)] };
    expect(ajustesRunning(d, AHORA, false)).toEqual({ factor: 1, calidadAZ2: false });
  });

  it('tobillo 3: la calidad pasa a Z2', () => {
    const d = { ...datosPrueba(), molestias: [tobillo(2, 3)] };
    expect(ajustesRunning(d, AHORA, false).calidadAZ2).toBe(true);
    expect(alertas(d, AHORA).map((a) => a.id)).toContain('tobillo3');
  });

  it('descarga y tobillo se combinan (0,6 × 0,8)', () => {
    const d = { ...datosPrueba(), molestias: [tobillo(1, 2), tobillo(2, 3)] };
    expect(ajustesRunning(d, AHORA, true).factor).toBeCloseTo(0.48, 5);
  });

  it('sobre el tope de km en 7 días: aviso', () => {
    const d = { ...datosPrueba(), sesionesRunning: [1, 3, 5].map((k) => carrera('z2', hace(k), 14)) };
    expect(alertas(d, AHORA).map((a) => a.id)).toContain('tope');
  });

  it('más de 10 días sin la sesión que tiene el protocolo de tobillo', () => {
    const d = datosPrueba();
    const a = alertas(d, dia(20, 12)).find((x) => x.id === 'protocolo')!;
    expect(a.texto).toContain('Pierna');
    expect(alertas(conGym(d, 'pierna', dia(18)), dia(20, 12)).map((x) => x.id)).not.toContain('protocolo');
    const sinPierna = { ...d, rutina: { ...d.rutina, plantillas: d.rutina.plantillas.map((p) => (p.id === 'pierna' ? { ...p, vecesPorSemana: 0 } : p)) } };
    expect(alertas(sinPierna, dia(20, 12)).map((x) => x.id)).not.toContain('protocolo');
  });
});
