import type { Medidas, Sexo } from '../tipos/modelo';

// Ecuaciones de Hodgdon & Beckett (1984) en centímetros.
// Ojo: la versión "86.010 × log10(cintura − cuello) − 70.041 × log10(altura) + 36.76" es para pulgadas;
// usarla con cm sobreestima ~6,5 puntos.
export function navy(sexo: Sexo, altura: number, cintura: number, cuello: number, cadera?: number): number | null {
  if (sexo === 'hombre') {
    if (!(cintura > cuello) || altura <= 0) return null;
    return 495 / (1.0324 - 0.19077 * Math.log10(cintura - cuello) + 0.15456 * Math.log10(altura)) - 450;
  }
  if (!cadera || !(cintura + cadera > cuello) || altura <= 0) return null;
  return 495 / (1.29579 - 0.35004 * Math.log10(cintura + cadera - cuello) + 0.221 * Math.log10(altura)) - 450;
}

export type CategoriaACE = { nombre: string; desde: number; hasta: number | null };

export const ACE: Record<Sexo, CategoriaACE[]> = {
  hombre: [
    { nombre: 'Grasa esencial', desde: 2, hasta: 5 },
    { nombre: 'Atletas', desde: 6, hasta: 13 },
    { nombre: 'Fitness', desde: 14, hasta: 17 },
    { nombre: 'Promedio', desde: 18, hasta: 24 },
    { nombre: 'Obesidad', desde: 25, hasta: null },
  ],
  mujer: [
    { nombre: 'Grasa esencial', desde: 10, hasta: 13 },
    { nombre: 'Atletas', desde: 14, hasta: 20 },
    { nombre: 'Fitness', desde: 21, hasta: 24 },
    { nombre: 'Promedio', desde: 25, hasta: 31 },
    { nombre: 'Obesidad', desde: 32, hasta: null },
  ],
};

export function categoriaACE(pct: number, sexo: Sexo): CategoriaACE {
  const tabla = ACE[sexo];
  const redondeado = Math.round(pct);
  return tabla.find((c) => redondeado >= c.desde && (c.hasta === null || redondeado <= c.hasta)) ?? (redondeado < tabla[0].desde ? tabla[0] : tabla[tabla.length - 1]);
}

// Rango donde mostrar la nota sobre abdomen visible (categoría "Promedio").
export function mostrarNotaAbdomen(pct: number, sexo: Sexo): boolean {
  return categoriaACE(pct, sexo).nombre === 'Promedio';
}

export function ratioHombrosCintura(m: Medidas): number | null {
  return m.hombros && m.cintura ? m.hombros / m.cintura : null;
}
