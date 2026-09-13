import { useState } from 'react';
import type { Datos, EjercicioDef, TipoRunning } from '../tipos/modelo';
import { useDatos } from '../almacen/contexto';
import { Aviso, Boton, Hoja, Nota } from '../componentes/ui';
import { PorQue } from '../componentes/PorQue';
import { FormRunning } from './FormRunning';
import { RegistrarHoja } from './Registrar';
import { alertas, ajustesRunning } from '../motor/alertas';
import { pendientes } from '../motor/benchmarks';
import { fmt0, fmt1, fmt2, plural } from '../motor/formato';
import { contextoSemana, SEMANAS_DE_CARGA, sesionesPlanificadas, totalSesiones, type ContextoSemana } from '../motor/planificacion';
import { historialDe, sugerir, type Sugerencia } from '../motor/progresion';
import { planRunning, prescribir, type PlanRunning, type Prescripcion } from '../motor/running';
import { inicioSemana, rangoSemana } from '../motor/semanas';
import { iniciarGym } from '../motor/sesiones';
import { estadoBloques, sesionDeHoy, sugerirBloque, type EstadoBloque, type SesionDeHoy } from '../motor/sugerencia';

export function Hoy({ onAbrirRegistro }: { onAbrirRegistro: () => void }) {
  const { datos, actualizar } = useDatos();
  const [detalle, setDetalle] = useState<string | null>(null);
  const [registrar, setRegistrar] = useState(false);
  const [verOtros, setVerOtros] = useState(false);
  const [carrera, setCarrera] = useState<TipoRunning | null>(null);

  const ahora = new Date();
  const semana = contextoSemana(datos, inicioSemana(ahora));
  const planRun = planRunning(datos, semana.inicio, ahora);
  const estados = estadoBloques(datos, ahora);
  const sugerencia = sugerirBloque(estados);
  const hoy = sesionDeHoy(datos, ahora);
  const avisos = alertas(datos, ahora);
  const pend = pendientes(datos, ahora);
  const enCurso = datos.borradorGym;
  const planificados = estados.filter((e) => e.veces > 0);
  const otros = estados.filter((e) => e.veces === 0);
  const abierto = estados.find((e) => e.key === detalle) ?? null;
  const sugerido = sugerencia.tipo === 'bloque' ? sugerencia.bloque : null;

  const empezar = (e: EstadoBloque) => {
    const ref = e.ref;
    setDetalle(null);
    if (ref.clase === 'gym') {
      actualizar((d) => iniciarGym(d, ref.plantillaId, semana.descarga));
      onAbrirRegistro();
    } else setCarrera(ref.tipo);
  };

  // Gym empieza directo; una carrera primero muestra la prescripción.
  const cta = enCurso
    ? { texto: `Continuar ${enCurso.sesion.nombre}`, accion: onAbrirRegistro }
    : sugerido
      ? sugerido.ref.clase === 'gym'
        ? { texto: `Empezar ${sugerido.nombre}`, accion: () => empezar(sugerido) }
        : { texto: `Ver ${sugerido.nombre}`, accion: () => setDetalle(sugerido.key) }
      : null;

  return (
    <div className={cta ? 'pb-24' : ''}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-texto2">
          Semana {rangoSemana(semana.inicio)}
          {semana.descarga ? '' : ` · carga ${semana.semanaDeCarga} de ${SEMANAS_DE_CARGA}`}
        </p>
        <button type="button" onClick={() => setRegistrar(true)} className="-mr-2 h-11 shrink-0 px-2 font-medium text-acento">
          Registrar
        </button>
      </div>

      {semana.descarga && (
        <div className="mt-2 flex items-start gap-3 rounded-xl bg-acento px-4 py-3 text-fondo">
          <div className="flex-1">
            <p className="font-semibold">Semana de descarga</p>
            <p className="text-[15px]">Mitad de series, sin fallo, 60 % de los km.</p>
          </div>
          <PorQue id="descarga" tono="invertido" />
        </div>
      )}

      <p className="mt-5 text-texto2">{hoy ? `Ya hiciste ${hoy.nombre} hoy.${sugerido ? ' Si quieres otra sesión:' : ''}` : sugerido ? 'Hoy te sugiero' : 'Hoy'}</p>
      <div className="mt-1 flex items-start gap-3">
        <h1 className="num flex-1 text-[48px] leading-[1.05]">{sugerido ? sugerido.nombre : sugerencia.tipo === 'descanso' ? 'Descanso' : 'Semana completa'}</h1>
        <PorQue id={sugerencia.tipo === 'descanso' ? 'recuperacion' : 'bloques_libres'} className="mt-3" />
      </div>
      <p className="mt-2 text-texto2">{sugerencia.tipo === 'completa' ? 'Descansa o repite un bloque si te sobra energía.' : sugerencia.motivo}</p>

      {avisos.map((a) => (
        <Aviso key={a.id} texto={a.texto} porQue={a.porQue} />
      ))}
      {pend.length > 0 && (
        <button type="button" onClick={() => setRegistrar(true)} className="mt-4 block text-left text-sm text-texto2 underline decoration-linea underline-offset-4">
          Pendiente: {pend.join(', ')}
        </button>
      )}

      <section className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm text-texto2">Tus bloques</h2>
          <span className="text-sm text-texto2">
            {totalSesiones(datos, semana.inicio)} de {sesionesPlanificadas(datos)} esta semana
          </span>
        </div>
        {planificados.length ? (
          <ul className="mt-1 divide-y divide-linea border-y border-linea">
            {planificados.map((e) => (
              <FilaBloque key={e.key} e={e} sub={resumenBloque(e, datos, semana, planRun, ahora)} onClick={() => setDetalle(e.key)} />
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[15px] text-texto2">Tu plan semanal está vacío. Agrega bloques en Más › Ajustes › Plan semanal.</p>
        )}
        {otros.length > 0 && (
          <>
            <button type="button" onClick={() => setVerOtros(!verOtros)} className="mt-1 h-11 text-sm text-texto2">
              {verOtros ? 'Ocultar otros bloques' : `Otros bloques (${otros.length})`}
            </button>
            {verOtros && (
              <ul className="divide-y divide-linea border-y border-linea">
                {otros.map((e) => (
                  <FilaBloque key={e.key} e={e} sub={resumenBloque(e, datos, semana, planRun, ahora)} onClick={() => setDetalle(e.key)} />
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {cta && (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-linea bg-fondo">
          <div className="mx-auto max-w-md px-5 py-3">
            <Boton onClick={cta.accion}>{cta.texto}</Boton>
          </div>
        </div>
      )}

      <Hoja abierta={!!abierto} onCerrar={() => setDetalle(null)} titulo={abierto?.nombre ?? ''}>
        {abierto && <DetalleBloque e={abierto} datos={datos} semana={semana} plan={planRun} hoy={hoy} ahora={ahora} ocupado={!!enCurso} onEmpezar={() => empezar(abierto)} />}
      </Hoja>

      <RegistrarHoja abierta={registrar} onCerrar={() => setRegistrar(false)} />
      {carrera && <FormRunning tipo={carrera} onCerrar={() => setCarrera(null)} />}
    </div>
  );
}

function FilaBloque({ e, sub, onClick }: { e: EstadoBloque; sub: string; onClick: () => void }) {
  const completo = e.veces > 0 && e.hechas >= e.veces;
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-3 py-3 text-left">
        <span className="min-w-0">
          <span className="block text-[17px]">{e.nombre}</span>
          <span className="block truncate text-sm text-texto2">
            {sub}
            {e.avisos.length ? ' · recuperando' : ''}
          </span>
        </span>
        <span className={`num shrink-0 text-xl ${completo ? 'text-acento' : 'text-texto2'}`}>
          {completo ? '✓ ' : ''}
          {e.veces > 0 ? `${e.hechas}/${e.veces}` : e.hechas || ''}
        </span>
      </button>
    </li>
  );
}

function prescripcionDe(e: EstadoBloque, datos: Datos, plan: PlanRunning, ahora: Date): Prescripcion | null {
  return e.ref.clase === 'running' ? prescribir(e.ref.tipo, datos, plan, ajustesRunning(datos, ahora)) : null;
}

function resumenBloque(e: EstadoBloque, datos: Datos, semana: ContextoSemana, plan: PlanRunning, ahora: Date): string {
  const ref = e.ref;
  if (ref.clase === 'gym') {
    const p = datos.rutina.plantillas.find((x) => x.id === ref.plantillaId);
    if (!p) return '';
    const series = p.ejercicios.reduce((a, x) => a + (semana.descarga ? Math.ceil(x.series / 2) : x.series), 0);
    return `${plural(p.ejercicios.length, 'ejercicio')} · ${plural(series, 'serie')}`;
  }
  // El nombre del bloque ya dice Z2 o fondo; solo la calidad agrega el tipo de sesión.
  const pr = prescripcionDe(e, datos, plan, ahora)!;
  return ref.tipo === 'calidad' ? `${pr.etiqueta} · ${fmt1(pr.km)} km` : `${fmt1(pr.km)} km`;
}

// El consejo de orden solo aplica cuando se juntan fuerza y running el mismo día.
function notaSesionDoble(hoy: SesionDeHoy, e: EstadoBloque): string {
  const hace = hoy.horas < 1 ? 'hace menos de 1 h' : `hace ${fmt0(hoy.horas)} h`;
  const base = `Ya hiciste ${hoy.nombre} hoy, ${hace}. Si puedes, separa al menos 3 h`;
  if (hoy.clase === 'gym' && e.ref.clase === 'running') return `${base}; si quedan juntas, este orden (fuerza y después running) es el recomendado.`;
  if (hoy.clase === 'running' && e.ref.clase === 'gym') return `${base}: con poca separación lo que más se resiente es la potencia, no la hipertrofia.`;
  return `${base}.`;
}

function DetalleBloque({
  e,
  datos,
  semana,
  plan,
  hoy,
  ahora,
  ocupado,
  onEmpezar,
}: {
  e: EstadoBloque;
  datos: Datos;
  semana: ContextoSemana;
  plan: PlanRunning;
  hoy: SesionDeHoy | null;
  ahora: Date;
  ocupado: boolean;
  onEmpezar: () => void;
}) {
  const ref = e.ref;
  const plantilla = ref.clase === 'gym' ? datos.rutina.plantillas.find((p) => p.id === ref.plantillaId) : undefined;
  const prescripcion = prescripcionDe(e, datos, plan, ahora);
  return (
    <div>
      <p className="text-sm text-texto2">{e.veces > 0 ? `${e.hechas} de ${e.veces} esta semana` : 'Fuera de tu plan semanal: cuenta igual en tu historial.'}</p>
      {e.avisos.map((a) => (
        <Nota key={a.texto} porQue={a.porQue}>
          {a.texto}
        </Nota>
      ))}
      {hoy && <Nota porQue="sesion_doble">{notaSesionDoble(hoy, e)}</Nota>}
      <div className="mt-4">
        {plantilla && <ListaEjercicios ejercicios={plantilla.ejercicios} datos={datos} descarga={semana.descarga} />}
        {prescripcion && <BloqueRunning p={prescripcion} />}
      </div>
      {plantilla ? (
        <Boton className="mt-5" disabled={ocupado || !plantilla.ejercicios.length} onClick={onEmpezar}>
          {ocupado ? 'Termina la sesión en curso primero' : `Empezar ${e.nombre}`}
        </Boton>
      ) : (
        <Boton className="mt-5" onClick={onEmpezar}>
          Registrar carrera
        </Boton>
      )}
    </div>
  );
}

function textoSugerencia(e: EjercicioDef, s: Sugerencia): string {
  const [min, max] = e.rangoReps;
  const rango = `${s.series} × ${min}–${max}${e.modo === 'tiempo' ? ' s' : ''}`;
  if (e.modo !== 'carga') return rango;
  if (s.peso === null) return 'primera vez';
  if (s.peso === 0 && e.tipo === 'calistenia_peso_corporal') return `sin lastre · ${rango}`;
  return `${fmt2(s.peso)} kg · ${rango}`;
}

function ListaEjercicios({ ejercicios, datos, descarga }: { ejercicios: EjercicioDef[]; datos: Datos; descarga: boolean }) {
  if (!ejercicios.length) return <p className="text-[15px] text-texto2">Esta sesión no tiene ejercicios. Agrégalos en Más › Ajustes › Plan semanal.</p>;
  return (
    <ul className="divide-y divide-linea border-y border-linea">
      {ejercicios.map((e) => {
        const s = sugerir(e, historialDe(e.id, datos.sesionesGym), descarga);
        return (
          <li key={e.id} className="flex items-baseline justify-between gap-3 py-3">
            <span className="text-[15px]">
              {e.nombre}
              {e.esProtocoloTobillo && <span className="text-texto2"> · tobillo</span>}
            </span>
            <span className="num shrink-0 text-lg text-texto2">{textoSugerencia(e, s)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function BloqueRunning({ p }: { p: Prescripcion }) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="num text-[56px] leading-none">{fmt1(p.km)}</span>
        <span className="text-texto2">km</span>
      </div>
      <ul className="mt-4 space-y-3">
        {p.lineas.map((l, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex-1 text-[15px] leading-snug">{l.texto}</span>
            {l.porQue && <PorQue id={l.porQue} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
