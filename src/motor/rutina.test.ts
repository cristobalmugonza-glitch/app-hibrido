import { describe, expect, it } from 'vitest';
import type { EjercicioDef } from '../tipos/modelo';
import { conGym, datosPrueba, dia } from '../pruebas/fixtures';
import { iniciarGym } from './sesiones';
import {
  agregarEjercicio,
  aplicarRutinaEstandar,
  crearPlantilla,
  definicionPara,
  eliminarPlantilla,
  fijarVeces,
  guardarEjercicio,
  misEjercicios,
  moverEjercicio,
  quitarEjercicio,
} from './rutina';

const ejercicio = (d: ReturnType<typeof datosPrueba>, plantillaId: string, id: string) => d.rutina.plantillas.find((p) => p.id === plantillaId)!.ejercicios.find((e) => e.id === id);

describe('edición del plan', () => {
  it('agregar respeta la configuración que el ejercicio ya tiene en otra sesión', () => {
    let d = datosPrueba();
    d = guardarEjercicio(d, 'torso', { ...ejercicio(d, 'torso', 'c_curl_mancuernas')!, rangoReps: [8, 10] });
    const def = definicionPara(d, 'c_curl_mancuernas', 2)!;
    expect(def).toMatchObject({ rangoReps: [8, 10], series: 2 });
    d = agregarEjercicio(d, 'pierna', def);
    expect(agregarEjercicio(d, 'pierna', def)).toBe(d);
    expect(ejercicio(d, 'pierna', 'c_curl_mancuernas')?.series).toBe(2);
  });

  it('los cambios de definición se copian a las demás sesiones, pero no las series', () => {
    let d = datosPrueba();
    d = agregarEjercicio(d, 'pierna', definicionPara(d, 'c_curl_mancuernas', 2)!);
    d = guardarEjercicio(d, 'torso', { ...ejercicio(d, 'torso', 'c_curl_mancuernas')!, rangoReps: [6, 8], series: 4 });
    expect(ejercicio(d, 'torso', 'c_curl_mancuernas')).toMatchObject({ rangoReps: [6, 8], series: 4 });
    expect(ejercicio(d, 'pierna', 'c_curl_mancuernas')).toMatchObject({ rangoReps: [6, 8], series: 2 });
  });

  it('un ejercicio creado por ti queda en tu biblioteca', () => {
    const propio: EjercicioDef = { id: 'propio-1', nombre: 'Remo en anillas', tipo: 'calistenia_peso_corporal', modo: 'reps', rangoReps: [8, 12], series: 3, incrementoKg: 0, musculos: ['espalda'] };
    let d = guardarEjercicio(datosPrueba(), 'torso', propio);
    expect(d.ejerciciosPropios.map((e) => e.id)).toEqual(['propio-1']);
    d = quitarEjercicio(d, 'torso', 'propio-1');
    expect(ejercicio(d, 'torso', 'propio-1')).toBeUndefined();
    expect(misEjercicios(d).map((e) => e.nombre)).toEqual(['Remo en anillas']);
    expect(definicionPara(d, 'propio-1', 4)).toMatchObject({ nombre: 'Remo en anillas', series: 4 });
  });

  it('mover, crear, veces y eliminar', () => {
    let d = datosPrueba();
    const [a, b] = d.rutina.plantillas[0].ejercicios.map((e) => e.id);
    d = moverEjercicio(d, 'torso', 0, 1);
    expect(d.rutina.plantillas[0].ejercicios.slice(0, 2).map((e) => e.id)).toEqual([b, a]);
    expect(moverEjercicio(d, 'torso', 0, -1)).toEqual(d);

    const nueva = crearPlantilla(d, 'Brazos');
    d = nueva.datos;
    expect(d.rutina.plantillas.at(-1)).toMatchObject({ id: nueva.id, nombre: 'Brazos', vecesPorSemana: 1, ejercicios: [] });

    d = fijarVeces(d, { clase: 'gym', plantillaId: nueva.id }, 12);
    expect(d.rutina.plantillas.at(-1)!.vecesPorSemana).toBe(7);
    d = fijarVeces(d, { clase: 'running', tipo: 'fondo' }, -1);
    expect(d.rutina.running.fondo).toBe(0);

    d = conGym(d, 'pierna', dia(8));
    const sinPierna = eliminarPlantilla(d, 'pierna');
    expect(sinPierna.rutina.plantillas.some((p) => p.id === 'pierna')).toBe(false);
    expect(sinPierna.sesionesGym).toHaveLength(1);
  });

  it('no elimina una sesión que está en curso', () => {
    const d = iniciarGym(datosPrueba(), 'pierna', false);
    expect(eliminarPlantilla(d, 'pierna')).toBe(d);
  });

  it('cambiar a una rutina estándar conserva historial, running, tobillo y tus ejercicios', () => {
    let d = datosPrueba();
    d = guardarEjercicio(d, 'torso', { id: 'propio-2', nombre: 'Curl araña', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], series: 3, incrementoKg: 2, musculos: ['biceps'] });
    d = conGym(d, 'torso', dia(8));
    const nuevo = aplicarRutinaEstandar(d, 'empuje_tiron_piernas');
    expect(nuevo.rutina.plantillas.map((p) => p.id)).toEqual(['empuje', 'tiron', 'piernas']);
    expect(nuevo.rutina.running).toEqual({ z2: 1, calidad: 1, fondo: 1 });
    expect(nuevo.rutina.plantillas.flatMap((p) => p.ejercicios).some((e) => e.esProtocoloTobillo)).toBe(true);
    expect(nuevo.sesionesGym).toEqual(d.sesionesGym);
    expect(misEjercicios(nuevo).map((e) => e.id)).toContain('propio-2');
  });
});
