const DIA_MS = 86_400_000;

// Día local YYYY-MM-DD (no UTC: una sesión a las 23:00 en Chile es de ese día).
export function diaLocal(fecha: string | Date = new Date()): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function ahoraIso(): string {
  return new Date().toISOString();
}

export function diasEntre(a: string | Date, b: string | Date): number {
  const ta = typeof a === 'string' ? new Date(a).getTime() : a.getTime();
  const tb = typeof b === 'string' ? new Date(b).getTime() : b.getTime();
  return (tb - ta) / DIA_MS;
}

// ¿La fecha cae en la ventana (hace desdeDias, hace hastaDias]? Ej: ultimos(0, 7) = últimos 7 días.
export function enVentana(fecha: string, ahora: Date, desdeDias: number, hastaDias: number): boolean {
  const d = diasEntre(fecha, ahora);
  return d >= desdeDias && d < hastaDias;
}

export function horasEntre(a: string, b: string): number {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;
}

const fmtCorta = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' });
export function fechaCorta(fecha: string): string {
  return fmtCorta.format(new Date(fecha)).replace('.', '');
}

export function haceCuanto(fecha: string, ahora = new Date()): string {
  const dias = Math.floor(diasEntre(diaLocal(fecha) + 'T00:00:00', diaLocal(ahora) + 'T00:00:00'));
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  return `hace ${dias} días`;
}
