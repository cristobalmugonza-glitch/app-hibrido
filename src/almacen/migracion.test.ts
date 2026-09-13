import { describe, expect, it } from 'vitest';
import { migrar } from './migracion';

// Forma de los datos guardados por la versión 1 (cola de 8 sesiones).
const V1 = {
  version: 1,
  perfil: { sexo: 'hombre', altura: 178, pesoInicial: 80.7, fcMax: 199, fechaInicio: '2026-09-11', caloriasObjetivo: 2450, proteinaObjetivo: 160, grasaObjetivo: 70, topeKmSemanal: 38, topeFondoKm: 18, fondoKmInicial: 14, z2Km: 8, ritmoSemillaSegKm: 350 },
  rutina: {
    plantillas: [
      { id: 'empuje', nombre: 'Empuje', ejercicios: [{ id: 'press_inclinado_mancuernas', nombre: 'Press inclinado mancuernas', tipo: 'compuesto_pesado', modo: 'carga', rangoReps: [6, 10], series: 3, incrementoKg: 2.5, musculos: ['pecho'], secundarios: ['triceps'], pesoInicial: 30 }] },
      { id: 'piernas', nombre: 'Piernas', ejercicios: [{ id: 'equilibrio_unipodal', nombre: 'Equilibrio unipodal', tipo: 'aislamiento', modo: 'tiempo', rangoReps: [30, 45], series: 3, incrementoKg: 0, musculos: [], esProtocoloTobillo: true, porLado: true }] },
    ],
    secuencia: [
      { id: 'p1', clase: 'gym', plantillaId: 'piernas' },
      { id: 'p2', clase: 'gym', plantillaId: 'empuje' },
      { id: 'p3', clase: 'running', tipo: 'z2' },
      { id: 'p4', clase: 'running', tipo: 'calidad' },
      { id: 'p5', clase: 'running', tipo: 'fondo' },
      { id: 'p6', clase: 'libre' },
    ],
    prioridades: { pecho: 'media', espalda: 'alta', hombro_lateral: 'alta', hombro_posterior: 'media', biceps: 'media', triceps: 'media', cuadriceps: 'media', isquios_gluteos: 'media', gemelos: 'mantencion' },
  },
  cola: { posicion: 2, vueltasCompletadas: 7 },
  historialCola: [{ fecha: '2026-09-12T12:00:00.000Z', pasoId: 'p1', estado: 'hecha' }],
  sesionesGym: [
    { id: 's1', fecha: '2026-09-12T22:00:00.000Z', plantillaId: 'empuje', nombre: 'Empuje', ciclo: 1, vuelta: 1, descarga: false, planificada: true, ejercicios: [{ ejercicioId: 'press_inclinado_mancuernas', nombre: 'Press inclinado mancuernas', series: [{ peso: 30, reps: 8 }] }] },
  ],
  sesionesRunning: [{ id: 'r1', fecha: '2026-09-12T12:00:00.000Z', tipo: 'z2', ciclo: 1, vuelta: 1, planificada: true, distanciaKm: 8, duracionMin: 47, fcPromedio: 140, equilibrioHecho: true }],
  pesos: [{ fecha: '2026-09-11T12:00:00.000Z', peso: 80.7 }],
  molestias: [{ fecha: '2026-09-12T12:00:00.000Z', zona: 'tobillo_der', intensidad: 2 }],
  medidas: [{ fecha: '2026-09-12T12:00:00.000Z', ciclo: 1, cintura: 86, cuello: 38, grasaNavy: 17.2 }],
  dominadas: [{ fecha: '2026-09-12T12:00:00.000Z', ciclo: 1, lastreKg: 5, reps: 8 }],
  borradorGym: { pasoId: 'p2', indiceEjercicio: 0, sesion: { id: 'b1', fecha: '2026-09-13T22:00:00.000Z', plantillaId: 'empuje', nombre: 'Empuje', ciclo: 2, vuelta: 4, descarga: true, planificada: true, ejercicios: [] } },
};

