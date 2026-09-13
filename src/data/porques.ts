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
    id: 'bloques_libres', tema: 'estructura', titulo: 'Eliges tu bloque cada día',
    texto: [
      'No hay una cola fija: cada día eliges qué bloque entrenar y la app lleva la cuenta de la semana. Para crecer manda el volumen semanal por músculo, no el día en que cae cada sesión: con el mismo volumen semanal, entrenar un músculo 1 o 2 veces por semana dio una hipertrofia similar.',
      'La sugerencia del día elige entre lo que te queda pendiente y descarta lo que choca con tu recuperación (un músculo cargado hace menos de 48 h, o piernas pesadas justo antes de una carrera exigente). Ese orden es criterio práctico, no algo medido en ensayos.',
    ],
    refs: ['schoenfeld2019frec', 'pelland2026'],
  }),
  P({
    id: 'recuperacion', tema: 'estructura', titulo: 'Recuperación entre sesiones', etiqueta: 'limitada',
    texto: [
      'La app avisa si un bloque carga músculos que entrenaste con 3 series o más hace menos de 48 h, o si juntas dos carreras exigentes con menos de 24 h entre ellas.',
      'Esos umbrales son práctica común de entrenadores, no cifras probadas en ensayos. El aviso informa: si te sientes bien, puedes entrenar igual.',
    ],
    refs: [],
  }),
  P({
    id: 'sesion_doble', tema: 'estructura', titulo: 'Dos sesiones el mismo día',
    texto: [
      'Puedes hacer dos bloques el mismo día. En 43 estudios, combinar aeróbico y fuerza no perjudicó la hipertrofia ni la fuerza máxima, fuera en la misma sesión, el mismo día o días distintos.',
      'Solo se atenuó la fuerza explosiva, y más cuando ambas sesiones quedaron a menos de 3 h.',
      'Si puedes, sepáralas al menos 3 h. Si quedan juntas, haz fuerza primero: en la misma sesión, ese orden mejoró la fuerza de piernas (~7 %) sin cambiar la hipertrofia.',
    ],
    refs: ['schumann2022', 'eddens2018'],
  }),
  P({
    id: 'descarga', tema: 'estructura', titulo: 'Semana de descarga', etiqueta: 'limitada',
    texto: [
      'En la semana de descarga mantienes el peso, haces la mitad de las series sin llegar al fallo y corres el 60 % de los km. Es un período de menos estrés para bajar la fatiga y llegar mejor al siguiente bloque.',
      'Atletas de fuerza y físico reportan descargar cada ~5–6 semanas, reduciendo series y repeticiones pero no la frecuencia. Parar por completo una semana no quitó músculo, aunque frenó algo la ganancia de fuerza; por eso acá se reduce el volumen en vez de parar.',
      'La receta exacta (mitad de series, 60 % de los km) es práctica común, no una cifra probada en ensayos.',
    ],
    refs: ['bell2023', 'rogerson2024', 'coleman2024'],
  }),
  P({
    id: 'cuando_descargar', tema: 'estructura', titulo: 'Cuándo toca descarga', etiqueta: 'limitada',
    texto: [
      'Después de 3 semanas de carga seguidas, la cuarta es de descarga: bloques de 4 semanas, algo más frecuentes que las ~5–6 semanas que reportan atletas avanzados.',
      'Se adelanta si 2 ejercicios o más llevan dos sesiones seguidas bajo su rango: estancarse es una de las razones más comunes para descargar.',
      'Una semana en que hiciste menos de la mitad de las sesiones cuenta como descanso y reinicia el bloque: ya bajaste el estrés.',
    ],
    refs: ['rogerson2024', 'bell2023'],
  }),
  P({
    id: 'adherencia', tema: 'estructura', titulo: 'Un plan que sí cumples', etiqueta: 'limitada',
    texto: [
      'Si dos semanas seguidas haces menos del 70 % de las sesiones planificadas, la app propone sacar el bloque que menos haces. Con el mismo volumen semanal la frecuencia casi no cambia la hipertrofia: conviene mover esas series a los días que sí entrenas.',
      'Al sacar un bloque, la proyección siguiente te propone dónde reponer las series que falten. El umbral de 70 % es práctica común.',
    ],
    refs: ['schoenfeld2019frec', 'pelland2026'],
  }),
  P({
    id: 'benchmarks', tema: 'estructura', titulo: 'Cada cuánto medir', etiqueta: 'limitada',
    texto: [
      'Medidas y foto cada 4 semanas; test de 8 km y dominadas con lastre cada 8. Son frecuencias prácticas: dan tiempo a que haya cambios reales y no ruido de un día.',
      'Mide siempre en las mismas condiciones (hora, ayuno, calentamiento). La tendencia importa más que un número suelto.',
    ],
    refs: [],
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
    texto: ['60–90 s en aislamiento; 90 s–2 min en compuestos livianos y calistenia. Sobre 60 s hay un beneficio pequeño; sobre 90 s la hipertrofia casi no cambia.'],
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
  P({
    id: 'progresion_volumen', tema: 'fuerza', titulo: 'Ajustar series semana a semana', etiqueta: 'limitada',
    texto: [
      'Si un músculo queda bajo el rango de su prioridad, la app propone sumar series de a poco (hasta 2 por semana); si queda sobre el rango, propone quitar. Más series dan más hipertrofia, pero con rendimientos decrecientes.',
      'En semanas de descarga no se suman series. El tope de 2 series por semana es práctica común para subir el volumen sin disparar la fatiga.',
    ],
    refs: ['schoenfeld2017vol', 'pelland2026', 'bazvalle2022'],
  }),

  // Fuerza + running
  P({
    id: 'piernas_impacto', tema: 'concurrente', titulo: 'Piernas y running seguidos', etiqueta: 'limitada',
    texto: [
      'Correr fue el tipo de aeróbico que más interfirió con la fuerza y la hipertrofia de piernas, y la interferencia creció con la frecuencia y la duración. Bien dosificado, el efecto sobre el músculo completo fue pequeño o nulo.',
      'Por eso la app avisa cuando una sesión pesada de piernas y una carrera exigente (calidad o fondo) quedan a menos de 24 h: llegas con las piernas cargadas. El umbral de 24 h es práctica común.',
    ],
    refs: ['wilson2012', 'schumann2022'],
  }),

  // Tobillo
  P({
    id: 'tobillo_protocolo', tema: 'tobillo', titulo: 'Protocolo de tobillo obligatorio',
    texto: [
      'El tobillo se trata como una capacidad a construir, no como una zona a evitar. El entrenamiento de equilibrio redujo el riesgo de esguince, con más efecto en quienes ya habían tenido uno, y un programa de 8 semanas bajó 35 % las recurrencias.',
      'La fuerza también cuenta: en tobillos inestables, protocolos de fuerza mejoraron la fuerza (incluida la eversión), el equilibrio y la función.',
      'Los ensayos partieron después de esguinces recientes; con un esguince antiguo es una extrapolación razonable. Por eso la sesión que tiene el protocolo no se cierra sin esos ejercicios.',
    ],
    refs: ['mckeon2008', 'hupperets2009', 'doherty2017', 'hall2018'],
  }),
  P({
    id: 'tobillo_frecuencia', tema: 'tobillo', titulo: 'Equilibrio antes de cada carrera', etiqueta: 'limitada',
    texto: [
      'Los programas que funcionaron se hacían 3 veces por semana (20–30 min por sesión). Solo una vez por semana, el día de piernas, se queda corto.',
      'Por eso cada carrera parte con 2 × 30 s de equilibrio por lado: 2 minutos que suman estímulos durante la semana. La dosis exacta es práctica común; la frecuencia sale de los ensayos.',
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
      'La mayor parte del running va en Z2: los atletas de resistencia exitosos hacen ~80 % de sus sesiones a baja intensidad. Eso viene de atletas de élite; aplicarlo a un corredor recreativo es extrapolación.',
    ],
    refs: ['seiler2010'],
  }),
  P({
    id: 'fcmax_estimada', tema: 'running', titulo: 'FC máxima estimada',
    texto: [
      'Si no conoces tu FC máxima, la app usa 208 − 0,7 × edad, derivada de un metaanálisis de 351 estudios y validada en laboratorio. Funcionó igual en hombres y mujeres, activos o sedentarios.',
      'Es un promedio: tu FC máxima real puede ser bastante distinta. Si la conoces por un test o una carrera exigente, cámbiala en Ajustes.',
    ],
    refs: ['tanaka2001'],
  }),
  P({
    id: 'ritmos_test', tema: 'running', titulo: 'Ritmos desde tu test de 8 km', etiqueta: 'limitada',
    texto: [
      'Los ritmos salen de tu último test de 8 km en Z2 alta (4 lpm bajo el tope de tu Z2): Z2 al ritmo del test, fondo 10–20 s más lento, tempo 45–60 s más rápido, 1000 m 65–80 s y 800 m 75–90 s más rápidos.',
      'Sin test, la app usa el ritmo cómodo de tu perfil. Son ritmos guía derivados de práctica común.',
    ],
    refs: [],
  }),
  P({
    id: 'calidad', tema: 'running', titulo: 'Sesión de calidad', etiqueta: 'limitada',
    texto: [
      'La calidad rota en cada bloque de carga: fartlek, luego 800 m, luego 1000 m. Dentro del bloque suma una repetición por semana de carga y en descarga resta una. Con poco volumen semanal las repeticiones se acortan.',
      'Es la sesión que conserva tu ritmo: con la misma frecuencia y duración, bajar la intensidad hizo perder capacidad aeróbica y resistencia. La mayor parte del resto del running va suave.',
      'La rotación y el número de repeticiones son práctica común, no una receta probada.',
    ],
    refs: ['hickson1985', 'seiler2010'],
  }),
  P({
    id: 'progresion_running', tema: 'running', titulo: 'Cómo suben tus km', etiqueta: 'discusion',
    texto: [
      'Si tu meta es mejorar, los km de la semana suben 8 % (al menos 1 km) cuando cumpliste el 80 % o más de tu última semana de carga. Entre 50 y 80 % se repiten; bajo 50 % bajan 10 %, sin caer de 2/3 de tus km base. Con molestias de tobillo, rodilla o cadera no suben, y en descarga corres el 60 %.',
      'La evidencia sobre cuánto subir es muy limitada: subir más de 30 % se asoció a más lesiones por distancia, pero no hubo diferencia entre subir 10 % y 24 % en promedio, y la "regla del 10 %" no redujo lesiones en novatos. El 8 % es una opción prudente, no una cifra probada.',
      'Los km se reparten con el fondo como la salida larga (45 % de la semana con 3 salidas, hasta tu tope de fondo), la calidad según sus repeticiones y el resto en Z2.',
    ],
    refs: ['damsted2018', 'nielsen2014', 'buist2008'],
  }),
  P({
    id: 'mantener_running', tema: 'running', titulo: 'Cuánto correr para no perder el ritmo',
    texto: [
      'El rendimiento aeróbico se mantuvo hasta 15 semanas con solo 2 sesiones por semana, o bajando el volumen entre 33 y 66 %, siempre que se conservara la intensidad.',
      'La intensidad es lo que más protege: con la misma frecuencia y duración, bajar la intensidad redujo la capacidad aeróbica y la resistencia. Y si paras del todo, la capacidad aeróbica cae en pocas semanas.',
      'Por eso, en modo mantener la app deja tus km base fijos y te pide al menos 2 salidas y 1 de calidad por semana. La semana de descarga (60 % de los km, manteniendo la calidad) queda dentro de ese margen.',
    ],
    refs: ['spiering2021', 'hickson1985', 'mujika2000'],
  }),
  P({
    id: 'km_semanales', tema: 'running', titulo: 'Cómo saber cuánto corres', etiqueta: 'limitada',
    texto: [
      'Si usas reloj o Strava, tu total semanal aparece ahí: usa el promedio de las últimas 4 semanas. Si no, estímalo con los días que corres por semana y la distancia de una salida normal, cambiando una de ellas por tu salida más larga.',
      'Es solo el punto de partida. Después la app mide tus km reales: en Semana y Progreso ves tu promedio de 4 semanas, y la progresión se ajusta a lo que realmente cumples.',
    ],
    refs: [],
  }),
  P({
    id: 'tope_km', tema: 'running', titulo: 'Tope de km semanales', etiqueta: 'limitada',
    texto: [
      'Sobre tu tope sube el impacto acumulado y la interferencia con la hipertrofia: la interferencia creció con la frecuencia y la duración del aeróbico, y fue más clara al correr que al pedalear.',
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
    id: 'objetivo_kcal', tema: 'nutricion', titulo: 'Cómo se calculan tus calorías', etiqueta: 'limitada',
    texto: [
      'El gasto en reposo sale de la ecuación de Mifflin-St Jeor, la más confiable entre las de uso común, y se multiplica por un factor según tus sesiones por semana. Ese factor es la parte menos precisa: práctica común.',
      'Para perder grasa se resta 20 % (máximo 500 kcal): en atletas, un recorte de ~19 % permitió bajar 0,7 % del peso por semana ganando masa magra, y déficits sobre 500 kcal/día frenaron la masa magra.',
      'Para ganar músculo se suma 10 %, el extremo conservador del superávit recomendado (10–20 %), apuntando a subir 0,25–0,5 % del peso por semana.',
      'Es un punto de partida: la calibración semanal con tus pesajes corrige el error de la estimación.',
    ],
    refs: ['mifflin1990', 'frankenfield2005', 'garthe2011', 'murphy2022', 'iraki2019'],
  }),
  P({
    id: 'proteina', tema: 'nutricion', titulo: 'Proteína',
    texto: [
      'Para quien entrena se recomiendan 1,4–2,0 g/kg al día; sobre ~1,6 g/kg no se vio más ganancia de masa magra en condiciones normales. Para ganar músculo se recomiendan 1,6–2,2 g/kg.',
      'En déficit las necesidades suben: en atletas magros se estiman 2,3–3,1 g por kg de masa libre de grasa. Si buscas perder grasa y registras cuello y cintura, la app te muestra ese rango.',
    ],
    refs: ['jager2017', 'morton2018', 'helms2014prot', 'iraki2019'],
  }),
  P({
    id: 'grasa', tema: 'nutricion', titulo: 'Grasa y su piso', etiqueta: 'limitada',
    texto: [
      'Se recomienda que 15–30 % de las calorías venga de grasa (0,5–1,5 g/kg al ganar músculo). Las dietas bajas en grasa bajaron la testosterona en hombres.',
      'El piso de 0,8 g/kg es práctica común: la evidencia respalda tener un piso, no ese número exacto.',
    ],
    refs: ['helms2014prep', 'whittaker2021', 'iraki2019'],
  }),
  P({
    id: 'calibracion', tema: 'nutricion', titulo: 'Calibración de calorías', etiqueta: 'limitada',
    texto: [
      'La app promedia tus pesajes de cada semana (idealmente 3, en ayunas), porque el peso diario varía por agua y comida.',
      'Para perder grasa la meta es bajar 0,35–0,75 % del peso por semana: en atletas, bajar ~0,7 % por semana permitió ganar masa magra y fuerza, y bajar el doble de rápido no. Para ganar músculo, subir 0,25–0,5 % por semana.',
      'Si en 3 semanas el peso no va hacia tu objetivo, propone ±150 kcal; si va demasiado rápido 2 semanas seguidas, lo contrario. Después de un ajuste espera 2 semanas y nunca propone bajar del piso de seguridad. Los umbrales son práctica común.',
    ],
    refs: ['helms2014prep', 'garthe2011', 'iraki2019', 'murphy2022'],
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
      'Sobre 1 % del peso por semana sostenido, el riesgo de perder masa magra sube: conviene comer un poco más.',
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
    texto: ['Las categorías (esencial, atletas, fitness, promedio, obesidad) vienen de una tabla del American Council on Exercise. Sirven para entender el número; no son un estudio revisado por pares.'],
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
