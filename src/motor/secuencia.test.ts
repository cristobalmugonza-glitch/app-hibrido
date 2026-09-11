import { describe, expect, it } from 'vitest';
import { datosSemilla } from '../data/semilla';
import type { Datos } from '../tipos/modelo';
import { avanzar, completarPaso, contexto, nombrePaso, pasoActual, proximos, reiniciarCiclo, ultimaSesionHoy } from './secuencia';

const nombreActual = (d: Datos) => nombrePaso(pasoActual(d.rutina, d.cola)!, d.rutina);
const ORDEN = ['Piernas', 'Empuje', 'Running Z2', 'Tirón', 'Running calidad', 'Calistenia', 'Fondo largo', 'Libre'];

describe('motor de secuencia', () => {
  it('parte en Piernas, ciclo 1, vuelta 1, sin descarga', () => {
    const d = datosSemilla();
    expect(nombreActual(d)).toBe('Piernas');
    expect(contexto(d.cola)).toEqual({ ciclo: 1, vuelta: 1, descarga: false });
  });

  it('recorre los 8 pasos en orden y vuelve a Piernas sumando una vuelta', () => {
    let d = datosSemilla();
    const vistos: string[] = [];
    for (let k = 0; k < 8; k++) {
      vistos.push(nombreActual(d));
      d = completarPaso(d, 'hecha');
    }
    expect(vistos).toEqual(ORDEN);
    expect(nombreActual(d)).toBe('Piernas');
    expect(contexto(d.cola)).toEqual({ ciclo: 1, vuelta: 2, descarga: false });
  });

  it('saltar avanza igual que completar y queda registrado como saltada', () => {
    const d = completarPaso(datosSemilla(), 'saltada');
    expect(nombreActual(d)).toBe('Empuje');
    expect(d.historialCola).toHaveLength(1);
    expect(d.historialCola[0]).toMatchObject({ pasoId: 'paso_piernas', estado: 'saltada' });
  });

  it('los días reales entre sesiones no mueven la cola', () => {
    let d = datosSemilla();
    d = completarPaso(d, 'hecha', undefined, '2026-09-11T20:00:00.000Z');
    d = completarPaso(d, 'hecha', undefined, '2026-10-01T20:00:00.000Z'); // 20 días después
    expect(nombreActual(d)).toBe('Running Z2');
    expect(contexto(d.cola).vuelta).toBe(1);
  });

  it('permite dos sesiones el mismo día y avanza dos veces', () => {
    let d = datosSemilla();
    d = completarPaso(d, 'hecha', undefined, '2026-09-12T09:00:00.000Z');
    d = completarPaso(d, 'hecha', undefined, '2026-09-12T18:00:00.000Z');
    expect(nombreActual(d)).toBe('Running Z2');
    const ultima = ultimaSesionHoy(d, new Date('2026-09-12T19:00:00.000Z'));
    expect(ultima?.pasoId).toBe('paso_empuje');
    expect(ultima?.horas).toBeCloseTo(1, 5);
  });

  it('la vuelta 4 es descarga y la siguiente abre el ciclo 2', () => {
    expect(contexto({ posicion: 0, vueltasCompletadas: 3 })).toEqual({ ciclo: 1, vuelta: 4, descarga: true });
    expect(contexto({ posicion: 0, vueltasCompletadas: 4 })).toEqual({ ciclo: 2, vuelta: 1, descarga: false });
    expect(contexto({ posicion: 5, vueltasCompletadas: 7 })).toEqual({ ciclo: 2, vuelta: 4, descarga: true });
  });

  it('completar 32 pasos (4 vueltas de 8) lleva al ciclo 2', () => {
    let d = datosSemilla();
    for (let k = 0; k < 32; k++) d = completarPaso(d, k % 3 === 0 ? 'saltada' : 'hecha');
    expect(contexto(d.cola)).toEqual({ ciclo: 2, vuelta: 1, descarga: false });
    expect(nombreActual(d)).toBe('Piernas');
  });

  it('reiniciar vuelve a la vuelta 1 y al primer paso del ciclo actual', () => {
    expect(reiniciarCiclo({ posicion: 5, vueltasCompletadas: 6 })).toEqual({ posicion: 0, vueltasCompletadas: 4 });
  });

  it('una secuencia más corta no rompe la posición', () => {
    const d = datosSemilla();
    d.rutina.secuencia = d.rutina.secuencia.slice(0, 5);
    const cola = { posicion: 7, vueltasCompletadas: 0 };
    expect(pasoActual(d.rutina, cola)).toBeDefined();
    expect(avanzar(cola, 5)).toEqual({ posicion: 3, vueltasCompletadas: 0 });
    expect(avanzar({ posicion: 4, vueltasCompletadas: 0 }, 5)).toEqual({ posicion: 0, vueltasCompletadas: 1 });
  });

  it('una secuencia vacía no avanza ni revienta', () => {
    const d = datosSemilla();
    d.rutina.secuencia = [];
    expect(pasoActual(d.rutina, d.cola)).toBeUndefined();
    expect(completarPaso(d, 'hecha')).toBe(d);
  });

  it('muestra los próximos pasos sin repetir el actual', () => {
    const d = datosSemilla();
    expect(proximos(d.rutina, d.cola, 3).map((p) => nombrePaso(p, d.rutina))).toEqual(['Empuje', 'Running Z2', 'Tirón']);
    expect(proximos(d.rutina, { posicion: 7, vueltasCompletadas: 0 }, 2).map((p) => nombrePaso(p, d.rutina))).toEqual(['Piernas', 'Empuje']);
  });
});
