import { useState } from 'react';
import type { SesionGym, SesionRunning } from '../tipos/modelo';
import { useDatos } from '../almacen/contexto';
import { Boton, Encabezado, Hoja, Segmentado } from '../componentes/ui';
import { PorQue } from '../componentes/PorQue';
import { MUSCULOS, NOMBRE_MUSCULO } from '../data/reglas-tipo';
import { fmt1, fmt2, ritmo, segundosAMinTexto } from '../motor/formato';
import { contextoSemana, corre, fijarTipoSemana, hechasEnSemana, listaBloques, NOMBRE_RUNNING, primeraSemana, SEMANAS_DE_CARGA, sesionesPlanificadas, tipoSemana, totalSesiones } from '../motor/planificacion';
import { aplicarAccion, proyectarSemana, type Ajuste } from '../motor/proyeccion';
import { planRunning, porQueObjetivoKm, promedioReal, ritmoSesion, textoObjetivoKm } from '../motor/running';
import { diaCorto, inicioSemana, rangoSemana, sumarDias } from '../motor/semanas';
import { borrarSesion } from '../motor/sesiones';
import { definiciones, seriesHechas, seriesPlanificadas } from '../motor/volumen';

type Vista = 'actual' | 'proxima' | 'historial';

export function Semana() {
  const [vista, setVista] = useState<Vista>('actual');
  return (
    <div>
      <Encabezado>Semana</Encabezado>
      <div className="mt-4">
        <Segmentado<Vista>
          opciones={[
            { valor: 'actual', etiqueta: 'Esta semana' },
            { valor: 'proxima', etiqueta: 'Próxima' },
            { valor: 'historial', etiqueta: 'Historial' },
          ]}
          valor={vista}
          onCambio={setVista}
        />
      </div>
      {vista === 'actual' && <EstaSemana />}
      {vista === 'proxima' && <Proxima />}
      {vista === 'historial' && <Historial />}
    </div>
  );
}

