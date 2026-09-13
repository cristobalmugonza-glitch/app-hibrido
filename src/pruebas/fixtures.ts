import type { Datos, SesionGym, SesionRunning, TipoRunning } from '../tipos/modelo';
import { crearDatos, type Respuestas } from '../motor/perfil';

// Datos de prueba reproducibles. Septiembre 2026 en hora local: el lunes 7 empieza una semana.
export const dia = (d: number, h = 19) => new Date(2026, 8, d, h);

export const RESPUESTAS: Respuestas = {
  sexo: 'hombre',
  edad: 21,
  altura: 178,
  peso: 80,
  fcMax: 199,
  objetivo: 'perder_grasa',
  rutina: 'torso_pierna',
  corre: true,
  tobillo: true,
  kmSemana: 25,
  ritmoSegKm: 350,
};

export function datosPrueba(extra: Partial<Respuestas> = {}, ahora = dia(7, 8)): Datos {
  return crearDatos({ ...RESPUESTAS, ...extra }, ahora);
}

let contador = 0;

// Sesión de gym con todas las series del plan. reps: 'tope' = máximo del rango, 'piso' = mínimo, 'bajo' = bajo el mínimo.
export function sesionGym(datos: Datos, plantillaId: string, fecha: Date, reps: 'tope' | 'piso' | 'bajo' = 'piso', descarga = false): SesionGym {
  const p = datos.rutina.plantillas.find((x) => x.id === plantillaId);
  if (!p) throw new Error(`No existe la plantilla ${plantillaId}`);
  return {
    id: `g${++contador}`,
    fecha: fecha.toISOString(),
    plantillaId,
    nombre: p.nombre,
    descarga,
    ejercicios: p.ejercicios.map((e) => {
      const r = reps === 'tope' ? e.rangoReps[1] : reps === 'piso' ? e.rangoReps[0] : e.rangoReps[0] - 2;
      return {
        ejercicioId: e.id,
        nombre: e.nombre,
        musculos: [...e.musculos],
        ...(e.secundarios ? { secundarios: [...e.secundarios] } : {}),
        series: Array.from({ length: e.series }, () => ({ peso: e.modo === 'carga' ? (e.pesoInicial ?? 20) : 0, reps: r })),
      };
    }),
  };
}

export function conGym(datos: Datos, plantillaId: string, fecha: Date, reps: 'tope' | 'piso' | 'bajo' = 'piso'): Datos {
  return { ...datos, sesionesGym: [...datos.sesionesGym, sesionGym(datos, plantillaId, fecha, reps)] };
}

export function carrera(tipo: TipoRunning | 'test', fecha: Date, km = 8): SesionRunning {
  return { id: `r${++contador}`, fecha: fecha.toISOString(), tipo, distanciaKm: km, duracionMin: km * 5.8, fcPromedio: 140 };
}

export function conCarrera(datos: Datos, tipo: TipoRunning | 'test', fecha: Date, km = 8): Datos {
  return { ...datos, sesionesRunning: [...datos.sesionesRunning, carrera(tipo, fecha, km)] };
}

// Semana "entrenada" del plan torso/pierna: 2 torso y 2 pierna desde el lunes indicado.
export function semanaEntrenada(datos: Datos, lunes: number, reps: 'tope' | 'piso' | 'bajo' = 'piso'): Datos {
  let d = conGym(datos, 'torso', dia(lunes, 8), reps);
  d = conGym(d, 'pierna', dia(lunes + 1, 8), reps);
  d = conGym(d, 'torso', dia(lunes + 3, 8), reps);
  return conGym(d, 'pierna', dia(lunes + 4, 8), reps);
}
