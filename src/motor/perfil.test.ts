import { describe, expect, it } from 'vitest';
import { RESPUESTAS } from '../pruebas/fixtures';
import { alturaCm, calcularObjetivos, crearDatos, distanciasRunning, factorActividad, fcMaxTanaka, reposoMifflin, validarDatosBasicos } from './perfil';

describe('estimaciones', () => {
  it('Mifflin-St Jeor', () => {
    expect(reposoMifflin('hombre', 80, 178, 21)).toBeCloseTo(1812.5, 5);
    expect(reposoMifflin('mujer', 60, 165, 30)).toBeCloseTo(1320.25, 5);
  });

  it('FC máxima de Tanaka: 208 − 0,7 × edad', () => {
    expect(fcMaxTanaka(21)).toBe(193);
    expect(fcMaxTanaka(40)).toBe(180);
  });

  it('factor de actividad según sesiones por semana', () => {
    expect([0, 3, 4, 7, 9].map(factorActividad)).toEqual([1.2, 1.375, 1.55, 1.725, 1.9]);
  });
});

describe('datos del primer paso', () => {
  const vacio = { edad: '', altura: '', peso: '', fcMax: '' };

  it('acepta la altura en metros o en centímetros, con punto o coma', () => {
    expect(alturaCm(1.78)).toBe(178);
    expect(alturaCm(178)).toBe(178);
    expect(validarDatosBasicos({ edad: '21', altura: '1.78', peso: '80.7', fcMax: '' }).valores).toEqual({ edad: 21, altura: 178, peso: 80.7, fcMax: null });
    expect(validarDatosBasicos({ edad: '21', altura: '1,78', peso: '80,7', fcMax: '199' }).valores).toEqual({ edad: 21, altura: 178, peso: 80.7, fcMax: 199 });
  });

  it('con campos vacíos no muestra errores, solo que faltan datos', () => {
    expect(validarDatosBasicos(vacio)).toEqual({ valores: null, errores: [], faltan: true });
  });

  it('explica qué corregir cuando un dato está fuera de rango', () => {
    const r = validarDatosBasicos({ edad: '210', altura: '17,8', peso: 'ochenta', fcMax: '90' });
    expect(r.valores).toBeNull();
    expect(r.errores).toEqual([
      'La edad debe estar entre 14 y 90 años.',
      'Escribe la altura en centímetros (178) o en metros (1,78).',
      'El peso debe estar entre 30 y 300 kg.',
      'La FC máxima debe estar entre 120 y 230 lpm, o déjala vacía.',
    ]);
  });
});

describe('objetivos iniciales', () => {
  const base = { sexo: 'hombre' as const, peso: 80, altura: 178, edad: 21, sesiones: 7 };

  it('perder grasa: −20 % con tope de 500 kcal y 2 g/kg de proteína', () => {
    expect(calcularObjetivos({ ...base, objetivo: 'perder_grasa' })).toEqual({ reposo: 1813, gasto: 3127, kcal: 2650, proteina: 160, grasa: 75, piso: 1800 });
  });

  it('ganar músculo: +10 % y 1,8 g/kg; mantener: gasto y 1,6 g/kg', () => {
    expect(calcularObjetivos({ ...base, objetivo: 'ganar_musculo' })).toMatchObject({ kcal: 3450, proteina: 145 });
    expect(calcularObjetivos({ ...base, objetivo: 'mantener' })).toMatchObject({ kcal: 3150, proteina: 130 });
  });

  it('nunca propone bajar del piso de seguridad', () => {
    const o = calcularObjetivos({ sexo: 'mujer', peso: 45, altura: 150, edad: 60, sesiones: 0, objetivo: 'perder_grasa' });
    expect(o.piso).toBe(1200);
    expect(o.kcal).toBe(1200);
  });

  it('la grasa no baja de 0,8 g/kg', () => {
    const o = calcularObjetivos({ ...base, peso: 120, objetivo: 'perder_grasa' });
    expect(o.grasa).toBeGreaterThanOrEqual(96);
  });

  it('distancias de running a partir de los km actuales', () => {
    expect(distanciasRunning(25)).toEqual({ z2Km: 6, fondoKmInicial: 9, topeFondoKm: 15, topeKmSemanal: 33 });
    expect(distanciasRunning(0)).toEqual({ z2Km: 4, fondoKmInicial: 5, topeFondoKm: 11, topeKmSemanal: 5 });
  });
});

describe('crearDatos', () => {
  const ahora = new Date(2026, 8, 10, 9);

  it('arma perfil, plan y primera semana', () => {
    const d = crearDatos(RESPUESTAS, ahora);
    expect(d.version).toBe(2);
    expect(d.perfil).toMatchObject({ fcMax: 199, fechaInicio: '2026-09-10', objetivo: 'perder_grasa', pesoInicial: 80 });
    expect(d.pesos).toHaveLength(1);
    expect(d.planes).toEqual([{ inicio: '2026-09-07', tipo: 'carga', sesiones: 7 }]);
    expect(d.rutina.plantillas.map((p) => p.id)).toEqual(['torso', 'pierna']);
  });

  it('estima la FC máxima si no se conoce', () => {
    expect(crearDatos({ ...RESPUESTAS, fcMax: null }, ahora).perfil.fcMax).toBe(193);
  });

  it('sin running, el plan no tiene salidas; la rutina híbrida siempre corre', () => {
    expect(crearDatos({ ...RESPUESTAS, rutina: 'cuerpo_completo', corre: false }, ahora).rutina.running).toEqual({ z2: 0, calidad: 0, fondo: 0 });
    expect(crearDatos({ ...RESPUESTAS, rutina: 'hibrido', corre: false }, ahora).rutina.running).toEqual({ z2: 1, calidad: 1, fondo: 1 });
  });
});