function EstaSemana() {
  const { datos, actualizar } = useDatos();
  const ahora = new Date();
  const inicio = inicioSemana(ahora);
  const ctx = contextoSemana(datos, inicio);
  const hechas = hechasEnSemana(datos, inicio);
  const sesiones = datos.sesionesGym.filter((s) => inicioSemana(s.fecha) === inicio);
  const hechasM = seriesHechas(sesiones, definiciones(datos));
  const planM = seriesPlanificadas(datos.rutina, ctx.descarga);
  const musculos = MUSCULOS.filter((m) => planM[m] > 0 || hechasM[m] > 0);
  const bloques = listaBloques(datos).filter((b) => b.veces > 0 || (hechas.get(b.key) ?? 0) > 0);
  const km = datos.sesionesRunning.filter((s) => inicioSemana(s.fecha) === inicio).reduce((a, s) => a + s.distanciaKm, 0);
  const plan = planRunning(datos, inicio, ahora);
  const promedio = promedioReal(datos, ahora);

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-texto2">
          {rangoSemana(inicio)} · {ctx.descarga ? 'Descarga' : `Carga ${ctx.semanaDeCarga} de ${SEMANAS_DE_CARGA}`}
        </p>
        <PorQue id={ctx.descarga ? 'descarga' : 'cuando_descargar'} />
      </div>
      <p className="num mt-1 text-[48px] leading-none">
        {totalSesiones(datos, inicio)} <span className="text-2xl text-texto2">de {sesionesPlanificadas(datos)} sesiones</span>
      </p>

      {bloques.length > 0 && (
        <ul className="mt-4 divide-y divide-linea border-y border-linea">
          {bloques.map((b) => {
            const n = hechas.get(b.key) ?? 0;
            const listo = b.veces > 0 && n >= b.veces;
            return (
              <li key={b.key} className="flex items-baseline justify-between py-2.5 text-[15px]">
                <span>{b.nombre}</span>
                <span className={`num text-lg ${listo ? 'text-acento' : 'text-texto2'}`}>
                  {listo ? '✓ ' : ''}
                  {n}/{b.veces}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {musculos.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm text-texto2">Series por músculo, hechas de planificadas</h2>
            <PorQue id="volumen" />
          </div>
          <ul className="mt-1 divide-y divide-linea border-y border-linea">
            {musculos.map((m) => (
              <li key={m} className="flex items-baseline justify-between py-2.5">
                <span className="text-[15px]">{NOMBRE_MUSCULO[m]}</span>
                <span>
                  <span className="num text-xl">{fmt1(hechasM[m])}</span>
                  <span className="text-sm text-texto2"> de {fmt1(planM[m])}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {corre(datos) && (
        <section className="mt-6 border-b border-linea pb-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm text-texto2">Running</h2>
            <span>
              <span className="num text-xl">{fmt1(km)}</span>
              <span className="text-sm text-texto2"> de {fmt1(plan.reparto.total)} km</span>
            </span>
          </div>
          <div className="mt-1 flex items-start gap-3">
            <p className="flex-1 text-sm leading-snug text-texto2">
              {textoObjetivoKm(plan.objetivo)}
              {promedio !== null ? ` Tu promedio real: ${fmt1(promedio)} km por semana.` : ''}
            </p>
            <PorQue id={porQueObjetivoKm(plan.objetivo)} />
          </div>
        </section>
      )}

      <div className="mt-4 flex justify-center">
        <Boton variante="texto" onClick={() => actualizar((d) => fijarTipoSemana(d, inicio, ctx.descarga ? 'carga' : 'descarga'))}>
          {ctx.descarga ? 'Cambiar a semana de carga' : 'Cambiar a semana de descarga'}
        </Boton>
      </div>
    </div>
  );
}

function Proxima() {
  const { datos, actualizar } = useDatos();
  const [aplicados, setAplicados] = useState<Ajuste[]>([]);
  const p = proyectarSemana(datos, new Date());
  const [tipo, ...resto] = p.ajustes;

  return (
    <div className="mt-5">
      <p className="text-sm text-texto2">{rangoSemana(p.inicio)}</p>
      <div className="mt-1 flex items-start gap-3">
        <h2 className="num flex-1 text-[40px] leading-none">{tipo.titulo}</h2>
        <PorQue id={tipo.porQue} />
      </div>
      {tipo.detalle && <p className="mt-2 text-[15px] leading-snug text-texto2">{tipo.detalle}</p>}
      <p className="mt-2 text-sm text-texto2">
        {p.sesiones} sesiones: {p.bloques || 'sin bloques en el plan'}
      </p>

      {resto.length ? (
        <ul className="mt-5 divide-y divide-linea border-y border-linea">
          {resto.map((a) => {
            const accion = a.accion;
            return (
              <li key={a.id} className="py-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-snug">{a.titulo}</p>
                    {a.detalle && <p className="mt-0.5 text-sm leading-snug text-texto2">{a.detalle}</p>}
                  </div>
                  <PorQue id={a.porQue} />
                </div>
                {accion && (
                  <button
                    type="button"
                    onClick={() => {
                      actualizar((d) => aplicarAccion(d, accion, new Date()));
                      setAplicados((x) => [...x, a]);
                    }}
                    className="mt-2 h-10 rounded-lg border border-linea px-4 text-sm font-medium text-acento active:opacity-70"
                  >
                    Aplicar
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-5 text-[15px] text-texto2">Sin cambios: sigue la doble progresión en cada ejercicio.</p>
      )}

      {aplicados.length > 0 && (
        <div className="mt-4 space-y-1">
          {aplicados.map((a, i) => (
            <p key={i} className="text-sm text-texto2">
              ✓ {a.detalle ?? a.titulo}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

type Registro = { s: SesionGym | SesionRunning; fecha: string; nombre: string; sub: string };

const esGym = (s: SesionGym | SesionRunning): s is SesionGym => 'ejercicios' in s;
const seriesDe = (s: SesionGym) => s.ejercicios.reduce((a, e) => a + e.series.length, 0);

function Historial() {
  const { datos, actualizar } = useDatos();
  const actual = inicioSemana(new Date());
  const [abierta, setAbierta] = useState<string | null>(actual);
  const [sesion, setSesion] = useState<SesionGym | SesionRunning | null>(null);
  const [confirmar, setConfirmar] = useState(false);

  const todas = [...datos.sesionesGym, ...datos.sesionesRunning];
  if (!todas.length) return <p className="mt-6 text-[15px] text-texto2">Tu historial aparece con tu primera sesión.</p>;

  const desde = todas.map((s) => inicioSemana(s.fecha)).reduce((a, b) => (b < a ? b : a), primeraSemana(datos));
  const semanas: string[] = [];
  for (let w = actual; w >= desde && semanas.length < 104; w = sumarDias(w, -7)) semanas.push(w);

  const cerrar = () => {
    setSesion(null);
    setConfirmar(false);
  };

  return (
    <div className="mt-5">
      <ul className="divide-y divide-linea border-y border-linea">
        {semanas.map((w) => {
          const registros: Registro[] = [
            ...datos.sesionesGym.filter((s) => inicioSemana(s.fecha) === w).map((s) => ({ s, fecha: s.fecha, nombre: s.nombre, sub: `${seriesDe(s)} series` })),
            ...datos.sesionesRunning.filter((s) => inicioSemana(s.fecha) === w).map((s) => ({ s, fecha: s.fecha, nombre: NOMBRE_RUNNING[s.tipo], sub: `${fmt1(s.distanciaKm)} km` })),
          ].sort((a, b) => a.fecha.localeCompare(b.fecha));
          const series = registros.reduce((a, r) => a + (esGym(r.s) ? seriesDe(r.s) : 0), 0);
          const km = registros.reduce((a, r) => a + (esGym(r.s) ? 0 : r.s.distanciaKm), 0);
          const n = registros.length;
          const resumen = n === 0 ? 'Sin sesiones' : [`${n} ${n === 1 ? 'sesión' : 'sesiones'}`, series ? `${series} series` : '', km ? `${fmt1(km)} km` : ''].filter(Boolean).join(' · ');
          return (
            <li key={w}>
              <button type="button" onClick={() => setAbierta(abierta === w ? null : w)} aria-expanded={abierta === w} className="flex w-full items-center justify-between gap-3 py-3 text-left">
                <span>
                  <span className="block text-[16px]">
                    {w === actual ? 'Esta semana' : rangoSemana(w)}
                    {tipoSemana(datos, w) === 'descarga' ? ' · descarga' : ''}
                  </span>
                  <span className="block text-sm text-texto2">{resumen}</span>
                </span>
                {n > 0 && (
                  <span aria-hidden className="text-xl text-texto2">
                    {abierta === w ? '−' : '+'}
                  </span>
                )}
              </button>
              {abierta === w && n > 0 && (
                <ul className="mb-2">
                  {registros.map((r) => (
                    <li key={r.s.id}>
                      <button type="button" onClick={() => setSesion(r.s)} className="flex w-full items-baseline justify-between gap-3 py-2 pl-3 text-left text-[15px]">
                        <span>
                          <span className="text-texto2">{diaCorto(r.fecha)}</span> · {r.nombre}
                        </span>
                        <span className="text-sm text-texto2">{r.sub}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <Hoja abierta={!!sesion} onCerrar={cerrar} titulo={sesion ? `${esGym(sesion) ? sesion.nombre : NOMBRE_RUNNING[sesion.tipo]} · ${diaCorto(sesion.fecha)}` : ''}>
        {sesion && <DetalleSesion s={sesion} />}
        {sesion &&
          (confirmar ? (
            <Boton
              variante="peligro"
              className="mt-5"
              onClick={() => {
                const id = sesion.id;
                actualizar((d) => borrarSesion(d, id));
                cerrar();
              }}
            >
              Sí, borrar esta sesión
            </Boton>
          ) : (
            <Boton variante="texto" className="mt-5 w-full" onClick={() => setConfirmar(true)}>
              Borrar sesión
            </Boton>
          ))}
      </Hoja>
    </div>
  );
}

function DetalleSesion({ s }: { s: SesionGym | SesionRunning }) {
  if (!esGym(s)) {
    return (
      <p className="num text-2xl">
        {fmt1(s.distanciaKm)} km · {segundosAMinTexto(s.duracionMin * 60)} · {ritmo(ritmoSesion(s))}/km · {s.fcPromedio} lpm
      </p>
    );
  }
  if (!s.ejercicios.length) return <p className="text-[15px] text-texto2">Sin series registradas.</p>;
  return (
    <ul className="divide-y divide-linea border-y border-linea">
      {s.descarga && <li className="py-2 text-sm text-texto2">Semana de descarga</li>}
      {s.ejercicios.map((e) => (
        <li key={e.ejercicioId} className="py-2.5">
          <p className="text-[15px]">{e.nombre}</p>
          <p className="num text-lg text-texto2">{e.series.map((x) => (x.peso ? `${fmt2(x.peso)} × ${x.reps}` : `${x.reps}`)).join(' · ')}</p>
        </li>
      ))}
    </ul>
  );
}
