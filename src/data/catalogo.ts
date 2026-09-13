import type { EjercicioDef, PlantillaGym, Rutina } from '../tipos/modelo';
import { PRIORIDADES_BASE } from './reglas-tipo';

export type Grupo = 'pecho' | 'espalda' | 'hombros' | 'brazos' | 'piernas' | 'core' | 'tobillo';

export const NOMBRE_GRUPO: Record<Grupo, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombros: 'Hombros',
  brazos: 'Brazos',
  piernas: 'Piernas',
  core: 'Core',
  tobillo: 'Tobillo',
};

export type EjercicioCatalogo = Omit<EjercicioDef, 'series' | 'pesoInicial'> & { grupo: Grupo };

const LASTRE = 'Peso = lastre (0 = solo tu cuerpo)';
const MANCUERNA = 'kg por mancuerna';

const E = (e: EjercicioCatalogo) => e;

// Biblioteca de fábrica. Los ids llevan prefijo "c_" para no chocar con ejercicios propios ni antiguos.
export const CATALOGO: EjercicioCatalogo[] = [
  // Pecho
  E({ id: 'c_press_banca', nombre: 'Press banca con barra', grupo: 'pecho', tipo: 'compuesto_pesado', modo: 'carga', rangoReps: [6, 10], incrementoKg: 2.5, musculos: ['pecho'], secundarios: ['triceps'] }),
  E({ id: 'c_press_inclinado_barra', nombre: 'Press inclinado con barra', grupo: 'pecho', tipo: 'compuesto_pesado', modo: 'carga', rangoReps: [6, 10], incrementoKg: 2.5, musculos: ['pecho'], secundarios: ['triceps'] }),
  E({ id: 'c_press_banca_mancuernas', nombre: 'Press banca con mancuernas', grupo: 'pecho', tipo: 'compuesto_pesado', modo: 'carga', rangoReps: [6, 10], incrementoKg: 2, musculos: ['pecho'], secundarios: ['triceps'], nota: MANCUERNA }),
  E({ id: 'c_press_inclinado_mancuernas', nombre: 'Press inclinado con mancuernas', grupo: 'pecho', tipo: 'compuesto_pesado', modo: 'carga', rangoReps: [6, 10], incrementoKg: 2, musculos: ['pecho'], secundarios: ['triceps'], nota: MANCUERNA }),
  E({ id: 'c_press_maquina_pecho', nombre: 'Press de pecho en máquina', grupo: 'pecho', tipo: 'compuesto_liviano', modo: 'carga', rangoReps: [8, 12], incrementoKg: 2.5, musculos: ['pecho'], secundarios: ['triceps'] }),
  E({ id: 'c_aperturas_polea', nombre: 'Aperturas en polea', grupo: 'pecho', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], incrementoKg: 2.5, musculos: ['pecho'] }),
  E({ id: 'c_pec_deck', nombre: 'Pec deck', grupo: 'pecho', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], incrementoKg: 2.5, musculos: ['pecho'] }),
  E({ id: 'c_fondos', nombre: 'Fondos en paralelas', grupo: 'pecho', tipo: 'calistenia_peso_corporal', modo: 'carga', rangoReps: [8, 12], incrementoKg: 2.5, musculos: ['pecho'], secundarios: ['triceps'], nota: LASTRE }),
  E({ id: 'c_flexiones', nombre: 'Flexiones', grupo: 'pecho', tipo: 'calistenia_peso_corporal', modo: 'carga', rangoReps: [12, 20], incrementoKg: 2.5, musculos: ['pecho'], secundarios: ['triceps'], nota: LASTRE }),

  // Espalda
  E({ id: 'c_dominada_prona', nombre: 'Dominada prona', grupo: 'espalda', tipo: 'calistenia_peso_corporal', modo: 'carga', rangoReps: [6, 10], incrementoKg: 2.5, musculos: ['espalda'], secundarios: ['biceps'], nota: LASTRE }),
  E({ id: 'c_dominada_supina', nombre: 'Dominada supina', grupo: 'espalda', tipo: 'calistenia_peso_corporal', modo: 'carga', rangoReps: [8, 12], incrementoKg: 2.5, musculos: ['espalda'], secundarios: ['biceps'], nota: LASTRE }),
  E({ id: 'c_jalon_pecho', nombre: 'Jalón al pecho', grupo: 'espalda', tipo: 'compuesto_liviano', modo: 'carga', rangoReps: [8, 12], incrementoKg: 2.5, musculos: ['espalda'], secundarios: ['biceps'] }),
  E({ id: 'c_remo_barra', nombre: 'Remo con barra', grupo: 'espalda', tipo: 'compuesto_pesado', modo: 'carga', rangoReps: [6, 10], incrementoKg: 2.5, musculos: ['espalda'], secundarios: ['biceps', 'hombro_posterior'] }),
  E({ id: 'c_remo_mancuerna', nombre: 'Remo con mancuerna', grupo: 'espalda', tipo: 'compuesto_liviano', modo: 'carga', rangoReps: [8, 12], incrementoKg: 2, musculos: ['espalda'], secundarios: ['biceps', 'hombro_posterior'], porLado: true }),
  E({ id: 'c_remo_polea', nombre: 'Remo sentado en polea', grupo: 'espalda', tipo: 'compuesto_liviano', modo: 'carga', rangoReps: [8, 12], incrementoKg: 2.5, musculos: ['espalda'], secundarios: ['biceps', 'hombro_posterior'] }),
  E({ id: 'c_remo_t', nombre: 'Remo T', grupo: 'espalda', tipo: 'compuesto_pesado', modo: 'carga', rangoReps: [6, 10], incrementoKg: 2.5, musculos: ['espalda'], secundarios: ['biceps', 'hombro_posterior'] }),
  E({ id: 'c_pullover_polea', nombre: 'Pullover en polea', grupo: 'espalda', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], incrementoKg: 2.5, musculos: ['espalda'] }),

  // Hombros (el deltoide anterior no se cuenta aparte: los press lo trabajan de sobra)
  E({ id: 'c_press_militar_barra', nombre: 'Press militar con barra', grupo: 'hombros', tipo: 'compuesto_pesado', modo: 'carga', rangoReps: [6, 10], incrementoKg: 2.5, musculos: [], secundarios: ['hombro_lateral', 'triceps'] }),
  E({ id: 'c_press_militar_mancuernas', nombre: 'Press de hombros con mancuernas', grupo: 'hombros', tipo: 'compuesto_liviano', modo: 'carga', rangoReps: [8, 12], incrementoKg: 2, musculos: [], secundarios: ['hombro_lateral', 'triceps'], nota: MANCUERNA }),
  E({ id: 'c_laterales_mancuernas', nombre: 'Elevaciones laterales con mancuernas', grupo: 'hombros', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 15], incrementoKg: 2, musculos: ['hombro_lateral'], nota: MANCUERNA }),
  E({ id: 'c_laterales_polea', nombre: 'Elevaciones laterales en polea', grupo: 'hombros', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 15], incrementoKg: 2.5, musculos: ['hombro_lateral'] }),
  E({ id: 'c_pajaros', nombre: 'Pájaros con mancuernas', grupo: 'hombros', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 15], incrementoKg: 2, musculos: ['hombro_posterior'], nota: MANCUERNA }),
  E({ id: 'c_face_pull', nombre: 'Face pull', grupo: 'hombros', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 15], incrementoKg: 2.5, musculos: ['hombro_posterior'] }),
  E({ id: 'c_posterior_maquina', nombre: 'Deltoide posterior en máquina', grupo: 'hombros', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 15], incrementoKg: 2.5, musculos: ['hombro_posterior'] }),

  // Brazos
  E({ id: 'c_curl_barra', nombre: 'Curl con barra', grupo: 'brazos', tipo: 'aislamiento', modo: 'carga', rangoReps: [8, 12], incrementoKg: 2.5, musculos: ['biceps'] }),
  E({ id: 'c_curl_mancuernas', nombre: 'Curl con mancuernas', grupo: 'brazos', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], incrementoKg: 2, musculos: ['biceps'], nota: MANCUERNA }),
  E({ id: 'c_curl_inclinado', nombre: 'Curl inclinado con mancuernas', grupo: 'brazos', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], incrementoKg: 2, musculos: ['biceps'], nota: MANCUERNA }),
  E({ id: 'c_curl_martillo', nombre: 'Curl martillo', grupo: 'brazos', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], incrementoKg: 2, musculos: ['biceps'], nota: MANCUERNA }),
  E({ id: 'c_curl_polea', nombre: 'Curl en polea', grupo: 'brazos', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], incrementoKg: 2.5, musculos: ['biceps'] }),
  E({ id: 'c_triceps_polea', nombre: 'Extensión de tríceps en polea', grupo: 'brazos', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], incrementoKg: 2.5, musculos: ['triceps'] }),
  E({ id: 'c_triceps_sobre_cabeza', nombre: 'Extensión de tríceps sobre la cabeza', grupo: 'brazos', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], incrementoKg: 2.5, musculos: ['triceps'] }),
  E({ id: 'c_rompecraneos', nombre: 'Rompecráneos', grupo: 'brazos', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], incrementoKg: 2, musculos: ['triceps'] }),
  E({ id: 'c_press_cerrado', nombre: 'Press banca agarre cerrado', grupo: 'brazos', tipo: 'compuesto_liviano', modo: 'carga', rangoReps: [8, 12], incrementoKg: 2.5, musculos: ['triceps'], secundarios: ['pecho'] }),

  // Piernas
  E({ id: 'c_sentadilla', nombre: 'Sentadilla con barra', grupo: 'piernas', tipo: 'compuesto_pesado', modo: 'carga', rangoReps: [6, 10], incrementoKg: 5, musculos: ['cuadriceps'], secundarios: ['isquios_gluteos'] }),
  E({ id: 'c_sentadilla_smith', nombre: 'Sentadilla en Smith', grupo: 'piernas', tipo: 'compuesto_pesado', modo: 'carga', rangoReps: [6, 10], incrementoKg: 5, musculos: ['cuadriceps'], secundarios: ['isquios_gluteos'] }),
  E({ id: 'c_prensa', nombre: 'Prensa', grupo: 'piernas', tipo: 'compuesto_liviano', modo: 'carga', rangoReps: [10, 15], incrementoKg: 5, musculos: ['cuadriceps'], secundarios: ['isquios_gluteos'] }),
  E({ id: 'c_sentadilla_bulgara', nombre: 'Sentadilla búlgara', grupo: 'piernas', tipo: 'compuesto_liviano', modo: 'carga', rangoReps: [8, 12], incrementoKg: 2, musculos: ['cuadriceps'], secundarios: ['isquios_gluteos'], porLado: true, nota: MANCUERNA }),
  E({ id: 'c_zancadas', nombre: 'Zancadas con mancuernas', grupo: 'piernas', tipo: 'compuesto_liviano', modo: 'carga', rangoReps: [8, 12], incrementoKg: 2, musculos: ['cuadriceps'], secundarios: ['isquios_gluteos'], porLado: true, nota: MANCUERNA }),
  E({ id: 'c_peso_muerto_rumano', nombre: 'Peso muerto rumano con barra', grupo: 'piernas', tipo: 'compuesto_pesado', modo: 'carga', rangoReps: [6, 10], incrementoKg: 5, musculos: ['isquios_gluteos'] }),
  E({ id: 'c_peso_muerto_rumano_mancuernas', nombre: 'Peso muerto rumano con mancuernas', grupo: 'piernas', tipo: 'compuesto_pesado', modo: 'carga', rangoReps: [8, 12], incrementoKg: 2.5, musculos: ['isquios_gluteos'], nota: MANCUERNA }),
  E({ id: 'c_hip_thrust', nombre: 'Hip thrust', grupo: 'piernas', tipo: 'compuesto_liviano', modo: 'carga', rangoReps: [8, 12], incrementoKg: 5, musculos: ['isquios_gluteos'] }),
  E({ id: 'c_curl_femoral', nombre: 'Curl femoral en máquina', grupo: 'piernas', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], incrementoKg: 2.5, musculos: ['isquios_gluteos'] }),
  E({ id: 'c_extension_cuadriceps', nombre: 'Extensión de cuádriceps', grupo: 'piernas', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 15], incrementoKg: 2.5, musculos: ['cuadriceps'] }),
  E({ id: 'c_gemelos_pie', nombre: 'Gemelos de pie', grupo: 'piernas', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 20], incrementoKg: 5, musculos: ['gemelos'] }),
  E({ id: 'c_gemelos_sentado', nombre: 'Gemelos sentado (sóleo)', grupo: 'piernas', tipo: 'aislamiento', modo: 'carga', rangoReps: [12, 15], incrementoKg: 2.5, musculos: ['gemelos'] }),

  // Core
  E({ id: 'c_plancha', nombre: 'Plancha', grupo: 'core', tipo: 'aislamiento', modo: 'tiempo', rangoReps: [30, 60], incrementoKg: 0, musculos: ['abdomen'] }),
  E({ id: 'c_crunch_polea', nombre: 'Crunch en polea', grupo: 'core', tipo: 'aislamiento', modo: 'carga', rangoReps: [10, 15], incrementoKg: 2.5, musculos: ['abdomen'] }),
  E({ id: 'c_elevacion_piernas', nombre: 'Elevación de piernas colgado', grupo: 'core', tipo: 'calistenia_peso_corporal', modo: 'reps', rangoReps: [8, 15], incrementoKg: 0, musculos: ['abdomen'] }),
  E({ id: 'c_rueda_abdominal', nombre: 'Rueda abdominal', grupo: 'core', tipo: 'calistenia_peso_corporal', modo: 'reps', rangoReps: [8, 12], incrementoKg: 0, musculos: ['abdomen'] }),

  // Tobillo
  E({ id: 'c_eversion_banda', nombre: 'Eversión e inversión con banda', grupo: 'tobillo', tipo: 'aislamiento', modo: 'reps', rangoReps: [15, 20], incrementoKg: 0, musculos: [], porLado: true, esProtocoloTobillo: true }),
  E({ id: 'c_equilibrio_unipodal', nombre: 'Equilibrio unipodal', grupo: 'tobillo', tipo: 'aislamiento', modo: 'tiempo', rangoReps: [30, 45], incrementoKg: 0, musculos: [], porLado: true, esProtocoloTobillo: true }),
];

