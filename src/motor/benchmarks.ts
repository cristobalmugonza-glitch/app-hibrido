import type { Datos } from '../tipos/modelo';
import { diasEntre } from './fechas';
import { corre } from './planificacion';

// Frecuencias en días reales: medidas cada 4 semanas, tests cada 8.
const CADA = { medidas: 28, test: 56, dominadas: 56 };

export const tieneDominadas = (datos: Datos) => datos.rutina.plantillas.some((p) => p.vecesPorSemana > 0 && p.ejercicios.some((e) => /dominada/i.test(e.nombre)));

const vencido = (fecha: string | undefined, ahora: Date, dias: number) => !fecha || diasEntre(fecha, ahora) >= dias;

export function pendientes(datos: Datos, ahora = new Date()): string[] {
  const p: string[] = [];
  if (vencido(datos.medidas.at(-1)?.fecha, ahora, CADA.medidas)) p.push('medidas y foto');
  if (corre(datos) && vencido(datos.sesionesRunning.filter((s) => s.tipo === 'test').at(-1)?.fecha, ahora, CADA.test)) p.push('test 8 km');
  if (tieneDominadas(datos) && vencido(datos.dominadas.at(-1)?.fecha, ahora, CADA.dominadas)) p.push('dominadas con lastre');
  return p;
}