const AHORA = new Date(2026, 8, 13, 20);

describe('migración de la versión 1', () => {
  const d = migrar(V1, AHORA)!;

  it('convierte la cola en un plan semanal', () => {
    expect(d.version).toBe(2);
    expect(d.rutina.plantillas.map((p) => [p.id, p.vecesPorSemana])).toEqual([
      ['empuje', 1],
      ['piernas', 1],
    ]);
    expect(d.rutina.running).toEqual({ z2: 1, calidad: 1, fondo: 1 });
    expect(d.rutina.prioridades.abdomen).toBe('mantencion');
    expect(d.rutina.prioridades.espalda).toBe('alta');
  });

  it('conserva el historial y le copia los músculos a cada ejercicio', () => {
    expect(d.sesionesGym).toHaveLength(1);
    expect(d.sesionesGym[0]).not.toHaveProperty('ciclo');
    expect(d.sesionesGym[0].ejercicios[0]).toMatchObject({ musculos: ['pecho'], secundarios: ['triceps'], series: [{ peso: 30, reps: 8 }] });
    expect(d.sesionesRunning[0]).toEqual({ id: 'r1', fecha: '2026-09-12T12:00:00.000Z', tipo: 'z2', distanciaKm: 8, duracionMin: 47, fcPromedio: 140, equilibrioHecho: true });
    expect(d.molestias[0].zona).toBe('tobillo');
    expect(d.medidas[0]).toEqual({ fecha: '2026-09-12T12:00:00.000Z', cintura: 86, cuello: 38, grasaNavy: 17.2 });
    expect(d.dominadas[0]).toEqual({ fecha: '2026-09-12T12:00:00.000Z', lastreKg: 5, reps: 8 });
    expect(d.pesos).toEqual(V1.pesos);
  });

  it('mantiene los objetivos del corte y el bloque en curso', () => {
    expect(d.perfil).toMatchObject({ objetivo: 'perder_grasa', pisoKcal: 1900, caloriasObjetivo: 2450, fcMax: 199 });
    expect(d.mesociclosPrevios).toBe(1);
    // La vuelta 4 de la cola era descarga: la semana en curso lo sigue siendo.
    expect(d.planes).toEqual([{ inicio: '2026-09-07', tipo: 'descarga', sesiones: 5 }]);
  });

  it('pasa los ejercicios a la biblioteca propia y conserva la sesión en curso', () => {
    expect(d.ejerciciosPropios.map((e) => e.id)).toEqual(['press_inclinado_mancuernas', 'equilibrio_unipodal']);
    expect(d.borradorGym?.sesion).toMatchObject({ id: 'b1', plantillaId: 'empuje', descarga: true });
    expect(d.borradorGym).not.toHaveProperty('pasoId');
  });

  it('migrar datos ya migrados no cambia nada', () => {
    expect(migrar(JSON.parse(JSON.stringify(d)), AHORA)).toEqual(d);
  });
});

describe('datos inválidos', () => {
  it('devuelve null en vez de romper la app', () => {
    expect(migrar('texto')).toBeNull();
    expect(migrar(null)).toBeNull();
    expect(migrar({ version: 3 })).toBeNull();
    expect(migrar({ version: 1, perfil: {} })).toBeNull();
    expect(migrar({ version: 2, perfil: { fcMax: 190 }, rutina: { plantillas: [] } })).toBeNull();
  });

  it('completa lo que falte en un respaldo v2 incompleto', () => {
    const d = migrar({ version: 2, perfil: { fcMax: 185 }, rutina: { plantillas: [{ id: 'a', nombre: 'A', ejercicios: [] }], running: {} } })!;
    expect(d.perfil.fcMax).toBe(185);
    expect(d.rutina.plantillas[0].vecesPorSemana).toBe(1);
    expect(d.rutina.running).toEqual({ z2: 0, calidad: 0, fondo: 0 });
    expect(d.sesionesGym).toEqual([]);
    expect(d.planes).toEqual([]);
  });
});
