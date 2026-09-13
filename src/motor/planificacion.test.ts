import { describe, expect, it } from 'vitest';
import { conCarrera, conGym, datosPrueba, dia, semanaEntrenada } from '../pruebas/fixtures';
import {
  asegurarPlanSemana,
  cargasSeguidas,
  contextoSemana,
  decidirTipo,
  fijarTipoSemana,
  hechasEnSemana,
  mesociclo,
  semanaEntrenada as esSemanaEntrenada,
  sesionesPlanificadas,
  tipoSemana,
  totalSesiones,
} from './planificacion';
import { inicioSemana, rangoSemana, sumarDias } from './semanas';

describe('semanas de lunes a domingo', () => {
  it('el domingo pertenece a la semana que empezó el lunes anterior', () => {
    expect(inicioSemana(dia(13, 23))).toBe('2026-09-07');
    expect(inicioSemana(dia(14, 0))).toBe('2026-09-14');
    expect(inicioSemana('2026-09-13')).toBe('2026-09-07');
  });

  it('suma días cruzando meses y arma el rango', () => {
    expect(sumarDias('2026-09-28', 7)).toBe('2026-10-05');
    expect(rangoSemana('2026-09-07')).toMatch(/^7–13 /);
    expect(rangoSemana('2026-09-28')).toMatch(/^28 .+–4 /);
  });
});

describe('conteo semanal', () => {
  it('cuenta cada bloque en su semana y el test como Z2', () => {
    let d = datosPrueba();
    d = conGym(d, 'torso', dia(8));
    d = conGym(d, 'pierna', dia(9));
    d = conCarrera(d, 'test', dia(10));
    d = conGym(d, 'torso', dia(14)); // semana siguiente
    const semana = hechasEnSemana(d, '2026-09-07');
    expect(semana.get('gym:torso')).toBe(1);
    expect(semana.get('gym:pierna')).toBe(1);
    expect(semana.get('run:z2')).toBe(1);
    expect(totalSesiones(d, '2026-09-07')).toBe(3);
    expect(totalSesiones(d, '2026-09-14')).toBe(1);
  });

  it('torso/pierna con running planifica 7 sesiones y una semana cuenta como entrenada desde la mitad', () => {
    let d = datosPrueba();
    expect(sesionesPlanificadas(d)).toBe(7);
    d = conGym(conGym(conGym(d, 'torso', dia(8)), 'pierna', dia(9)), 'torso', dia(10));
    expect(esSemanaEntrenada(d, '2026-09-07')).toBe(false);
    d = conGym(d, 'pierna', dia(11));
    expect(esSemanaEntrenada(d, '2026-09-07')).toBe(true);
  });
});

describe('tipo de semana', () => {
  it('después de 3 semanas de carga toca descarga', () => {
    let d = datosPrueba();
    for (const lunes of [7, 14, 21]) d = semanaEntrenada(d, lunes);
    expect(cargasSeguidas(d, '2026-09-28')).toBe(3);
    expect(decidirTipo(d, '2026-09-28')).toMatchObject({ tipo: 'descarga', motivo: 'bloque' });
  });

  it('una semana casi sin entrenar reinicia el bloque', () => {
    let d = datosPrueba();
    d = semanaEntrenada(d, 7);
    d = conGym(d, 'torso', dia(15));
    d = semanaEntrenada(d, 21);
    expect(decidirTipo(d, '2026-09-28')).toMatchObject({ tipo: 'carga', cargasPrevias: 1 });
    expect(contextoSemana(d, '2026-09-28').semanaDeCarga).toBe(2);
  });

  it('la semana en curso cuenta como entrenada al proyectar', () => {
    let d = datosPrueba();
    d = semanaEntrenada(semanaEntrenada(d, 7), 14);
    expect(decidirTipo(d, '2026-09-28').tipo).toBe('carga');
    expect(decidirTipo(d, '2026-09-28', '2026-09-21').tipo).toBe('descarga');
  });

  it('el cambio manual manda y reinicia el conteo', () => {
    let d = datosPrueba();
    for (const lunes of [7, 14, 21]) d = semanaEntrenada(d, lunes);
    d = fijarTipoSemana(d, '2026-09-21', 'descarga');
    expect(tipoSemana(d, '2026-09-21')).toBe('descarga');
    expect(decidirTipo(d, '2026-09-28')).toMatchObject({ tipo: 'carga', cargasPrevias: 0 });
  });

  it('se adelanta la descarga si 2 ejercicios o más se estancan tras 2 semanas de carga', () => {
    let d = datosPrueba();
    d = semanaEntrenada(semanaEntrenada(d, 7, 'bajo'), 14, 'bajo');
    const decision = decidirTipo(d, '2026-09-21');
    expect(decision.tipo).toBe('descarga');
    expect(decision.motivo).toBe('estancamiento');
    expect(decision.estancados.length).toBeGreaterThanOrEqual(2);
  });

  it('el bloque (mesociclo) sube después de cada descarga', () => {
    let d = datosPrueba();
    for (const lunes of [7, 14, 21]) d = semanaEntrenada(d, lunes);
    d = fijarTipoSemana(d, '2026-09-28', 'descarga');
    expect(mesociclo(d, '2026-09-28')).toBe(1);
    expect(mesociclo(d, '2026-10-05')).toBe(2);
  });

  it('asegurarPlanSemana fija la semana una sola vez', () => {
    const d = datosPrueba();
    expect(d.planes).toEqual([{ inicio: '2026-09-07', tipo: 'carga', sesiones: 7 }]);
    expect(asegurarPlanSemana(d, dia(10))).toBe(d);
    const siguiente = asegurarPlanSemana(d, dia(15));
    expect(siguiente.planes.map((p) => p.inicio)).toEqual(['2026-09-07', '2026-09-14']);
  });
});
