import type { Datos } from '../tipos/modelo';
import type { Contexto } from './secuencia';

// Frecuencias en ciclos (1 ciclo = 4 vueltas ≈ 4 semanas).
const CADA = { medidas: 1, test: 2, dominadas: 2 };

function vencido(ultimoCiclo: number | undefined, ciclo: number, cada: number) {
  return ultimoCiclo === undefined || ciclo - ultimoCiclo >= cada;
}

export function pendientes(datos: Datos, ctx: Contexto): string[] {
  const p: string[] = [];
  if (vencido(datos.medidas.at(-1)?.ciclo, ctx.ciclo, CADA.medidas)) p.push('medidas y foto');
  if (vencido(datos.sesionesRunning.filter((s) => s.tipo === 'test').at(-1)?.ciclo, ctx.ciclo, CADA.test)) p.push('test 8 km');
  if (vencido(datos.dominadas.at(-1)?.ciclo, ctx.ciclo, CADA.dominadas)) p.push('dominadas con lastre');
  return p;
}
