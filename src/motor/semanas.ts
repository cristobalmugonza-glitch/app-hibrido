import { diaLocal } from './fechas';

// Semanas de lunes a domingo, en hora local. Los días se manejan como "YYYY-MM-DD".

export function aFechaLocal(dia: string): Date {
  const [y, m, d] = dia.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Un "YYYY-MM-DD" suelto se lee como día local (new Date lo leería como medianoche UTC, que en Chile es el día anterior).
function aDate(fecha: string | Date): Date {
  if (fecha instanceof Date) return fecha;
  return fecha.length <= 10 ? aFechaLocal(fecha) : new Date(fecha);
}

export function inicioSemana(fecha: string | Date = new Date()): string {
  const d = aDate(fecha);
  return diaLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)));
}

export function sumarDias(dia: string, n: number): string {
  const d = aFechaLocal(dia);
  return diaLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
}

const fmtMes = new Intl.DateTimeFormat('es-CL', { month: 'short' });
const fmtSemana = new Intl.DateTimeFormat('es-CL', { weekday: 'short' });
const mes = (d: Date) => fmtMes.format(d).replace('.', '');

// "7–13 sept" o "29 sept–5 oct".
export function rangoSemana(inicio: string): string {
  const a = aFechaLocal(inicio);
  const b = aFechaLocal(sumarDias(inicio, 6));
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${mes(b)}`;
  return `${a.getDate()} ${mes(a)}–${b.getDate()} ${mes(b)}`;
}

// "lun 8".
export function diaCorto(fecha: string): string {
  const d = aDate(fecha);
  return `${fmtSemana.format(d).replace('.', '')} ${d.getDate()}`;
}
