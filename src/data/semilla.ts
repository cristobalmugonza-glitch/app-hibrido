import type { Datos, Rutina } from '../tipos/modelo';

// Rutina de Cristóbal (11/09/2026). Es solo carga inicial: todo se edita en Ajustes
// y el motor no depende de ningún nombre ni id de acá.
export const RUTINA_SEMILLA: Rutina = {
  plantillas: [
    {
      id: 'empuje',
      nombre: 'Empuje',
      ejercicios: [
        { id: 'press_inclinado_mancuernas', nombre: 'Press inclinado mancuernas', tipo: 'compuesto_pesado', modo: 'carga', rangoReps: [6, 10], series: 3, incrementoKg: 2.5, musculos: ['pecho'], secundarios: ['triceps'], pesoInicial: 30, nota: 'kg por mancuerna' },
        { id: 'press_maquina_plano', nombre: 'Press máquina plano', tipo: 'compuesto_liviano', modo: 'carga', rangoReps: [8, 12], series: 3, incrementoKg: 2.5, musculos: ['pecho'], secundarios: ['triceps'], pesoInicial: 45, nota: 'kg por lado' },
        { id: 'pec_deck', nombre: 'Pec deck', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], series: 2, incrementoKg: 2.5, musculos: ['pecho'] },
        { id: 'rompecraneos_inclinado', nombre: 'Rompecráneos inclinado', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], series: 3, incrementoKg: 2, musculos: ['triceps'], pesoInicial: 12 },
        { id: 'triceps_polea_munequera', nombre: 'Tríceps en polea con muñequera', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 15], series: 3, incrementoKg: 2.5, musculos: ['triceps'] },
        { id: 'pajaros', nombre: 'Deltoide posterior (pájaros)', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 15], series: 4, incrementoKg: 2, musculos: ['hombro_posterior'] },
        { id: 'lateral_polea', nombre: 'Deltoide lateral en polea', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 15], series: 4, incrementoKg: 2.5, musculos: ['hombro_lateral'] },
      ],
    },
    {
      id: 'tiron',
      nombre: 'Tirón',
      ejercicios: [
        { id: 'remo_t_maquina', nombre: 'Remo T máquina', tipo: 'compuesto_pesado', modo: 'carga', rangoReps: [6, 10], series: 3, incrementoKg: 2.5, musculos: ['espalda'], secundarios: ['biceps', 'hombro_posterior'], pesoInicial: 50 },
        { id: 'jalon_dorsal', nombre: 'Jalón dorsal (máquina articulada)', tipo: 'compuesto_liviano', modo: 'carga', rangoReps: [8, 12], series: 3, incrementoKg: 2.5, musculos: ['espalda'], secundarios: ['biceps'], pesoInicial: 35 },
        { id: 'pullover_unilateral', nombre: 'Pull over unilateral con muñequera', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], series: 3, incrementoKg: 2.5, musculos: ['espalda'] },
        { id: 'biceps_inclinado', nombre: 'Bíceps banco inclinado 45° unilateral', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], series: 3, incrementoKg: 2.5, musculos: ['biceps'], pesoInicial: 12.5 },
        { id: 'biceps_braquial_sentado', nombre: 'Bíceps braquial sentado mancuernas', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], series: 3, incrementoKg: 2, musculos: ['biceps'], pesoInicial: 14 },
        { id: 'lateral_polea_tiron', nombre: 'Deltoide lateral en polea', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 15], series: 4, incrementoKg: 2.5, musculos: ['hombro_lateral'], nota: 'Agregado: el hombro lateral da el ancho' },
      ],
    },
    {
      id: 'piernas',
      nombre: 'Piernas',
      ejercicios: [
        { id: 'sentadilla_smith', nombre: 'Sentadilla en Smith', tipo: 'compuesto_pesado', modo: 'carga', rangoReps: [6, 10], series: 3, incrementoKg: 5, musculos: ['cuadriceps'], secundarios: ['isquios_gluteos'], pesoInicial: 55 },
        { id: 'peso_muerto_mancuerna', nombre: 'Peso muerto mancuerna', tipo: 'compuesto_pesado', modo: 'carga', rangoReps: [8, 12], series: 3, incrementoKg: 2.5, musculos: ['isquios_gluteos'], pesoInicial: 27.5, nota: 'kg por mancuerna' },
        { id: 'prensa', nombre: 'Prensa', tipo: 'compuesto_liviano', modo: 'carga', rangoReps: [10, 15], series: 3, incrementoKg: 5, musculos: ['cuadriceps'], secundarios: ['isquios_gluteos'] },
        { id: 'femoral_maquina', nombre: 'Femoral en máquina', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], series: 3, incrementoKg: 2.5, musculos: ['isquios_gluteos'] },
        { id: 'cuadriceps_maquina', nombre: 'Cuádriceps en máquina', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 15], series: 3, incrementoKg: 2.5, musculos: ['cuadriceps'] },
        { id: 'gemelos_pie', nombre: 'Gemelos de pie', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 20], series: 2, incrementoKg: 5, musculos: ['gemelos'] },
        { id: 'gemelos_sentado', nombre: 'Gemelos sentado (sóleo)', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 15], series: 3, incrementoKg: 2.5, musculos: ['gemelos'], esProtocoloTobillo: true },
        { id: 'eversion_inversion_banda', nombre: 'Eversión e inversión con banda', tipo: 'aislamiento', modo: 'reps', rangoReps: [15, 20], series: 2, incrementoKg: 0, musculos: [], esProtocoloTobillo: true, porLado: true },
        { id: 'equilibrio_unipodal', nombre: 'Equilibrio unipodal', tipo: 'aislamiento', modo: 'tiempo', rangoReps: [30, 45], series: 3, incrementoKg: 0, musculos: [], esProtocoloTobillo: true, porLado: true, nota: 'Empieza por el derecho' },
      ],
    },
    {
      id: 'calistenia',
      nombre: 'Calistenia',
      ejercicios: [
        { id: 'dominada_prona', nombre: 'Dominada prona', tipo: 'calistenia_peso_corporal', modo: 'carga', rangoReps: [6, 10], series: 3, incrementoKg: 2.5, musculos: ['espalda'], secundarios: ['biceps'], nota: 'Peso = lastre (0 = solo tu cuerpo)' },
        { id: 'fondos', nombre: 'Fondos', tipo: 'calistenia_peso_corporal', modo: 'carga', rangoReps: [8, 12], series: 3, incrementoKg: 2.5, musculos: ['pecho'], secundarios: ['triceps'], pesoInicial: 0, nota: 'Peso = lastre (0 = solo tu cuerpo)' },
        { id: 'dominada_supina', nombre: 'Dominada supina', tipo: 'calistenia_peso_corporal', modo: 'carga', rangoReps: [8, 12], series: 3, incrementoKg: 2.5, musculos: ['espalda'], secundarios: ['biceps'], pesoInicial: 0, nota: 'Peso = lastre (0 = solo tu cuerpo)' },
        { id: 'flexiones', nombre: 'Flexiones', tipo: 'calistenia_peso_corporal', modo: 'carga', rangoReps: [12, 20], series: 3, incrementoKg: 2.5, musculos: ['pecho'], secundarios: ['triceps'], pesoInicial: 0, nota: 'Peso = lastre (0 = solo tu cuerpo)' },
        { id: 'aislado_biceps', nombre: 'Bíceps (a elección)', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 15], series: 2, incrementoKg: 2, musculos: ['biceps'] },
        { id: 'aislado_triceps', nombre: 'Tríceps (a elección)', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 15], series: 2, incrementoKg: 2.5, musculos: ['triceps'] },
        { id: 'lateral_calistenia', nombre: 'Hombro lateral', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 15], series: 4, incrementoKg: 2, musculos: ['hombro_lateral'] },
        { id: 'posterior_calistenia', nombre: 'Hombro posterior', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 15], series: 3, incrementoKg: 2, musculos: ['hombro_posterior'] },
      ],
    },
  ],
  secuencia: [
    { id: 'paso_piernas', clase: 'gym', plantillaId: 'piernas' },
    { id: 'paso_empuje', clase: 'gym', plantillaId: 'empuje' },
    { id: 'paso_z2', clase: 'running', tipo: 'z2' },
    { id: 'paso_tiron', clase: 'gym', plantillaId: 'tiron' },
    { id: 'paso_calidad', clase: 'running', tipo: 'calidad' },
    { id: 'paso_calistenia', clase: 'gym', plantillaId: 'calistenia' },
    { id: 'paso_fondo', clase: 'running', tipo: 'fondo' },
    { id: 'paso_libre', clase: 'libre' },
  ],
  prioridades: {
    pecho: 'media',
    espalda: 'alta',
    hombro_lateral: 'alta',
    hombro_posterior: 'media',
    biceps: 'media',
    triceps: 'media',
    cuadriceps: 'media',
    isquios_gluteos: 'media',
    gemelos: 'mantencion',
  },
};

export function datosSemilla(): Datos {
  return {
    version: 1,
    perfil: {
      sexo: 'hombre',
      altura: 178,
      pesoInicial: 80.7,
      fcMax: 199,
      fechaInicio: '2026-09-11',
      caloriasObjetivo: 2450,
      proteinaObjetivo: 160,
      grasaObjetivo: 70,
      topeKmSemanal: 38,
      topeFondoKm: 18,
      fondoKmInicial: 14,
      z2Km: 8,
      ritmoSemillaSegKm: 350,
    },
    rutina: JSON.parse(JSON.stringify(RUTINA_SEMILLA)) as Rutina,
    cola: { posicion: 0, vueltasCompletadas: 0 },
    historialCola: [],
    sesionesGym: [],
    sesionesRunning: [],
    pesos: [{ fecha: new Date(2026, 8, 11, 9, 0).toISOString(), peso: 80.7 }],
    molestias: [],
    medidas: [],
    dominadas: [],
  };
}
