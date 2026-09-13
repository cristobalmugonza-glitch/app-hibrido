// Modelo de datos (versión 2). Todo lo que el usuario puede cambiar vive en Datos;
// la lógica del motor nunca asume nombres de ejercicios, de bloques ni de días.

export type Sexo = 'hombre' | 'mujer';
export type Objetivo = 'perder_grasa' | 'mantener' | 'ganar_musculo';

export type Perfil = {
  sexo: Sexo;
  edad?: number;
  altura: number; // cm
  pesoInicial: number; // kg
  fcMax: number;
  fechaInicio: string; // YYYY-MM-DD
  objetivo: Objetivo;
  caloriasObjetivo: number;
  proteinaObjetivo: number; // g/día
  grasaObjetivo: number; // g/día
  pisoKcal: number; // la calibración nunca propone bajar de acá
  topeKmSemanal: number;
  topeFondoKm: number;
  fondoKmInicial: number;
  z2Km: number;
  ritmoSemillaSegKm: number; // se usa hasta que exista un test de 8 km
};

export type TipoEjercicio = 'compuesto_pesado' | 'compuesto_liviano' | 'aislamiento' | 'calistenia_peso_corporal';

// carga: peso × reps (en calistenia, peso = lastre extra)
// reps: solo repeticiones (banda elástica, peso corporal sin lastre)
// tiempo: segundos (equilibrio, plancha)
export type ModoRegistro = 'carga' | 'reps' | 'tiempo';

export type Musculo =
  | 'pecho'
  | 'espalda'
  | 'hombro_lateral'
  | 'hombro_posterior'
  | 'biceps'
  | 'triceps'
  | 'cuadriceps'
  | 'isquios_gluteos'
  | 'gemelos'
  | 'abdomen';

export type Prioridad = 'alta' | 'media' | 'mantencion';

// Un ejercicio dentro de una sesión. El id identifica su historial: el mismo ejercicio del catálogo
// en dos sesiones distintas comparte progresión.
export type EjercicioDef = {
  id: string;
  nombre: string;
  tipo: TipoEjercicio;
  modo: ModoRegistro;
  rangoReps: [number, number]; // en modo tiempo: segundos
  series: number;
  incrementoKg: number;
  musculos: Musculo[]; // cuentan 1 serie
  secundarios?: Musculo[]; // cuentan 0,5 serie
  pesoInicial?: number; // undefined = por confirmar
  esProtocoloTobillo?: boolean;
  porLado?: boolean;
  nota?: string;
};

export type PlantillaGym = { id: string; nombre: string; ejercicios: EjercicioDef[]; vecesPorSemana: number };

export type TipoRunning = 'z2' | 'calidad' | 'fondo';

export type RefBloque = { clase: 'gym'; plantillaId: string } | { clase: 'running'; tipo: TipoRunning };

export type Rutina = {
  plantillas: PlantillaGym[];
  running: Record<TipoRunning, number>; // veces por semana
  prioridades: Record<Musculo, Prioridad>;
};

export type TipoSemana = 'carga' | 'descarga';

// Se guarda al empezar cada semana: fija su tipo y cuántas sesiones había planificadas en ese momento.
export type PlanSemana = { inicio: string; tipo: TipoSemana; sesiones: number; manual?: boolean };

export type SerieRegistrada = { peso: number; reps: number; alFallo?: boolean };

export type EjercicioRegistrado = {
  ejercicioId: string;
  nombre: string;
  // Copia de los músculos al momento de entrenar: el volumen histórico no cambia si editas la rutina.
  musculos?: Musculo[];
  secundarios?: Musculo[];
  series: SerieRegistrada[];
  notas?: string;
};

export type SesionGym = {
  id: string;
  fecha: string; // ISO con hora
  plantillaId: string;
  nombre: string;
  descarga: boolean;
  ejercicios: EjercicioRegistrado[];
};

export type SesionRunning = {
  id: string;
  fecha: string;
  tipo: TipoRunning | 'test';
  distanciaKm: number;
  duracionMin: number;
  fcPromedio: number;
  fcMaxima?: number;
  equilibrioHecho?: boolean;
  notas?: string;
};

export type RegistroPeso = { fecha: string; peso: number };

export type ZonaMolestia = 'tobillo' | 'rodilla' | 'cadera' | 'espalda' | 'hombro' | 'otro';
export type Molestia = { fecha: string; zona: ZonaMolestia; intensidad: 1 | 2 | 3; nota?: string };

// Medidas y estimación Navy van juntas: con cuello + cintura se calcula el % de grasa.
export type Medidas = {
  fecha: string;
  cintura: number;
  cuello?: number;
  cadera?: number;
  hombros?: number;
  brazo?: number;
  muslo?: number;
  grasaNavy?: number;
  fotoTomada?: boolean;
};

export type BenchmarkDominadas = { fecha: string; lastreKg: number; reps: number };

export type EntrenoHoy = { fecha: string; hora: string | null; ayunoRoto: boolean };

export type BorradorGym = { sesion: SesionGym; indiceEjercicio: number };

export type Datos = {
  version: 2;
  perfil: Perfil;
  rutina: Rutina;
  ejerciciosPropios: EjercicioDef[]; // biblioteca propia, disponible para cualquier sesión
  planes: PlanSemana[];
  mesociclosPrevios: number; // bloques completados antes de que existiera el plan semanal
  ultimoAjusteKcal?: string; // ISO; la calibración espera 2 semanas después de un ajuste
  sesionesGym: SesionGym[];
  sesionesRunning: SesionRunning[];
  pesos: RegistroPeso[];
  molestias: Molestia[];
  medidas: Medidas[];
  dominadas: BenchmarkDominadas[];
  entrenoHoy?: EntrenoHoy;
  borradorGym?: BorradorGym;
};
