import { describe, expect, it } from 'vitest';
import { CATALOGO, CATALOGO_POR_ID, construirRutina, desdeCatalogo, RUTINAS_ESTANDAR } from './catalogo';
import { MUSCULOS } from './reglas-tipo';
import { contarSesiones } from '../motor/planificacion';
import { analisisVolumen } from '../motor/volumen';

describe('catálogo de ejercicios', () => {
  it('ids únicos con prefijo c_', () => {
    expect(new Set(CATALOGO.map((e) => e.id)).size).toBe(CATALOGO.length);
    for (const e of CATALOGO) expect(e.id, e.id).toMatch(/^c_[a-z0-9_]+$/);
  });

  it('cada ejercicio es coherente', () => {
    for (const e of CATALOGO) {
      expect(e.rangoReps[0], e.id).toBeGreaterThan(0);
      expect(e.rangoReps[0], e.id).toBeLessThanOrEqual(e.rangoReps[1]);
      for (const m of [...e.musculos, ...(e.secundarios ?? [])]) expect(MUSCULOS, e.id).toContain(m);
      for (const m of e.secundarios ?? []) expect(e.musculos, e.id).not.toContain(m);
      if (e.modo !== 'carga') expect(e.incrementoKg, e.id).toBe(0);
      expect(e.musculos.length + (e.secundarios?.length ?? 0) > 0 || e.esProtocoloTobillo, e.id).toBeTruthy();
    }
  });

  it('desdeCatalogo entrega una copia independiente', () => {
    const e = desdeCatalogo('c_press_banca', 4);
    expect(e).toMatchObject({ id: 'c_press_banca', series: 4 });
    e.musculos.push('biceps');
    e.rangoReps[0] = 1;
    expect(CATALOGO_POR_ID.c_press_banca.musculos).toEqual(['pecho']);
    expect(CATALOGO_POR_ID.c_press_banca.rangoReps[0]).toBe(6);
    expect(() => desdeCatalogo('no_existe', 3)).toThrow();
  });
});

describe('rutinas estándar', () => {
  const GYM = { cuerpo_completo: 3, torso_pierna: 4, empuje_tiron_piernas: 6, hibrido: 4 } as const;

  for (const { id } of RUTINAS_ESTANDAR) {
    for (const running of [false, true]) {
      for (const tobillo of [false, true]) {
        it(`${id} (running=${running}, tobillo=${tobillo}): volumen dentro de rango y sesiones esperadas`, () => {
          const r = construirRutina(id, { running, tobillo });
          expect(analisisVolumen(r).filter((f) => f.estado !== 'ok')).toEqual([]);
          const corre = running || id === 'hibrido';
          expect(contarSesiones(r)).toBe(GYM[id] + (corre ? 3 : 0));
          for (const p of r.plantillas) {
            expect(new Set(p.ejercicios.map((e) => e.id)).size, p.id).toBe(p.ejercicios.length);
            for (const e of p.ejercicios) expect(CATALOGO_POR_ID[e.id], e.id).toBeDefined();
          }
          const protocolo = r.plantillas.flatMap((p) => p.ejercicios).filter((e) => e.esProtocoloTobillo);
          if (tobillo) expect(protocolo.map((e) => e.id)).toEqual(expect.arrayContaining(['c_eversion_banda', 'c_equilibrio_unipodal']));
          else expect(protocolo).toEqual([]);
        });
      }
    }
  }
});
