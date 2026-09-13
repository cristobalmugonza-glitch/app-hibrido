import { describe, expect, it } from 'vitest';
import type { Datos } from '../tipos/modelo';
import { carrera, datosPrueba } from '../pruebas/fixtures';
import { escalaCalidad, fcTest, fondoKm, prescribir, ritmoBase, saltoCarga, tipoCalidad, zonaDe, zonas } from './running';

const normal = { factor: 1, calidadAZ2: false };

function conDistancias(d: Datos, z2Km: number, fondoKmInicial: number): Datos {
  return { ...d, perfil: { ...d.perfil, z2Km, fondoKmInicial, topeFondoKm: 18 } };
}

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
});

describe('palancas de running', () => {
  it('la calidad rota sola por bloque: fartlek → 800 → 1000', () => {
    expect([1, 2, 3, 4, 5].map(tipoCalidad)).toEqual(['fartlek', '800', '1000', 'fartlek', '800']);
  });

  it('el fondo sube 1 km cada 2 bloques y respeta el tope', () => {
    const p = conDistancias(datosPrueba(), 8, 14).perfil;
    expect([1, 2, 3, 4, 5, 9, 12].map((m) => fondoKm(p, m))).toEqual([14, 14, 15, 15, 16, 18, 18]);
  });

  it('sin test usa el ritmo del perfil; con test usa el ritmo del test', () => {
    const d = datosPrueba();
    expect(ritmoBase(d)).toEqual({ segKm: 350, fuente: 'semilla' });
    const conTest = { ...d, sesionesRunning: [{ ...carrera('test', new Date()), duracionMin: 45 + 20 / 60 }] };
    expect(ritmoBase(conTest).fuente).toBe('test');
    expect(ritmoBase(conTest).segKm).toBeCloseTo(340, 5);
  });

  it('descarga: 60 % del volumen', () => {
    const d = conDistancias(datosPrueba(), 8, 14);
    expect(prescribir('z2', d, 1, normal).km).toBe(8);
    expect(prescribir('z2', d, 1, { factor: 0.6, calidadAZ2: false }).km).toBe(5);
    expect(prescribir('fondo', d, 1, { factor: 0.6, calidadAZ2: false }).km).toBe(8.5);
  });

  it('con poca base de km la calidad se acorta', () => {
    expect(escalaCalidad(conDistancias(datosPrueba(), 8, 14).perfil)).toBe(1);
    expect(escalaCalidad(conDistancias(datosPrueba(), 4, 5).perfil)).toBe(0.6);
    expect(prescribir('calidad', conDistancias(datosPrueba(), 8, 14), 1, normal).lineas[0].texto).toMatch(/^6 × 2 min/);
    expect(prescribir('calidad', conDistancias(datosPrueba(), 4, 5), 1, normal).lineas[0].texto).toMatch(/^4 × 2 min/);
  });

  it('tobillo en intensidad 3: la calidad pasa a Z2', () => {
    const p = prescribir('calidad', datosPrueba(), 2, { factor: 1, calidadAZ2: true });
    expect(p.etiqueta).toBe('Z2');
    expect(p.lineas[0].porQue).toBe('tobillo_alerta');
  });

  it('el equilibrio previo aparece solo si el plan tiene protocolo de tobillo', () => {
    for (const t of ['z2', 'calidad', 'fondo'] as const) {
      expect(prescribir(t, datosPrueba(), 1, normal).lineas.some((l) => l.porQue === 'tobillo_frecuencia')).toBe(true);
      expect(prescribir(t, datosPrueba({ tobillo: false }), 1, normal).lineas.some((l) => l.porQue === 'tobillo_frecuencia')).toBe(false);
    }
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
