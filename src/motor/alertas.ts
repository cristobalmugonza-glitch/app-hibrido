import type { Datos } from '../tipos/modelo';
import type { Contexto } from './secuencia';
import { diasEntre, enVentana } from './fechas';
import { fmt0, fmt1 } from './formato';
import { kmEnVentana, saltoCarga, type AjustesRunning } from './running';
import { perdidaRapida } from './nutricion';

export type Alerta = { id: string; texto: string; porQue: string };

export function estadoTobillo(datos: Datos, ahora: Date) {
  const recientes = datos.molestias.filter((m) => m.zona === 'tobillo_der' && enVentana(m.fecha, ahora, 0, 7));
  return {
    repetida: recientes.filter((m) => m.intensidad >= 2).length >= 2,
    severa: recientes.some((m) => m.intensidad === 3),
  };
}

export function ajustesRunning(datos: Datos, ahora: Date, ctx: Contexto): AjustesRunning {
  const t = estadoTobillo(datos, ahora);
  return { factor: (ctx.descarga ? 0.6 : 1) * (t.repetida ? 0.8 : 1), calidadAZ2: t.severa };
}

// Informan, no bloquean. Tono de entrenador.
export function alertas(datos: Datos, ahora = new Date()): Alerta[] {
  const lista: Alerta[] = [];
  const t = estadoTobillo(datos, ahora);

  if (t.severa) {
    lista.push({ id: 'tobillo3', texto: 'Tobillo en intensidad 3: la próxima calidad pasa a Z2. Revisa si subiste la carga de golpe.', porQue: 'tobillo_alerta' });
  } else if (t.repetida) {
    lista.push({ id: 'tobillo2', texto: 'Tobillo: 2 molestias fuertes esta semana. Running −20 % y equilibrio antes de cada carrera.', porQue: 'tobillo_alerta' });
  }

  const km7 = kmEnVentana(datos, ahora, 0, 7);
  if (km7 > datos.perfil.topeKmSemanal) {
    lista.push({ id: 'tope', texto: `${fmt1(km7)} km en 7 días, sobre tu tope de ${datos.perfil.topeKmSemanal}. Más impacto para el tobillo y más interferencia con la hipertrofia.`, porQue: 'tope_km' });
  }

  const salto = saltoCarga(datos, ahora);
  if (salto && salto.pct > 30) {
    lista.push({ id: 'salto', texto: `Subiste ${fmt0(salto.pct)} % los km frente a tus 4 semanas previas. Sube de a poco.`, porQue: 'salto_carga' });
  }

  const conTobillo = datos.rutina.plantillas.filter((p) => p.ejercicios.some((e) => e.esProtocoloTobillo)).map((p) => p.id);
  if (conTobillo.length) {
    const ultima = datos.sesionesGym.filter((s) => conTobillo.includes(s.plantillaId)).at(-1);
    const desde = ultima?.fecha ?? datos.perfil.fechaInicio + 'T00:00:00';
    const dias = Math.floor(diasEntre(desde, ahora));
    if (dias > 10) {
      lista.push({ id: 'piernas', texto: `Llevas ${dias} días sin piernas, y ahí vive el protocolo de tobillo.`, porQue: 'tobillo_protocolo' });
    }
  }

  if (perdidaRapida(datos, ahora)) {
    lista.push({ id: 'perdida', texto: 'Bajas más de 0,8 kg por semana hace 2 semanas: riesgo de perder músculo. Revisa Nutrición.', porQue: 'ritmo_perdida' });
  }

  return lista;
}
