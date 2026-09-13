import { describe, expect, it } from 'vitest';
import { categoriaACE, mostrarNotaAbdomen, navy, ratioHombrosCintura } from './grasa';

// Versión en pulgadas de la misma ecuación (la que venía en el prompt original).
const navyPulgadas = (cintura: number, cuello: number, altura: number) => 86.01 * Math.log10(cintura - cuello) - 70.041 * Math.log10(altura) + 36.76;

describe('estimación Navy', () => {
  it('hombre: cuello 38, cintura 86, altura 178 ≈ 17,2 %', () => {
    expect(navy('hombre', 178, 86, 38)).toBeCloseTo(17.2, 1);
  });

  it('coincide con la versión en pulgadas cuando a esa se le pasan pulgadas', () => {
    const cm = navy('hombre', 178, 86, 38)!;
    const pulgadas = navyPulgadas(86 / 2.54, 38 / 2.54, 178 / 2.54);
    expect(Math.abs(cm - pulgadas)).toBeLessThan(0.5);
  });

  it('usar la versión en pulgadas con centímetros sobreestima ~6,5 puntos', () => {
    const error = navyPulgadas(86, 38, 178) - navy('hombre', 178, 86, 38)!;
    expect(error).toBeGreaterThan(6);
    expect(error).toBeLessThan(7);
  });

  it('devuelve null con medidas imposibles o incompletas', () => {
    expect(navy('hombre', 178, 38, 40)).toBeNull();
    expect(navy('mujer', 165, 75, 33)).toBeNull();
  });

  it('mujer con cadera da un valor razonable', () => {
    const v = navy('mujer', 165, 75, 33, 98)!;
    expect(v).toBeGreaterThan(20);
    expect(v).toBeLessThan(35);
  });
});

describe('categorías ACE', () => {
  it('clasifica en hombres', () => {
    expect(categoriaACE(17.2, 'hombre').nombre).toBe('Fitness');
    expect(categoriaACE(20, 'hombre').nombre).toBe('Promedio');
    expect(categoriaACE(10, 'hombre').nombre).toBe('Atletas');
    expect(categoriaACE(30, 'hombre').nombre).toBe('Obesidad');
  });

  it('la nota de abdomen aparece solo en 18–24 % (hombres)', () => {
    expect(mostrarNotaAbdomen(20, 'hombre')).toBe(true);
    expect(mostrarNotaAbdomen(16, 'hombre')).toBe(false);
    expect(mostrarNotaAbdomen(26, 'hombre')).toBe(false);
  });
});

describe('ratio hombros/cintura', () => {
  it('calcula con ambas medidas y null si falta hombros', () => {
    expect(ratioHombrosCintura({ fecha: '', cintura: 85, hombros: 122 })).toBeCloseTo(1.435, 3);
    expect(ratioHombrosCintura({ fecha: '', cintura: 85 })).toBeNull();
  });
});
