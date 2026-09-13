import { describe, expect, it } from 'vitest';
import type { EjercicioDef, SesionGym } from '../tipos/modelo';
import { historialDe, redondearCarga, sugerir, type EntradaHistorial } from './progresion';

const press: EjercicioDef = { id: 'press', nombre: 'Press', tipo: 'compuesto_pesado', modo: 'carga', rangoReps: [6, 10], series: 3, incrementoKg: 2.5, musculos: ['pecho'], pesoInicial: 30 };

let dia = 1;
const sesion = (series: [number, number][], descarga = false): EntradaHistorial => ({
  fecha: `2026-09-${String(dia++).padStart(2, '0')}T20:00:00.000Z`,
  descarga,
  series: series.map(([peso, reps]) => ({ peso, reps })),
});

describe('doble progresión', () => {
  it('primera vez sin peso conocido: no sugiere peso', () => {
    const s = sugerir({ ...press, pesoInicial: undefined }, [], false);
    expect(s.motivo).toBe('primera_vez');
    expect(s.peso).toBeNull();
    expect(s.porQue).toBe('primera_vez');
  });

  it('con peso semilla y sin historial: parte en ese peso apuntando al mínimo', () => {
    const s = sugerir(press, [], false);
    expect(s).toMatchObject({ motivo: 'inicio', peso: 30, reps: [6, 6, 6], series: 3 });
  });

  it('todas las series en el tope: sube el incremento y vuelve al mínimo', () => {
    const s = sugerir(press, [sesion([[30, 10], [30, 10], [30, 10]])], false);
    expect(s).toMatchObject({ motivo: 'subir', peso: 32.5, reps: [6, 6, 6] });
  });

  it('tope en menos series que las objetivo: no sube', () => {
    const s = sugerir(press, [sesion([[30, 10], [30, 10]])], false);
    expect(s.motivo).toBe('mantener');
    expect(s.peso).toBe(30);
  });

  it('dentro del rango: mismo peso y una rep más por serie, sin pasar el tope', () => {
    const s = sugerir(press, [sesion([[30, 10], [30, 8], [30, 7]])], false);
    expect(s).toMatchObject({ motivo: 'mantener', peso: 30, reps: [10, 9, 8] });
  });

  it('una sola sesión bajo el piso: mantiene y apunta al mínimo', () => {
    const s = sugerir(press, [sesion([[30, 5], [30, 4], [30, 4]])], false);
    expect(s.motivo).toBe('mantener');
    expect(s.reps).toEqual([6, 6, 6]);
  });

  it('dos sesiones seguidas bajo el piso: baja ~10 % y reconstruye', () => {
    const s = sugerir(press, [sesion([[30, 5], [30, 5], [30, 4]]), sesion([[30, 5], [30, 4], [30, 4]])], false);
    expect(s.motivo).toBe('bajar');
    expect(s.peso).toBe(27.5);
    expect(s.porQue).toBe('bajar_10');
  });

  it('descarga: mismo peso, mitad de series (redondeo hacia arriba), sin subir', () => {
    const s = sugerir(press, [sesion([[30, 10], [30, 10], [30, 10]])], true);
    expect(s).toMatchObject({ motivo: 'descarga', peso: 30, series: 2, reps: [6, 6] });
  });

  it('después de la descarga decide con la última sesión normal', () => {
    const s = sugerir(press, [sesion([[30, 10], [30, 10], [30, 10]]), sesion([[30, 6], [30, 6]], true)], false);
    expect(s).toMatchObject({ motivo: 'subir', peso: 32.5 });
  });

  it('usa el peso de trabajo (el más alto) e ignora las series de aproximación', () => {
    const s = sugerir(press, [sesion([[20, 10], [30, 10], [30, 10], [30, 10]])], false);
    expect(s).toMatchObject({ motivo: 'subir', peso: 32.5 });
  });

  it('avisa cuando el salto supera el 10 % de la carga', () => {
    const rompe: EjercicioDef = { ...press, id: 'r', tipo: 'aislamiento', rangoReps: [10, 15], incrementoKg: 2, pesoInicial: 12 };
    const s = sugerir(rompe, [sesion([[12, 15], [12, 15], [12, 15]])], false);
    expect(s.peso).toBe(14);
    expect(s.saltoPct).toBeCloseTo(16.7, 1);
  });

  it('calistenia sin lastre en el tope: propone lastre o variante', () => {
    const dom: EjercicioDef = { ...press, id: 'd', tipo: 'calistenia_peso_corporal', rangoReps: [8, 12], pesoInicial: 0 };
    const s = sugerir(dom, [sesion([[0, 12], [0, 12], [0, 12]])], false);
    expect(s.peso).toBe(2.5);
    expect(s.texto).toContain('lastre');
  });

  it('el texto de lastre es solo para calistenia', () => {
    const maquina: EjercicioDef = { ...press, id: 'm', tipo: 'aislamiento', rangoReps: [10, 15], pesoInicial: undefined };
    const s = sugerir(maquina, [sesion([[0, 15], [0, 15], [0, 15]])], false);
    expect(s.texto).not.toContain('lastre');
  });

  it('equilibrio (segundos) en el tope: propone subir la dificultad, no peso', () => {
    const eq: EjercicioDef = { ...press, id: 'e', tipo: 'aislamiento', modo: 'tiempo', rangoReps: [30, 45], incrementoKg: 0 };
    const s = sugerir(eq, [sesion([[0, 45], [0, 45], [0, 45]])], false);
    expect(s.motivo).toBe('variante');
    expect(s.peso).toBeNull();
  });

  it('funciona igual para un ejercicio nuevo que agregue cualquier usuario', () => {
    const nuevo: EjercicioDef = { id: 'hip-thrust', nombre: 'Hip thrust', tipo: 'compuesto_liviano', modo: 'carga', rangoReps: [8, 12], series: 4, incrementoKg: 5, musculos: ['isquios_gluteos'] };
    expect(sugerir(nuevo, [], false).motivo).toBe('primera_vez');
    const s = sugerir(nuevo, [sesion([[60, 12], [60, 12], [60, 12], [60, 12]])], false);
    expect(s).toMatchObject({ motivo: 'subir', peso: 65, reps: [8, 8, 8, 8] });
  });

  it('historialDe ordena por fecha y omite sesiones sin series del ejercicio', () => {
    const base = { plantillaId: 'p', nombre: 'P', descarga: false };
    const sesiones: SesionGym[] = [
      { ...base, id: 'b', fecha: '2026-09-20T20:00:00.000Z', ejercicios: [{ ejercicioId: 'press', nombre: 'Press', series: [{ peso: 32.5, reps: 6 }] }] },
      { ...base, id: 'a', fecha: '2026-09-10T20:00:00.000Z', ejercicios: [{ ejercicioId: 'press', nombre: 'Press', series: [{ peso: 30, reps: 8 }] }] },
      { ...base, id: 'c', fecha: '2026-09-25T20:00:00.000Z', ejercicios: [{ ejercicioId: 'otro', nombre: 'Otro', series: [{ peso: 10, reps: 10 }] }] },
    ];
    expect(historialDe('press', sesiones).map((h) => h.series[0].peso)).toEqual([30, 32.5]);
  });

  it('redondea la carga a medio incremento', () => {
    expect(redondearCarga(24.75, 2.5)).toBe(25);
    expect(redondearCarga(54, 5)).toBe(55);
    expect(redondearCarga(10.8, 2)).toBe(11);
  });
});
