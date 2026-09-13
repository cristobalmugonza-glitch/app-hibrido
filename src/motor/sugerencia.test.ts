import { describe, expect, it } from 'vitest';
import { conCarrera, conGym, datosPrueba, dia } from '../pruebas/fixtures';
import { estadoBloques, sesionDeHoy, sugerirBloque } from './sugerencia';

const AHORA = dia(10, 19); // jueves

const bloque = (d: ReturnType<typeof datosPrueba>, key: string) => estadoBloques(d, AHORA).find((e) => e.key === key)!;

describe('estado de los bloques', () => {
  it('semana nueva: todo pendiente y se sugiere lo que más falta', () => {
    const d = datosPrueba();
    const estados = estadoBloques(d, AHORA);
    expect(estados.map((e) => [e.key, e.pendientes])).toEqual([
      ['gym:torso', 2],
      ['gym:pierna', 2],
      ['run:z2', 1],
      ['run:calidad', 1],
      ['run:fondo', 1],
    ]);
    const s = sugerirBloque(estados);
    expect(s.tipo === 'bloque' && s.bloque.key).toBe('gym:torso');
  });

  it('un músculo cargado hace menos de 48 h bloquea la sugerencia de esa sesión', () => {
    const d = conGym(datosPrueba(), 'torso', dia(10, 8));
    expect(bloque(d, 'gym:torso').avisos[0].porQue).toBe('recuperacion');
    const s = sugerirBloque(estadoBloques(d, AHORA));
    expect(s.tipo === 'bloque' && s.bloque.key).toBe('gym:pierna');
  });

  it('pasadas 48 h el músculo ya no bloquea', () => {
    const d = conGym(datosPrueba(), 'torso', dia(8, 18));
    expect(bloque(d, 'gym:torso').avisos).toEqual([]);
  });

  it('piernas pesadas hace menos de 24 h: avisa en calidad y fondo, no en Z2', () => {
    const d = conGym(datosPrueba(), 'pierna', dia(10, 8));
    expect(bloque(d, 'run:calidad').avisos.map((a) => a.porQue)).toContain('piernas_impacto');
    expect(bloque(d, 'run:fondo').avisos.map((a) => a.porQue)).toContain('piernas_impacto');
    expect(bloque(d, 'run:z2').avisos).toEqual([]);
  });

  it('una carrera exigente reciente avisa en piernas y en la otra carrera exigente', () => {
    const d = conCarrera(datosPrueba(), 'calidad', dia(10, 7));
    expect(bloque(d, 'gym:pierna').avisos.map((a) => a.porQue)).toContain('piernas_impacto');
    expect(bloque(d, 'run:fondo').avisos.map((a) => a.porQue)).toContain('recuperacion');
    expect(bloque(d, 'gym:torso').avisos).toEqual([]);
  });

  it('semana completa y descanso', () => {
    let d = datosPrueba();
    d = conGym(conGym(d, 'torso', dia(7, 8)), 'torso', dia(8, 8));
    d = conCarrera(conCarrera(conCarrera(d, 'z2', dia(7, 7)), 'calidad', dia(8, 7)), 'fondo', dia(9, 7));
    d = conGym(d, 'pierna', dia(7, 18));
    d = conGym(d, 'pierna', dia(10, 8));
    expect(sugerirBloque(estadoBloques(d, AHORA)).tipo).toBe('completa');

    let e = datosPrueba();
    e = conGym(conGym(e, 'torso', dia(7, 8)), 'torso', dia(8, 8));
    e = conCarrera(conCarrera(conCarrera(e, 'z2', dia(7, 7)), 'calidad', dia(8, 7)), 'fondo', dia(9, 7));
    e = conGym(e, 'pierna', dia(10, 8)); // queda 1 pierna y las piernas están cargadas
    expect(sugerirBloque(estadoBloques(e, AHORA)).tipo).toBe('descanso');
  });

  it('sesionDeHoy entrega la más reciente del día', () => {
    let d = conGym(datosPrueba(), 'torso', dia(10, 7));
    d = conCarrera(d, 'z2', dia(10, 12));
    const hoy = sesionDeHoy(d, AHORA)!;
    expect(hoy).toMatchObject({ nombre: 'Running Z2', clase: 'running' });
    expect(hoy.horas).toBeCloseTo(7, 5);
    expect(sesionDeHoy(datosPrueba(), AHORA)).toBeNull();
  });
});
