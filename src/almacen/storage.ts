import type { Datos } from '../tipos/modelo';
import { migrar } from './migracion';

const CLAVE = 'hibrido:datos:v2';
// Los datos de la versión 1 nunca se sobrescriben: quedan como respaldo hasta que borres todo.
const CLAVE_V1 = 'hibrido:datos:v1';

export function cargar(ahora = new Date()): Datos | null {
  for (const clave of [CLAVE, CLAVE_V1]) {
    try {
      const crudo = localStorage.getItem(clave);
      if (!crudo) continue;
      const datos = migrar(JSON.parse(crudo), ahora);
      if (datos) return datos;
    } catch (e) {
      console.error(`No se pudieron leer los datos de ${clave}`, e);
    }
  }
  return null;
}

export function guardar(datos: Datos): boolean {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos));
    return true;
  } catch (e) {
    console.error('No se pudieron guardar los datos', e);
    return false;
  }
}

export function borrarTodo(): void {
  try {
    localStorage.removeItem(CLAVE);
    localStorage.removeItem(CLAVE_V1);
  } catch (e) {
    console.error('No se pudieron borrar los datos', e);
  }
}

export function nuevoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      // contexto no seguro (http en la red local): cae al id simple
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
