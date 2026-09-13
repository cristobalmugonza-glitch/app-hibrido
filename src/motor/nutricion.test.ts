import { describe, expect, it } from 'vitest';
import type { Datos, Objetivo } from '../tipos/modelo';
import { datosPrueba } from '../pruebas/fixtures';
import { aplicarKcal, guiaAyuno, macros, metaSemanal, perdidaRapida, promediosSemanales, propuestaKcal, rangoProteinaDeficit } from './nutricion';

const AHORA = new Date('2026-10-20T12:00:00.000Z');
const DIA = 86_400_000;
const hace = (dias: number) => new Date(AHORA.getTime() - dias * DIA).toISOString();

function base(objetivo: Objetivo = 'perder_grasa'): Datos {
  const d = datosPrueba({ objetivo });
  return { ...d, perfil: { ...d.perfil, caloriasObjetivo: 2450, proteinaObjetivo: 160, grasaObjetivo: 70, pisoKcal: 1900 } };
}

// 3 pesajes por semana (días 1, 3 y 5 de cada ventana); pesoSemana[i] = semana i hacia atrás.
function conPesos(pesoSemana: number[], d = base()): Datos {
  return { ...d, pesos: pesoSemana.flatMap((p, i) => [1, 3, 5].map((k) => ({ fecha: hace(i * 7 + k), peso: p }))) };
}

describe('macros', () => {
  it('2.450 kcal, 160 g proteína, 70 g grasa → 295 g de carbohidratos', () => {
    expect(macros(base().perfil)).toEqual({ kcal: 2450, proteina: 160, grasa: 70, carbos: 295 });
  });
});

describe('calibración para perder grasa', () => {
  it('sin datos suficientes no propone nada', () => {
    expect(propuestaKcal(base(), AHORA)).toBeNull();
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
    expect(propuestaKcal(conPesos([80.6, 80.7, 80.6, 80.7]), AHORA)).toMatchObject({ tipo: 'bajar', deltaKcal: -150 });
  });

  it('cerca del piso: propone pausa en vez de bajar', () => {
    const d = conPesos([80.6, 80.7, 80.6, 80.7]);
    expect(propuestaKcal({ ...d, perfil: { ...d.perfil, caloriasObjetivo: 2000 } }, AHORA)).toMatchObject({ tipo: 'pausa', deltaKcal: 0 });
  });

  it('bajando más de 0,75 % del peso por semana dos semanas seguidas: propone +150 kcal', () => {
    expect(propuestaKcal(conPesos([78.6, 79.3, 80.0]), AHORA)).toMatchObject({ tipo: 'subir', deltaKcal: 150 });
  });

  it('pérdida rápida sostenida (>1 % del peso por semana) se detecta', () => {
    expect(perdidaRapida(conPesos([78.2, 79.1, 80.0]), AHORA)).toBe(true);
    expect(perdidaRapida(conPesos([79.3, 79.7, 80.0]), AHORA)).toBe(false);
  });

  it('después de aplicar un ajuste espera 2 semanas', () => {
    const estancado = conPesos([80.6, 80.7, 80.6, 80.7]);
    const d = aplicarKcal(estancado, -150, new Date(AHORA.getTime() - 5 * DIA));
    expect(d.perfil.caloriasObjetivo).toBe(2300);
    expect(propuestaKcal(d, AHORA)).toBeNull();
    expect(propuestaKcal(aplicarKcal(estancado, -150, new Date(AHORA.getTime() - 15 * DIA)), AHORA)).not.toBeNull();
  });
});

describe('calibración para ganar músculo y mantener', () => {
  it('ganar: 3 semanas sin subir → +150; subiendo rápido → −150; buen ritmo → nada', () => {
    expect(propuestaKcal(conPesos([80, 80, 80, 80], base('ganar_musculo')), AHORA)).toMatchObject({ tipo: 'subir', deltaKcal: 150 });
    expect(propuestaKcal(conPesos([81.2, 80.6, 80.0], base('ganar_musculo')), AHORA)).toMatchObject({ tipo: 'bajar', deltaKcal: -150 });
    expect(propuestaKcal(conPesos([80.5, 80.4, 80.2, 80.0], base('ganar_musculo')), AHORA)).toBeNull();
  });

  it('mantener: corrige solo si el peso se mueve más de 1 % en 3 semanas', () => {
    expect(propuestaKcal(conPesos([81, 80.6, 80.3, 80], base('mantener')), AHORA)).toMatchObject({ tipo: 'bajar' });
    expect(propuestaKcal(conPesos([79, 79.4, 79.7, 80], base('mantener')), AHORA)).toMatchObject({ tipo: 'subir' });
    expect(propuestaKcal(conPesos([80.2, 80, 80.1, 80], base('mantener')), AHORA)).toBeNull();
  });

  it('la meta semanal se escala con el peso', () => {
    expect(metaSemanal(base().perfil, 80)).toBe('Meta: bajar 0,3–0,6 kg por semana.');
    expect(metaSemanal(base('ganar_musculo').perfil, 80)).toBe('Meta: subir 0,2–0,4 kg por semana.');
    expect(metaSemanal(base('mantener').perfil, 80)).toBe('Meta: mantener tu peso estable.');
  });
});

describe('proteína', () => {
  it('rango en déficit sobre masa libre de grasa', () => {
    const d = { ...base(), medidas: [{ fecha: hace(1), cintura: 88, grasaNavy: 20 }] };
    expect(rangoProteinaDeficit(d)).toEqual([147, 198]);
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
