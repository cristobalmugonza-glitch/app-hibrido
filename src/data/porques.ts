import type { Tema } from './referencias';

export type Etiqueta = 'limitada' | 'discusion';

export const NOMBRE_ETIQUETA: Record<Etiqueta, string> = {
  limitada: 'Práctica común, evidencia limitada',
  discusion: 'Evidencia en discusión',
};

export type PorQue = { id: string; tema: Tema; titulo: string; texto: string[]; refs: string[]; etiqueta?: Etiqueta };

const P = (p: PorQue) => p;

export const PORQUES_LISTA: PorQue[] = [
  // Cómo está armada la app
  P({
    id: 'secuencia', tema: 'estructura', titulo: 'Por qué este orden de sesiones', etiqueta: 'limitada',
    texto: [
      'La app no usa días de la semana: sigue una cola de sesiones que avanza solo cuando completas o saltas una. Si pasan 5 días sin entrenar, retomas donde quedaste.',
      'Piernas queda lejos de las carreras de impacto (Z2 dos sesiones después, calidad cuatro, fondo seis), para que el tobillo llegue recuperado al estímulo más exigente. Empuje y calistenia quedan a 4 sesiones, y tirón y calistenia a 2: si entrenas ~1 vez al día, cada músculo tiene 48–72 h entre estímulos.',
      'Con el mismo volumen semanal, la frecuencia casi no cambia la hipertrofia. Entrenar cada músculo 2 veces por vuelta sirve para repartir las series sin sesiones eternas. El orden exacto es criterio práctico, no algo medido en un ensayo.',
    ],
    refs: ['schoenfeld2019frec', 'pelland2026', 'schoenfeld2016frec'],
  }),
  P({
    id: 'sesion_doble', tema: 'estructura', titulo: 'Dos sesiones el mismo día',
    texto: [
      'Puedes hacer dos sesiones seguidas de la cola el mismo día. En 43 estudios, combinar aeróbico y fuerza no perjudicó la hipertrofia ni la fuerza máxima, fuera en la misma sesión, el mismo día o días distintos.',
      'Solo se atenuó la fuerza explosiva, y más cuando ambas sesiones quedaron a menos de 3 h. Tu objetivo no es potencia, así que no es una preocupación central.',
      'Si puedes, sepáralas al menos 3 h. Si quedan juntas, haz fuerza primero: en la misma sesión, ese orden mejoró la fuerza de piernas (~7 %) sin cambiar la hipertrofia.',
    ],
    refs: ['schumann2022', 'eddens2018'],
  }),
  P({
    id: 'descarga', tema: 'estructura', titulo: 'Vuelta de descarga', etiqueta: 'limitada',
    texto: [
      'De cada 4 vueltas, la cuarta es de descarga: mismo peso, mitad de series, sin fallo, y running al 60 % del volumen.',
      'Los expertos coinciden en que una descarga reduce la fatiga y te prepara para el siguiente bloque. La receta exacta (mitad de series, 60 % de km) es práctica común, no una cifra probada en ensayos.',
    ],
    refs: ['bell2023', 'moesgaard2022'],
  }),

  // Fuerza
  P({
    id: 'doble_progresion', tema: 'fuerza', titulo: 'Doble progresión',
    texto: [
      'Primero sumas repeticiones con el mismo peso. Cuando completas todas las series en el tope del rango, subes el peso y vuelves al mínimo.',
      'Es lo que recomienda el ACSM: subir la carga 2–10 % cuando superas el objetivo por 1–2 repeticiones.',
      'La hipertrofia se logra en un rango amplio de cargas si las series quedan cerca del fallo; la fuerza máxima se beneficia más de cargas altas. Por eso los compuestos pesados van en 6–10.',
    ],
    refs: ['acsm2009', 'schoenfeld2017carga'],
  }),
  P({
    id: 'primera_vez', tema: 'fuerza', titulo: 'Primera vez con un ejercicio',
    texto: [
      'Sin historial no hay de dónde sacar una sugerencia honesta. Registra lo que hagas hoy (peso × reps) y desde la próxima sesión la app aplica la doble progresión.',
      'Elige un peso con el que llegues al rango dejando 1–2 repeticiones en reserva.',
    ],
    refs: ['acsm2009'],
  }),
  P({
    id: 'bajar_10', tema: 'fuerza', titulo: 'Bajar 10 % y reconstruir', etiqueta: 'limitada',
    texto: [
      'Si en dos sesiones seguidas no llegas al mínimo del rango, ese peso está sobre tu capacidad de hoy (fatiga, déficit, sueño). Bajar ~10 % te devuelve al rango para progresar desde ahí.',
      'En déficit calórico la fuerza suele mantenerse, pero la ganancia de masa magra se frena, así que un retroceso puntual es esperable. El 10 % es práctica común.',
    ],
    refs: ['murphy2022', 'acsm2009'],
  }),
  P({
    id: 'tecnica', tema: 'fuerza', titulo: 'Bajada controlada y reps en reserva', etiqueta: 'limitada',
    texto: [
      'Baja en 2–3 s y sube sin rebote. La hipertrofia es similar con repeticiones de 0,5 a 8 s, así que el tempo sirve para controlar la técnica, no para crecer más.',
      'Deja 1–2 repeticiones en reserva. Llegar al fallo no fue superior a quedarse cerca, pero terminar las series cerca del fallo sí favorece la hipertrofia.',
      'Fallo real solo en la última serie de aislamiento (o de calistenia sin lastre); nunca en compuestos pesados, donde pesan más la fatiga y el riesgo técnico.',
      'Ser más fuerte bajando que subiendo es normal: en la fase excéntrica se manejan cargas mayores. La regla de tempo no cambia por eso.',
    ],
    refs: ['schoenfeld2015tempo', 'refalo2023', 'robinson2024', 'roig2009'],
  }),
  P({
    id: 'descanso_pesado', tema: 'fuerza', titulo: 'Descanso de 2–3 min en compuestos pesados',
    texto: [
      'Descansar más de 60 s da un beneficio pequeño en hipertrofia, probablemente porque sostienes más repeticiones por serie. Pasados los 90 s casi no cambia.',
      'En compuestos pesados se usan 2–3 min para rendir con cargas altas en todas las series; para fuerza máxima el ACSM recomienda descansos largos.',
    ],
    refs: ['singer2024', 'grgic2017', 'acsm2009'],
  }),
  P({
    id: 'descanso_general', tema: 'fuerza', titulo: 'Descanso en aislamiento y calistenia',
    texto: [
      '60–90 s en aislamiento; 90 s–2 min en compuestos livianos y calistenia. Sobre 60 s hay un beneficio pequeño; sobre 90 s la hipertrofia casi no cambia.',
    ],
    refs: ['singer2024', 'grgic2017'],
  }),
  P({
    id: 'incremento', tema: 'fuerza', titulo: 'Saltos grandes de carga',
    texto: [
      'El ACSM sugiere subir 2–10 % por vez. Con mancuernas livianas, el menor salto disponible puede ser 15–20 %.',
      'Si al subir no llegas al mínimo del rango, vuelve al peso anterior y suma repeticiones, o ajusta el incremento del ejercicio en Ajustes.',
    ],
    refs: ['acsm2009'],
  }),
  P({
    id: 'volumen', tema: 'fuerza', titulo: 'Series por músculo',
    texto: [
      'Más series semanales por músculo dan más hipertrofia, con rendimientos decrecientes. En hombres jóvenes entrenados, 12–20 series semanales aparece como un rango razonable (prioridad alta).',
      'La app cuenta 1 serie para el músculo principal y 0,5 para los secundarios; por ejemplo, el remo cuenta medio para bíceps. Ese conteo fue el que mejor predijo resultados en el metaanálisis más grande disponible.',
      'Mantener cuesta mucho menos: en adultos jóvenes, 1/3 del volumen conservó la hipertrofia. Los rangos "media" (8–14) y "mantención" (4–8) son interpolaciones prácticas.',
    ],
    refs: ['schoenfeld2017vol', 'bazvalle2022', 'pelland2026', 'bickel2011'],
  }),

  // Tobillo
  P({
    id: 'tobillo_protocolo', tema: 'tobillo', titulo: 'Protocolo de tobillo obligatorio',
    texto: [
      'Tu tobillo derecho se trata como una capacidad a construir, no como una zona a evitar. El entrenamiento de equilibrio redujo el riesgo de esguince, con más efecto en quienes ya habían tenido uno, y un programa de 8 semanas bajó 35 % las recurrencias.',
      'La fuerza también cuenta: en tobillos inestables, protocolos de fuerza mejoraron la fuerza (incluida la eversión), el equilibrio y la función.',
      'Los ensayos partieron después de esguinces recientes; el tuyo es antiguo, así que es una extrapolación razonable. Por eso piernas no se cierra sin sóleo, banda y equilibrio.',
    ],
    refs: ['mckeon2008', 'hupperets2009', 'doherty2017', 'hall2018'],
  }),
  P({
    id: 'tobillo_frecuencia', tema: 'tobillo', titulo: 'Equilibrio antes de cada carrera', etiqueta: 'limitada',
    texto: [
      'Los programas que funcionaron se hacían 3 veces por semana (20–30 min por sesión). Solo una vez por vuelta, en piernas, se queda corto.',
      'Por eso cada carrera parte con 2 × 30 s de equilibrio por lado: 2 minutos que suman 4 estímulos por vuelta. La dosis exacta es práctica común; la frecuencia sale de los ensayos.',
    ],
    refs: ['hupperets2009', 'hall2018'],
  }),
  P({
    id: 'tobillo_alerta', tema: 'tobillo', titulo: 'Ajustes por molestia de tobillo', etiqueta: 'limitada',
    texto: [
      'Con 2 molestias de intensidad 2 o más en 7 días, la app baja 20 % el running y mantiene el equilibrio y la fuerza: la idea es fortalecer, no solo descansar.',
      'Con intensidad 3, la sesión de calidad pasa a Z2 y conviene revisar si subiste la carga de golpe.',
      'Los umbrales (2 molestias, −20 %) son práctica común. Lo que tiene respaldo es que el trabajo neuromuscular y de fuerza protege el tobillo.',
    ],
    refs: ['doherty2017', 'hall2018'],
  }),

  // Running
  P({
    id: 'zonas_fc', tema: 'running', titulo: 'Zonas de frecuencia cardíaca', etiqueta: 'limitada',
    texto: [
      'Las zonas salen de tu FC máxima: Z1 60–65 %, Z2 65–75 %, Z3 75–82 %, Z4 82–89 % y Z5 89–100 %.',
      'Calcular zonas por porcentaje de la FC máxima es práctico, pero menos preciso que un test de laboratorio. Si el ritmo guía y la FC no calzan, manda la FC.',
      'La mayor parte del running va en Z2: los atletas de resistencia exitosos hacen ~80 % de sus sesiones a baja intensidad. Eso viene de atletas de élite; aplicarlo a ti es extrapolación.',
    ],
    refs: ['seiler2010'],
  }),
  P({
    id: 'ritmos_test', tema: 'running', titulo: 'Ritmos desde tu test de 8 km', etiqueta: 'limitada',
    texto: [
      'Los ritmos salen de tu último test de 8 km a 145 lpm: Z2 al ritmo del test, fondo 10–20 s más lento, tempo 45–60 s más rápido, 1000 m 65–80 s y 800 m 75–90 s más rápidos.',
      'Sin test, la app usa el ritmo semilla (Ajustes). Son ritmos guía derivados de práctica común.',
    ],
    refs: [],
  }),
  P({
    id: 'calidad', tema: 'running', titulo: 'Sesión de calidad', etiqueta: 'limitada',
    texto: [
      'La calidad rota sola en cada ciclo: fartlek, luego 800 m, luego 1000 m. Varías el estímulo sin subir el volumen al mismo tiempo.',
      'Tres palancas, nunca las tres a la vez: densidad aeróbica (la principal), calidad y volumen (último recurso).',
    ],
    refs: ['seiler2010'],
  }),
  P({
    id: 'fondo_progresion', tema: 'running', titulo: 'Fondo largo', etiqueta: 'discusion',
    texto: [
      'El fondo sube 1 km cada 2 ciclos, con tope en 18 km. Es la palanca que menos se toca porque es la que más carga el tobillo.',
      'La "regla del 10 %" no redujo lesiones en novatos, y los aumentos de más de 30 % mostraron una señal no concluyente de más lesiones por distancia. Subir poco y de a poco es la opción prudente.',
    ],
    refs: ['buist2008', 'nielsen2014'],
  }),
  P({
    id: 'tope_km', tema: 'running', titulo: 'Tope de km semanales', etiqueta: 'limitada',
    texto: [
      'Sobre tu tope sube el impacto acumulado en el tobillo y la interferencia con la hipertrofia: la interferencia creció con la frecuencia y la duración del aeróbico, y fue más clara al correr que al pedalear.',
      'El número es tu tope personal, no una cifra de un estudio. La alerta informa, no bloquea.',
    ],
    refs: ['wilson2012', 'lundberg2022', 'schumann2022'],
  }),
  P({
    id: 'salto_carga', tema: 'carga_lesion', titulo: 'Saltos de carga', etiqueta: 'discusion',
    texto: [
      'Subir el volumen de golpe se asocia a más lesiones en estudios observacionales, y las cargas altas construidas de a poco parecen proteger.',
      'La fórmula del ratio carga aguda:crónica fue criticada con fuerza: tiene problemas estadísticos y no hay evidencia de que manejarla reduzca lesiones. La app usa un umbral simple (+30 % frente a tus 4 semanas previas) solo como aviso.',
    ],
    refs: ['gabbett2016', 'impellizzeri2020', 'nielsen2014'],
  }),
  P({
    id: 'densidad_aerobica', tema: 'running', titulo: 'Ritmo a FC constante', etiqueta: 'limitada',
    texto: [
      'Si a la misma FC (Z2 o menos) corres más rápido, tu motor aeróbico mejoró. Es la palanca principal: progresas sin sumar kilómetros ni impacto.',
      'El calor, el sueño y el desnivel mueven la FC; mira la tendencia de varias semanas, no una sesión.',
    ],
    refs: [],
  }),

  // Nutrición
  P({
    id: 'proteina', tema: 'nutricion', titulo: 'Proteína',
    texto: [
      'Para quien entrena se recomiendan 1,4–2,0 g/kg al día; en condiciones normales, sobre ~1,6 g/kg no se vio más ganancia de masa magra.',
      'En déficit las necesidades suben: en atletas magros se estiman 2,3–3,1 g por kg de masa libre de grasa. Con una estimación de grasa, la app te muestra ese rango.',
    ],
    refs: ['jager2017', 'morton2018', 'helms2014prot'],
  }),
  P({
    id: 'grasa', tema: 'nutricion', titulo: 'Grasa y su piso', etiqueta: 'limitada',
    texto: [
      'Se recomienda que 15–30 % de las calorías venga de grasa. Las dietas bajas en grasa bajaron la testosterona en hombres.',
      'El piso de 0,8 g/kg es práctica común: la evidencia respalda tener un piso, no ese número exacto.',
    ],
    refs: ['helms2014prep', 'whittaker2021'],
  }),
  P({
    id: 'calibracion', tema: 'nutricion', titulo: 'Calibración de calorías', etiqueta: 'limitada',
    texto: [
      'La app promedia tus pesajes de cada semana (idealmente 3, en ayunas), porque el peso diario varía por agua y comida.',
      'La meta es bajar 0,35–0,5 kg por semana. En atletas, bajar ~0,7 % por semana permitió ganar masa magra y fuerza, y bajar el doble de rápido no; los déficits grandes y sostenidos frenan la masa magra.',
      'Si en 3 semanas no bajas (menos de 0,1 kg por semana) propone −150 kcal; si bajas más de 0,6 kg por semana dos semanas seguidas, +150. Nunca propone menos de 1.900 kcal: si llegas ahí, sugiere una pausa. Los umbrales son práctica común.',
    ],
    refs: ['helms2014prep', 'garthe2011', 'murphy2022'],
  }),
  P({
    id: 'pausa', tema: 'nutricion', titulo: 'Pausa de mantención', etiqueta: 'limitada',
    texto: [
      'En personas entrenadas en déficit, intercalar días con más carbohidrato conservó mejor la masa libre de grasa y el metabolismo en reposo que un déficit continuo.',
      'Una pausa de 1–2 semanas en mantención es una forma práctica de aplicarlo; la duración exacta no está bien estudiada.',
    ],
    refs: ['campbell2020'],
  }),
  P({
    id: 'ritmo_perdida', tema: 'nutricion', titulo: 'Ritmo de pérdida',
    texto: [
      'Perder 0,5–1 % del peso por semana ayuda a retener músculo, y en atletas el ritmo lento conservó más masa magra que el rápido.',
      'Sobre 0,8 kg por semana sostenido, el riesgo de perder masa magra sube: conviene comer un poco más.',
    ],
    refs: ['helms2014prep', 'garthe2011'],
  }),
  P({
    id: 'reparto_proteina', tema: 'nutricion', titulo: 'Proteína repartida',
    texto: [
      'Reparte la proteína en al menos 3 comidas, nunca en una sola. Se sugieren ~0,4 g/kg por comida (hasta ~0,55 g/kg), cada 3–4 h.',
      'Comidas más grandes no botan la proteína extra, pero concentrarla en una sola comida desaprovecha estímulos.',
    ],
    refs: ['schoenfeld2018prot', 'kerksick2017', 'jager2017'],
  }),
  P({
    id: 'ayuno_flexible', tema: 'nutricion', titulo: 'Ventana de ayuno flexible',
    texto: [
      'El ayuno con horario (por ejemplo 16/8) junto con fuerza en general mantuvo la masa magra y bajó grasa en hombres entrenados. Los estudios son cortos y pequeños; lo que más pesa sigue siendo el total de calorías y proteína.',
      'Por eso la ventana no tiene hora fija: se acomoda a tu entreno. Entrenar en ayunas no cambió la pérdida de grasa en un ensayo, aunque fue en mujeres jóvenes y con cardio suave.',
    ],
    refs: ['moro2016', 'keenan2020', 'schoenfeld2014ayuno'],
  }),
  P({
    id: 'pre_entreno', tema: 'nutricion', titulo: 'Comer alrededor del entreno', etiqueta: 'limitada',
    texto: [
      'Proteína, con o sin carbohidrato, antes y/o después de entrenar es una estrategia efectiva. Cuánto importa la comida posterior depende del tamaño y la hora de la anterior.',
      'Los 60–90 min antes y la primera hora después son práctica común para tolerarlo bien, no ventanas estrictas: el efecto del entreno dura al menos 24 h.',
    ],
    refs: ['kerksick2017', 'jager2017'],
  }),

  // Composición
  P({
    id: 'navy', tema: 'composicion', titulo: 'Estimación Navy',
    texto: [
      'Usa cuello, cintura y altura (en mujeres, también cadera) con la ecuación de Hodgdon y Beckett, validada contra pesaje hidrostático en personal de la Armada de EE.UU.',
      'Tiene un margen de ±3–4 puntos: un 17 % puede ser 14 % o 21 %. La tendencia en el tiempo, medida siempre igual, importa más que el número.',
      'Mide el cuello justo bajo la nuez y la cintura a la altura del ombligo, relajado y en la mañana.',
    ],
    refs: ['hodgdon1984'],
  }),
  P({
    id: 'ace', tema: 'composicion', titulo: 'Categorías de referencia', etiqueta: 'limitada',
    texto: [
      'Las categorías (esencial, atletas, fitness, promedio, obesidad) vienen de una tabla del American Council on Exercise. Sirven para entender el número; no son un estudio revisado por pares.',
    ],
    refs: [],
  }),
  P({
    id: 'abdomen', tema: 'composicion', titulo: 'Abdomen visible', etiqueta: 'limitada',
    texto: [
      'La marcación abdominal es un espectro, no un número mágico. En hombres, entre 18 y 24 % normalmente no se ve aunque no haya grasa excesiva; el contorno suele notarse alrededor de 14–17 % y el six-pack marcado cerca de 10–14 %.',
      'Estar en ese rango sin ver el abdomen no tiene nada de contradictorio. Influyen la genética (dónde acumulas grasa) y la forma del recto abdominal, pero la palanca principal sigue siendo bajar el porcentaje.',
    ],
    refs: [],
  }),
];

export const PORQUES: Record<string, PorQue> = Object.fromEntries(PORQUES_LISTA.map((p) => [p.id, p]));
