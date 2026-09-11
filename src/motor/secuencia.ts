import type { Datos, EstadoCola, PasoSecuencia, Rutina } from '../tipos/modelo';
import { ahoraIso, diaLocal, horasEntre } from './fechas';

export const VUELTAS_POR_CICLO = 4;

export type Contexto = { ciclo: number; vuelta: number; descarga: boolean };

// Una vuelta = una pasada completa por la secuencia. Las vueltas 1–3 son de carga y la 4 es descarga.
export function contexto(cola: EstadoCola): Contexto {
  const ciclo = Math.floor(cola.vueltasCompletadas / VUELTAS_POR_CICLO) + 1;
  const vuelta = (cola.vueltasCompletadas % VUELTAS_POR_CICLO) + 1;
  return { ciclo, vuelta, descarga: vuelta === VUELTAS_POR_CICLO };
}

export function pasoActual(rutina: Rutina, cola: EstadoCola): PasoSecuencia | undefined {
  const n = rutina.secuencia.length;
  if (n === 0) return undefined;
  return rutina.secuencia[cola.posicion % n];
}

export function proximos(rutina: Rutina, cola: EstadoCola, cantidad: number): PasoSecuencia[] {
  const n = rutina.secuencia.length;
  if (n === 0) return [];
  return Array.from({ length: Math.min(cantidad, n - 1) }, (_, i) => rutina.secuencia[(cola.posicion + 1 + i) % n]);
}

export function avanzar(cola: EstadoCola, largo: number): EstadoCola {
  if (largo === 0) return cola;
  const siguiente = (cola.posicion % largo) + 1;
  if (siguiente >= largo) return { posicion: 0, vueltasCompletadas: cola.vueltasCompletadas + 1 };
  return { posicion: siguiente, vueltasCompletadas: cola.vueltasCompletadas };
}

// Completar o saltar hacen lo mismo con la cola: avanza un paso. La diferencia queda en el historial.
export function completarPaso(datos: Datos, estado: 'hecha' | 'saltada', sesionId?: string, fecha = ahoraIso()): Datos {
  const paso = pasoActual(datos.rutina, datos.cola);
  if (!paso) return datos;
  return {
    ...datos,
    cola: avanzar(datos.cola, datos.rutina.secuencia.length),
    historialCola: [...datos.historialCola, { fecha, pasoId: paso.id, estado, sesionId }],
  };
}

// Vuelve al primer paso y a la vuelta 1 del ciclo actual (el número de ciclo se conserva).
export function reiniciarCiclo(cola: EstadoCola): EstadoCola {
  const { ciclo } = contexto(cola);
  return { posicion: 0, vueltasCompletadas: (ciclo - 1) * VUELTAS_POR_CICLO };
}

const NOMBRE_RUNNING = { z2: 'Running Z2', calidad: 'Running calidad', fondo: 'Fondo largo' } as const;

export function nombrePaso(paso: PasoSecuencia, rutina: Rutina): string {
  if (paso.clase === 'gym') return rutina.plantillas.find((p) => p.id === paso.plantillaId)?.nombre ?? 'Sesión de gym';
  if (paso.clase === 'running') return NOMBRE_RUNNING[paso.tipo];
  return 'Libre';
}

export function nombreRunning(tipo: keyof typeof NOMBRE_RUNNING | 'test'): string {
  return tipo === 'test' ? 'Test 8 km' : NOMBRE_RUNNING[tipo];
}

// Última sesión hecha hoy (para la guía de sesiones dobles).
export function ultimaSesionHoy(datos: Datos, ahora = new Date()): { pasoId: string; horas: number } | null {
  const hoy = diaLocal(ahora);
  const hechas = datos.historialCola.filter((r) => r.estado === 'hecha' && diaLocal(r.fecha) === hoy);
  const ultima = hechas.at(-1);
  if (!ultima) return null;
  return { pasoId: ultima.pasoId, horas: horasEntre(ultima.fecha, ahora.toISOString()) };
}