export const CATALOGO_POR_ID: Record<string, EjercicioCatalogo> = Object.fromEntries(CATALOGO.map((e) => [e.id, e]));

// Copia editable de un ejercicio del catálogo para usar en una sesión.
export function desdeCatalogo(id: string, series: number, extra: Partial<EjercicioDef> = {}): EjercicioDef {
  const c = CATALOGO_POR_ID[id];
  if (!c) throw new Error(`No existe el ejercicio ${id} en el catálogo`);
  return {
    id: c.id,
    nombre: c.nombre,
    tipo: c.tipo,
    modo: c.modo,
    rangoReps: [c.rangoReps[0], c.rangoReps[1]],
    series,
    incrementoKg: c.incrementoKg,
    musculos: [...c.musculos],
    ...(c.secundarios ? { secundarios: [...c.secundarios] } : {}),
    ...(c.esProtocoloTobillo ? { esProtocoloTobillo: true } : {}),
    ...(c.porLado ? { porLado: true } : {}),
    ...(c.nota ? { nota: c.nota } : {}),
    ...extra,
  };
}

export type IdRutina = 'cuerpo_completo' | 'torso_pierna' | 'empuje_tiron_piernas' | 'hibrido';

export const RUTINAS_ESTANDAR: { id: IdRutina; nombre: string; descripcion: string }[] = [
  { id: 'cuerpo_completo', nombre: 'Cuerpo completo', descripcion: '3 sesiones de gym por semana' },
  { id: 'torso_pierna', nombre: 'Torso / Pierna', descripcion: '4 sesiones de gym por semana' },
  { id: 'empuje_tiron_piernas', nombre: 'Empuje / Tirón / Piernas', descripcion: '6 sesiones de gym por semana' },
  { id: 'hibrido', nombre: 'Híbrido', descripcion: '4 sesiones de gym y running por semana' },
];

