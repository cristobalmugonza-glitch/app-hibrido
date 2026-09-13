import type { Datos, EjercicioDef, PlantillaGym, RefBloque } from '../tipos/modelo';
import { CATALOGO_POR_ID, construirRutina, desdeCatalogo, type IdRutina } from '../data/catalogo';
import { nuevoId } from '../almacen/storage';
import { corre } from './planificacion';
import { tieneProtocoloTobillo } from './running';

// Campos que definen al ejercicio en sí. Las series son propias de cada sesión.
const COMPARTIDOS = ['nombre', 'tipo', 'modo', 'rangoReps', 'incrementoKg', 'musculos', 'secundarios', 'esProtocoloTobillo', 'porLado', 'nota'] as const;

function compartidos(def: EjercicioDef): Partial<EjercicioDef> {
  const r: Record<string, unknown> = {};
  for (const k of COMPARTIDOS) r[k] = def[k];
  return r as Partial<EjercicioDef>;
}

const conPlantilla = (datos: Datos, id: string, f: (p: PlantillaGym) => PlantillaGym): Datos => ({
  ...datos,
  rutina: { ...datos.rutina, plantillas: datos.rutina.plantillas.map((p) => (p.id === id ? f(p) : p)) },
});

// Ejercicios propios y los de tu rutina que no vienen del catálogo, sin repetir.
export function misEjercicios(datos: Datos): EjercicioDef[] {
  const vistos = new Map<string, EjercicioDef>();
  for (const e of datos.ejerciciosPropios) vistos.set(e.id, e);
  for (const p of datos.rutina.plantillas) for (const e of p.ejercicios) if (!CATALOGO_POR_ID[e.id] && !vistos.has(e.id)) vistos.set(e.id, e);
  return [...vistos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

// Copia para agregar a una sesión: si el ejercicio ya está en tu plan, respeta cómo lo configuraste.
export function definicionPara(datos: Datos, id: string, series = 3): EjercicioDef | null {
  const existente = datos.rutina.plantillas.flatMap((p) => p.ejercicios).find((e) => e.id === id) ?? datos.ejerciciosPropios.find((e) => e.id === id);
  if (existente) return { ...existente, rangoReps: [existente.rangoReps[0], existente.rangoReps[1]], series };
  return CATALOGO_POR_ID[id] ? desdeCatalogo(id, series) : null;
}

export function agregarEjercicio(datos: Datos, plantillaId: string, def: EjercicioDef): Datos {
  const p = datos.rutina.plantillas.find((x) => x.id === plantillaId);
  if (!p || p.ejercicios.some((e) => e.id === def.id)) return datos;
  return conPlantilla(datos, plantillaId, (x) => ({ ...x, ejercicios: [...x.ejercicios, def] }));
}

// Guarda un ejercicio en una sesión. Los cambios de definición (nombre, rango, músculos…) se copian al mismo
// ejercicio en las demás sesiones, porque comparten historial; las series de cada sesión se mantienen.
export function guardarEjercicio(datos: Datos, plantillaId: string, def: EjercicioDef): Datos {
  const comun = compartidos(def);
  const plantillas = datos.rutina.plantillas.map((p) => {
    const ejercicios = p.ejercicios.map((e) => (e.id !== def.id ? e : p.id === plantillaId ? def : ({ ...e, ...comun } as EjercicioDef)));
    const falta = p.id === plantillaId && !p.ejercicios.some((e) => e.id === def.id);
    return { ...p, ejercicios: falta ? [...ejercicios, def] : ejercicios };
  });
  const enBiblioteca = datos.ejerciciosPropios.some((e) => e.id === def.id);
  const ejerciciosPropios = enBiblioteca
    ? datos.ejerciciosPropios.map((e) => (e.id === def.id ? ({ ...e, ...comun } as EjercicioDef) : e))
    : CATALOGO_POR_ID[def.id]
      ? datos.ejerciciosPropios
      : [...datos.ejerciciosPropios, def];
  return { ...datos, rutina: { ...datos.rutina, plantillas }, ejerciciosPropios };
}

export function quitarEjercicio(datos: Datos, plantillaId: string, ejercicioId: string): Datos {
  return conPlantilla(datos, plantillaId, (p) => ({ ...p, ejercicios: p.ejercicios.filter((e) => e.id !== ejercicioId) }));
}

export function moverEjercicio(datos: Datos, plantillaId: string, indice: number, delta: number): Datos {
  return conPlantilla(datos, plantillaId, (p) => {
    const j = indice + delta;
    if (j < 0 || j >= p.ejercicios.length) return p;
    const ejercicios = [...p.ejercicios];
    [ejercicios[indice], ejercicios[j]] = [ejercicios[j], ejercicios[indice]];
    return { ...p, ejercicios };
  });
}

export function crearPlantilla(datos: Datos, nombre = 'Nueva sesión'): { datos: Datos; id: string } {
  const id = nuevoId();
  return { id, datos: { ...datos, rutina: { ...datos.rutina, plantillas: [...datos.rutina.plantillas, { id, nombre, ejercicios: [], vecesPorSemana: 1 }] } } };
}

export function renombrarPlantilla(datos: Datos, id: string, nombre: string): Datos {
  return conPlantilla(datos, id, (p) => ({ ...p, nombre }));
}

// El historial de la sesión se conserva: solo sale del plan.
export function eliminarPlantilla(datos: Datos, id: string): Datos {
  if (datos.borradorGym?.sesion.plantillaId === id) return datos;
  return { ...datos, rutina: { ...datos.rutina, plantillas: datos.rutina.plantillas.filter((p) => p.id !== id) } };
}

export const MAX_VECES = 7;

export function fijarVeces(datos: Datos, ref: RefBloque, veces: number): Datos {
  const v = Math.max(0, Math.min(MAX_VECES, Math.round(veces)));
  if (ref.clase === 'gym') return conPlantilla(datos, ref.plantillaId, (p) => ({ ...p, vecesPorSemana: v }));
  return { ...datos, rutina: { ...datos.rutina, running: { ...datos.rutina.running, [ref.tipo]: v } } };
}

// Reemplaza el plan por una rutina estándar. El historial queda intacto y tus ejercicios propios pasan a la biblioteca.
export function aplicarRutinaEstandar(datos: Datos, id: IdRutina): Datos {
  const rutina = construirRutina(id, { running: corre(datos), tobillo: tieneProtocoloTobillo(datos) });
  return { ...datos, rutina, ejerciciosPropios: misEjercicios(datos) };
}
