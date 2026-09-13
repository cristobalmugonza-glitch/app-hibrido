const num1 = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 });
const num2 = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });
const num0 = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

export const fmt1 = (n: number) => num1.format(n);
export const fmt2 = (n: number) => num2.format(n);
export const fmt0 = (n: number) => num0.format(n);

// "1 ejercicio", "3 ejercicios".
export const plural = (n: number, singular: string, varios = `${singular}s`) => `${fmt1(n)} ${n === 1 ? singular : varios}`;

export function ritmo(segKm: number): string {
  if (!isFinite(segKm) || segKm <= 0) return '–';
  const s = Math.round(segKm);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function rangoRitmo(a: number, b: number): string {
  const [lo, hi] = a < b ? [a, b] : [b, a];
  return `${ritmo(lo)}–${ritmo(hi)}`;
}

export function segundosAMinTexto(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = Math.round(seg % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function rangoDescanso([a, b]: [number, number]): string {
  const f = (s: number) => (s % 60 === 0 ? `${s / 60}` : fmt1(s / 60));
  if (b < 120) return `${a}–${b} s`;
  return `${f(a)}–${f(b)} min`;
}
