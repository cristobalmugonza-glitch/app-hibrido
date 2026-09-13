import type { Datos } from '../tipos/modelo';
import { diaLocal } from '../motor/fechas';
import { migrar } from './migracion';

// En iOS la hoja de compartir es la forma confiable de guardar un archivo desde una PWA.
export async function exportarJSON(datos: Datos): Promise<void> {
  const nombre = `hibrido-${diaLocal()}.json`;
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  const archivo = new File([blob], nombre, { type: 'application/json' });
  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: nombre });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Acepta respaldos de la versión actual y de la anterior (se migran).
export async function leerJSON(archivo: File): Promise<Datos> {
  let obj: unknown;
  try {
    obj = JSON.parse(await archivo.text());
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  const datos = migrar(obj);
  if (!datos) throw new Error('El archivo no tiene el formato de un respaldo de Híbrido.');
  return datos;
}
