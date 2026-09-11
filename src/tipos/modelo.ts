// Modelo de datos. Todo lo que el usuario puede cambiar vive en Datos;
// la lógica del motor nunca asume nombres de ejercicios ni de días.

export type Sexo = 'hombre' | 'mujer';

export type Perfil = {
  sexo: Sexo;
  altura: number; // cm
  pesoInicial: number; // kg
  fcMax: number;
  fechaInicio: string; // YYYY-MM-DD
  caloriasObjetivo: number;
  proteinaObjetivo: number; // g/día
  grasaObjetivo: number; // g/día
  topeKmSemanal: number;
  topeFondoKm: number;
  fondoKmInicial: number;
  z2Km: number;
  ritmoSemillaSegKm: number; // se usa hasta que exista un test de 8 km
};

export type TipoEjercicio =
  | 'compuesto_pesado'
  | 'compuesto_liviano'
  | 'aislamiento'
  | 'calistenia_peso_corporal';

// carga: peso × reps (en calistenia, peso = lastre extra)
// reps: solo repeticiones (banda elástica)
// tiempo: segundos (equilibrio)
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
  | 'gemelos';

export type Prioridad = 'alta' | 'media' | 'mantencion';

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

export type PlantillaGym = { id: string; nombre: string; ejercicios: EjercicioDef[] };

export type TipoRunning = 'z2' | 'calidad' | 'fondo';

export type PasoSecuencia =
  | { id: string; clase: 'gym'; plantillaId: string }
  | { id: string; clase: 'running'; tipo: TipoRunning }
  | { id: string; clase: 'libre' };

export type Rutina = {
  plantillas: PlantillaGym[];
  secuencia: PasoSecuencia[];
  prioridades: Record<Musculo, Prioridad>;
};

export type EstadoCola = { posicion: number; vueltasCompletadas: number };

export type RegistroCola = {
  fecha: string; // ISO con hora
  pasoId: string;
  estado: 'hecha' | 'saltada';
  sesionId?: string;
};

export type SerieRegistrada = { peso: number; reps: number; alFallo?: boolean };

export type EjercicioRegistrado = {
  ejercicioId: string;
  nombre: string;
  series: SerieRegistrada[];
  notas?: string;
};

export type SesionGym = {
  id: string;
  fecha: string; // ISO con hora
  plantillaId: string;
  nombre: string;
  ciclo: number;
  vuelta: number;
  descarga: boolean;
  planificada: boolean;
  ejercicios: EjercicioRegistrado[];
};

export type SesionRunning = {
  id: string;
  fecha: string;
  tipo: TipoRunning | 'test';
  ciclo: number;
  vuelta: number;
  planificada: boolean;
  distanciaKm: number;
  duracionMin: number;
  fcPromedio: number;
  fcMaxima?: number;
  equilibrioHecho?: boolean;
  notas?: string;
};

export type RegistroPeso = { fecha: string; peso: number };

export type ZonaMolestia = 'tobillo_der' | 'rodilla' | 'cadera' | 'otro';
export type Molestia = { fecha: string; zona: ZonaMolestia; intensidad: 1 | 2 | 3; nota?: string };

// Medidas y estimación Navy van juntas: con cuello + cintura se calcula el % de grasa.
export type Medidas = {
  fecha: string;
  ciclo: number;
  cintura: number;
  cuello?: number;
  cadera?: number;
  hombros?: number;
  brazo?: number;
  muslo?: number;
  grasaNavy?: number;
  fotoTomada?: boolean;
};

export type BenchmarkDominadas = { fecha: string; ciclo: number; lastreKg: number; reps: number };

export type EntrenoHoy = { fecha: string; hora: string | null; ayunoRoto: boolean };

export type BorradorGym = {
  sesion: SesionGym;
  pasoId: string | null; // null = sesión no planificada
  indiceEjercicio: number;
};

export type Datos = {
  version: 1;
  perfil: Perfil;
  rutina: Rutina;
  cola: EstadoCola;
  historialCola: RegistroCola[];
  sesionesGym: SesionGym[];
  sesionesRunning: SesionRunning[];
  pesos: RegistroPeso[];
  molestias: Molestia[];
  medidas: Medidas[];
  dominadas: BenchmarkDominadas[];
  entrenoHoy?: EntrenoHoy;
  borradorGym?: BorradorGym;
};
