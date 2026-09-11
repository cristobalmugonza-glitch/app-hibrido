import { describe, expect, it } from 'vitest';
import { datosSemilla } from '../data/semilla';
import type { Datos } from '../tipos/modelo';
import { guiaAyuno, macros, perdidaRapida, promediosSemanales, propuestaKcal, rangoProteinaDeficit } from './nutricion';

const AHORA = new Date('2026-10-20T12:00:00.000Z');
const DIA = 86_400_000;
const hace = (dias: number) => new Date(AHORA.getTime() - dias * DIA).toISOString();

// 3 pesajes por semana (días 1, 3 y 5 de cada ventana); pesoSemana[i] = semana i hacia atrás.
function conPesos(pesoSemana: number[], d = datosSemilla()): Datos {
  d.pesos = pesoSemana.flatMap((p, i) => [1, 3, 5].map((k) => ({ fecha: hace(i * 7 + k), peso: p })));
  return d;
}

describe('macros', () => {
  it('semilla: 2.450 kcal, 160 g proteína, 70 g grasa → 295 g de carbohidratos', () => {
    expect(macros(datosSemilla().perfil)).toEqual({ kcal: 2450, proteina: 160, grasa: 70, carbos: 295 });
  });
});

describe('calibración de calorías', () => {
  it('sin datos suficientes no propone nada', () => {
    expect(propuestaKcal(datosSemilla(), AHORA)).toBeNull();
  });

  it('promedia por ventana de 7 días y exige al menos 2 pesajes', () => {
    const s = promediosSemanales(conPesos([80, 80.5]).pesos, AHORA, 3);
    expect(s[0].promedio).toBe(80);
    expect(s[1].promedio).toBe(80.5);
    expect(s[2].promedio).toBeNull();
  });

  it('ritmo dentro del objetivo: no propone cambios', () => {
    expect(propuestaKcal(conPesos([79.2, 79.6, 80.0, 80.4]), AHORA)).toBeNull();
  });

  it('3 semanas sin bajar: propone −150 kcal', () => {
    const p = propuestaKcal(conPesos([80.6, 80.7, 80.6, 80.7]), AHORA);
    expect(p).toMatchObject({ tipo: 'bajar', deltaKcal: -150 });
  });

  it('cerca del piso de 1.900 kcal: propone pausa en vez de bajar', () => {
    const d = conPesos([80.6, 80.7, 80.6, 80.7]);
    d.perfil.caloriasObjetivo = 2000;
    expect(propuestaKcal(d, AHORA)).toMatchObject({ tipo: 'pausa', deltaKcal: 0 });
  });

  it('bajando más de 0,6 kg/semana dos semanas seguidas: propone +150 kcal', () => {
    expect(propuestaKcal(conPesos([78.6, 79.3, 80.0]), AHORA)).toMatchObject({ tipo: 'subir', deltaKcal: 150 });
  });

  it('pérdida rápida sostenida (>0,8 kg/semana) se detecta', () => {
    expect(perdidaRapida(conPesos([78.2, 79.1, 80.0]), AHORA)).toBe(true);
    expect(perdidaRapida(conPesos([79.3, 79.7, 80.0]), AHORA)).toBe(false);
  });
});

describe('proteína', () => {
  it('rango en déficit sobre masa libre de grasa', () => {
    const d = datosSemilla();
    d.medidas = [{ fecha: hace(1), ciclo: 1, cintura: 88, grasaNavy: 20 }];
    expect(rangoProteinaDeficit(d)).toEqual([148, 200]);
  });
});

describe('guía de ayuno flexible', () => {
  const hoy = '2026-10-20';
  const ahora = new Date(2026, 9, 20, 10, 0);
  it('sin entreno: reparte en 3 comidas', () => {
    expect(guiaAyuno({ fecha: hoy, hora: null, ayunoRoto: false }, 160, ahora)?.texto).toContain('3 comidas de ~53 g');
  });
  it('mañana en ayunas: proteína dentro de la primera hora después', () => {
    expect(guiaAyuno({ fecha: hoy, hora: '07:30', ayunoRoto: false }, 160, ahora)?.texto).toContain('primera hora');
  });
  it('tarde ya comiendo: carbo + proteína 60–90 min antes', () => {
    expect(guiaAyuno({ fecha: hoy, hora: '19:00', ayunoRoto: true }, 160, ahora)?.texto).toContain('60–90 min');
  });
  it('tarde aún en ayunas: agua/café/mate y proteína después', () => {
    expect(guiaAyuno({ fecha: hoy, hora: '18:00', ayunoRoto: false }, 160, ahora)?.texto).toContain('mate');
  });
  it('un registro de otro día no aplica hoy', () => {
    expect(guiaAyuno({ fecha: '2026-10-19', hora: '18:00', ayunoRoto: false }, 160, ahora)).toBeNull();
  });
});
