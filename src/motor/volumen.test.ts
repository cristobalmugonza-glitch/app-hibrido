import { describe, expect, it } from 'vitest';
import { datosSemilla } from '../data/semilla';
import { analisisVolumen, seriesPorVuelta } from './volumen';

describe('series por músculo (conteo fraccionado)', () => {
  it('la rutina semilla queda dentro del rango de cada prioridad', () => {
    const r = datosSemilla().rutina;
    expect(seriesPorVuelta(r)).toEqual({
      pecho: 14,
      espalda: 15,
      hombro_lateral: 12,
      hombro_posterior: 8.5,
      biceps: 14,
      triceps: 14,
      cuadriceps: 9,
      isquios_gluteos: 9,
      gemelos: 5,
    });
    expect(analisisVolumen(r).filter((f) => f.estado !== 'ok')).toEqual([]);
  });

  it('una plantilla que aparece dos veces en la secuencia cuenta dos veces', () => {
    const r = datosSemilla().rutina;
    r.secuencia.push({ id: 'extra', clase: 'gym', plantillaId: 'empuje' });
    expect(seriesPorVuelta(r).hombro_lateral).toBe(16);
  });
});
