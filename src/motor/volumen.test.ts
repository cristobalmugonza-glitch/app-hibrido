import { describe, expect, it } from 'vitest';
import { datosPrueba, dia, sesionGym } from '../pruebas/fixtures';
import { analisisVolumen, definiciones, seriesHechas, seriesPlanificadas, seriesPorSesion } from './volumen';

describe('series por músculo (conteo fraccionado)', () => {
  const d = datosPrueba();
  const torso = d.rutina.plantillas.find((p) => p.id === 'torso')!;

  it('por sesión: 1 al principal, 0,5 a cada secundario', () => {
    const s = seriesPorSesion(torso);
    expect(s.pecho).toBe(5);
    expect(s.espalda).toBe(6);
    expect(s.biceps).toBe(5);
    expect(s.hombro_posterior).toBe(3.5);
  });

  it('por semana multiplica por las veces planificadas; en descarga cuenta la mitad de las series', () => {
    const plan = seriesPlanificadas(d.rutina);
    expect(plan.pecho).toBe(10);
    expect(plan.cuadriceps).toBe(10);
    expect(seriesPlanificadas(d.rutina, true).pecho).toBe(6); // ceil(3/2) + ceil(2/2) = 3 por sesión × 2
  });

  it('las series hechas usan la copia de músculos guardada con la sesión', () => {
    const s = sesionGym(d, 'torso', dia(8));
    s.ejercicios[0] = { ...s.ejercicios[0], musculos: ['biceps'], secundarios: undefined };
    const hechas = seriesHechas([s], definiciones(d));
    expect(hechas.pecho).toBe(2);
    expect(hechas.biceps).toBe(8);
  });

  it('sin copia, usa la definición actual del ejercicio', () => {
    const s = sesionGym(d, 'torso', dia(8));
    s.ejercicios = s.ejercicios.map(({ musculos: _, secundarios: __, ...e }) => e);
    expect(seriesHechas([s], definiciones(d)).pecho).toBe(5);
  });

  it('la rutina torso/pierna queda dentro del rango de cada prioridad', () => {
    expect(analisisVolumen(d.rutina).filter((f) => f.estado !== 'ok')).toEqual([]);
  });
});