// running: salidas por semana (null = sin running; la rutina híbrida corre igual). tobillo: incluir el protocolo.
export type OpcionesRutina = { running: Rutina['running'] | null; tobillo: boolean };

type Item = [string, number, Partial<EjercicioDef>?];

const plantilla = (id: string, nombre: string, veces: number, items: Item[]): PlantillaGym => ({
  id,
  nombre,
  vecesPorSemana: veces,
  ejercicios: items.map(([eid, series, extra]) => desdeCatalogo(eid, series, extra)),
});

// Con tobillo inestable, el sóleo pasa a ser parte del protocolo junto a la banda y el equilibrio.
const conTobillo = (tobillo: boolean, gemelosSinTobillo: Item[], seriesSoleo: number, seriesEquilibrio: number): Item[] =>
  tobillo
    ? [['c_gemelos_sentado', seriesSoleo, { esProtocoloTobillo: true }], ['c_eversion_banda', 2], ['c_equilibrio_unipodal', seriesEquilibrio]]
    : gemelosSinTobillo;

const PIERNA = (tobillo: boolean): Item[] => [
  ['c_sentadilla', 3],
  ['c_peso_muerto_rumano', 2],
  ['c_prensa', 2],
  ['c_curl_femoral', 2],
  ...conTobillo(tobillo, [['c_gemelos_pie', 2]], 2, 3),
  ['c_crunch_polea', 2],
];

