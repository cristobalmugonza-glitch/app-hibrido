import { describe, expect, it } from 'vitest';
import type { Datos } from '../tipos/modelo';
import { RUTINAS_ESTANDAR } from '../data/catalogo';
import { conCarrera, conGym, datosPrueba, dia, semanaEntrenada } from '../pruebas/fixtures';
import { propuestaKcal } from './nutricion';
import { aplicarAccion, proyectarSemana } from './proyeccion';

const cambiarEjercicio = (d: Datos, plantillaId: string, ejercicioId: string, series: number): Datos => ({
  ...d,
  rutina: {
    ...d.rutina,
    plantillas: d.rutina.plantillas.map((p) => (p.id === plantillaId ? { ...p, ejercicios: p.ejercicios.map((e) => (e.id === ejercicioId ? { ...e, series } : e)) } : p)),
  },
});

const ajuste = (d: Datos, id: string, ahora = dia(16)) => proyectarSemana(d, ahora).ajustes.find((a) => a.id === id);

describe('proyección de la semana siguiente', () => {
  it('tras 2 semanas de carga más la actual, la siguiente es de descarga y no suma series', () => {
    let d = datosPrueba();
    d = semanaEntrenada(semanaEntrenada(d, 7), 14);
    const p = proyectarSemana(cambiarEjercicio(d, 'torso', 'c_laterales_polea', 1), dia(24));
    expect(p.inicio).toBe('2026-09-28');
    expect(p.tipo).toBe('descarga');
    expect(p.ajustes[0]).toMatchObject({ id: 'tipo', titulo: 'Semana de descarga', porQue: 'descarga' });
    expect(p.ajustes.some((a) => a.id.startsWith('vol-') || a.id.startsWith('carga-'))).toBe(false);
  });

  it('dice qué semana de carga viene', () => {
    const d = semanaEntrenada(datosPrueba(), 7);
    expect(proyectarSemana(d, dia(16)).ajustes[0].titulo).toBe('Semana de carga 3 de 3');
  });

  it('propone subir el peso donde llegaste al tope', () => {
    const d = conGym(datosPrueba(), 'torso', dia(8), 'tope');
    expect(ajuste(d, 'carga-sube')?.porQue).toBe('doble_progresion');
  });

  it('músculo bajo su rango: suma series de a poco y la acción las aplica', () => {
    const d = cambiarEjercicio(datosPrueba(), 'torso', 'c_laterales_polea', 1);
    const a = ajuste(d, 'vol-hombro_lateral')!;
    expect(a.accion).toEqual({ tipo: 'series', plantillaId: 'torso', ejercicioId: 'c_laterales_polea', delta: 1 });
    const aplicado = aplicarAccion(d, a.accion!);
    expect(aplicado.rutina.plantillas.find((p) => p.id === 'torso')!.ejercicios.find((e) => e.id === 'c_laterales_polea')!.series).toBe(2);
  });

  it('músculo sin ejercicio directo: agrega uno del catálogo en la sesión más liviana', () => {
    let d = datosPrueba();
    d = { ...d, rutina: { ...d.rutina, plantillas: d.rutina.plantillas.map((p) => ({ ...p, ejercicios: p.ejercicios.filter((e) => e.id !== 'c_crunch_polea') })) } };
    d = { ...d, rutina: { ...d.rutina, prioridades: { ...d.rutina.prioridades, abdomen: 'media' } } };
    const a = ajuste(d, 'vol-abdomen')!;
    expect(a.accion).toEqual({ tipo: 'agregar', plantillaId: 'pierna', catalogoId: 'c_crunch_polea', series: 3 });
    const aplicado = aplicarAccion(d, a.accion!);
    expect(aplicado.rutina.plantillas.find((p) => p.id === 'pierna')!.ejercicios.some((e) => e.id === 'c_crunch_polea')).toBe(true);
  });

  it('un músculo en mantención sin ninguna serie no genera avisos', () => {
    let d = datosPrueba();
    d = { ...d, rutina: { ...d.rutina, plantillas: d.rutina.plantillas.map((p) => ({ ...p, ejercicios: p.ejercicios.filter((e) => e.id !== 'c_crunch_polea') })) } };
    expect(d.rutina.prioridades.abdomen).toBe('mantencion');
    expect(ajuste(d, 'vol-abdomen')).toBeUndefined();
  });

  it('músculo sobre su rango: propone quitar series', () => {
    const d = cambiarEjercicio(datosPrueba(), 'torso', 'c_curl_mancuernas', 6);
    expect(ajuste(d, 'vol-biceps')?.accion).toEqual({ tipo: 'series', plantillaId: 'torso', ejercicioId: 'c_curl_mancuernas', delta: -1 });
  });

  it('las rutinas estándar no piden cambios de volumen', () => {
    for (const r of RUTINAS_ESTANDAR) {
      for (const tobillo of [true, false]) {
        const d = datosPrueba({ rutina: r.id }, undefined, tobillo);
        expect(proyectarSemana(d, dia(9)).ajustes.filter((a) => a.id.startsWith('vol-')), `${r.id} tobillo=${tobillo}`).toEqual([]);
      }
    }
  });

  it('dos semanas bajo el 70 % de lo planificado: propone sacar un bloque', () => {
    let d = datosPrueba();
    d = conGym(conGym(d, 'torso', dia(8)), 'pierna', dia(9));
    d = conGym(conGym(d, 'torso', dia(15)), 'pierna', dia(16));
    expect(ajuste(d, 'adherencia', dia(22))!.accion).toMatchObject({ tipo: 'veces', delta: -1 });
    // 4 de 7 (57 %) todavía está bajo el 70 %; con 5 de 7 (71 %) ya no.
    const cuatro = semanaEntrenada(semanaEntrenada(datosPrueba(), 7), 14);
    expect(ajuste(cuatro, 'adherencia', dia(22))).toBeDefined();
    expect(ajuste(conCarrera(conCarrera(cuatro, 'z2', dia(12)), 'z2', dia(19)), 'adherencia', dia(22))).toBeUndefined();
  });

  it('ajuste de calorías: la acción lo aplica y la calibración espera 2 semanas', () => {
    let d = datosPrueba({}, dia(1));
    d = { ...d, pesos: [0, 1, 2, 3].flatMap((i) => [1, 3, 5].map((k) => ({ fecha: new Date(dia(28, 12).getTime() - (i * 7 + k) * 86_400_000).toISOString(), peso: 80 }))) };
    const a = ajuste(d, 'kcal', dia(28, 12))!;
    expect(a.accion).toEqual({ tipo: 'kcal', delta: -150 });
    const aplicado = aplicarAccion(d, a.accion!, dia(28, 12));
    expect(aplicado.perfil.caloriasObjetivo).toBe(d.perfil.caloriasObjetivo - 150);
    expect(propuestaKcal(aplicado, dia(30, 12))).toBeNull();
  });

  it('running: resume los km de la semana y cómo progresan', () => {
    const d = conCarrera(conCarrera(conCarrera(datosPrueba(), 'z2', dia(14)), 'calidad', dia(15)), 'fondo', dia(16));
    const a = ajuste(d, 'running')!;
    expect(a.titulo).toMatch(/km en 3 salidas$/);
    expect(a.detalle).toContain('si completas');
    expect(a.porQue).toBe('progresion_running');
    expect(ajuste(datosPrueba({ corre: false }), 'running')).toBeUndefined();
  });

  it('en modo mantener sin sesión de calidad, propone sumarla', () => {
    let d = datosPrueba({ metaRunning: 'mantener' });
    d = { ...d, rutina: { ...d.rutina, running: { z2: 2, calidad: 0, fondo: 0 } } };
    expect(ajuste(d, 'running-mantener')?.accion).toEqual({ tipo: 'veces', ref: { clase: 'running', tipo: 'calidad' }, delta: 1 });
    expect(ajuste(datosPrueba({ metaRunning: 'mantener' }), 'running-mantener')).toBeUndefined();
  });

  it('recuerda los tests pendientes', () => {
    expect(ajuste(datosPrueba(), 'tests')?.titulo).toContain('medidas y foto');
  });
});