// Rutinas de fábrica. Con las prioridades de cada una, el volumen semanal planificado queda dentro del rango de cada músculo.
export function construirRutina(id: IdRutina, op: OpcionesRutina): Rutina {
  const running = op.running ?? (id === 'hibrido' ? { z2: 1, calidad: 1, fondo: 1 } : { z2: 0, calidad: 0, fondo: 0 });

  if (id === 'cuerpo_completo') {
    return {
      plantillas: [
        plantilla('cuerpo_completo', 'Cuerpo completo', 3, [
          ['c_sentadilla', 3],
          ['c_press_banca_mancuernas', 3],
          ['c_remo_polea', 3],
          ['c_peso_muerto_rumano_mancuernas', 2],
          ['c_laterales_mancuernas', 3],
          ['c_curl_mancuernas', 2],
          ['c_triceps_polea', 2],
          ...conTobillo(op.tobillo, [['c_gemelos_pie', 2]], 2, 2),
          ['c_plancha', 2],
        ]),
      ],
      running,
      prioridades: { ...PRIORIDADES_BASE },
    };
  }

  if (id === 'torso_pierna') {
    return {
      plantillas: [
        plantilla('torso', 'Torso', 2, [
          ['c_press_banca', 3],
          ['c_press_inclinado_mancuernas', 2],
          ['c_remo_barra', 3],
          ['c_jalon_pecho', 3],
          ['c_laterales_polea', 4],
          ['c_face_pull', 2],
          ['c_curl_mancuernas', 2],
          ['c_triceps_polea', 2],
        ]),
        plantilla('pierna', 'Pierna', 2, PIERNA(op.tobillo)),
      ],
      running,
      prioridades: { ...PRIORIDADES_BASE },
    };
  }

  if (id === 'empuje_tiron_piernas') {
    return {
      plantillas: [
        plantilla('empuje', 'Empuje', 2, [
          ['c_press_banca', 3],
          ['c_press_inclinado_mancuernas', 2],
          ['c_press_militar_mancuernas', 2],
          ['c_laterales_mancuernas', 3],
          ['c_triceps_polea', 2],
        ]),
        plantilla('tiron', 'Tirón', 2, [
          ['c_jalon_pecho', 3],
          ['c_remo_barra', 3],
          ['c_face_pull', 2],
          ['c_curl_mancuernas', 2],
        ]),
        plantilla('piernas', 'Piernas', 2, PIERNA(op.tobillo)),
      ],
      running,
      prioridades: { ...PRIORIDADES_BASE },
    };
  }

  // Híbrido: espalda amplia y hombros anchos con piernas atléticas, junto a 3 salidas de running.
  return {
    plantillas: [
      plantilla('empuje', 'Empuje', 1, [
        ['c_press_inclinado_mancuernas', 3],
        ['c_press_maquina_pecho', 3],
        ['c_pec_deck', 2],
        ['c_rompecraneos', 3],
        ['c_triceps_polea', 3],
        ['c_pajaros', 4],
        ['c_laterales_polea', 4],
      ]),
      plantilla('tiron', 'Tirón', 1, [
        ['c_remo_t', 3],
        ['c_jalon_pecho', 3],
        ['c_pullover_polea', 3],
        ['c_curl_inclinado', 3],
        ['c_curl_martillo', 3],
        ['c_laterales_polea', 4],
      ]),
      plantilla('piernas', 'Piernas', 1, [
        ['c_sentadilla_smith', 3],
        ['c_peso_muerto_rumano_mancuernas', 3],
        ['c_prensa', 3],
        ['c_curl_femoral', 3],
        ['c_extension_cuadriceps', 3],
        ['c_crunch_polea', 2],
        ...(op.tobillo ? ([['c_gemelos_pie', 2]] as Item[]) : []),
        ...conTobillo(op.tobillo, [['c_gemelos_pie', 4]], 3, 3),
      ]),
      plantilla('calistenia', 'Calistenia', 1, [
        ['c_dominada_prona', 3],
        ['c_fondos', 3, { pesoInicial: 0 }],
        ['c_dominada_supina', 3, { pesoInicial: 0 }],
        ['c_flexiones', 3, { pesoInicial: 0 }],
        ['c_curl_mancuernas', 2],
        ['c_triceps_sobre_cabeza', 2],
        ['c_laterales_mancuernas', 4],
        ['c_face_pull', 3],
        ['c_plancha', 2],
      ]),
    ],
    running,
    prioridades: { ...PRIORIDADES_BASE, espalda: 'alta', hombro_lateral: 'alta', hombro_posterior: 'media' },
  };
}
