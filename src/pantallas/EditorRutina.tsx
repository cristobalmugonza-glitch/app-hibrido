import { useState, type ReactNode } from 'react';
import type { EjercicioDef, ModoRegistro, Musculo, RefBloque, TipoEjercicio } from '../tipos/modelo';
import { useDatos } from '../almacen/contexto';
import { nuevoId } from '../almacen/storage';
import { aNum, Boton, Campo, Casilla, deNum, Encabezado, Hoja, Volver } from '../componentes/ui';
import { PorQue } from '../componentes/PorQue';
import { CATALOGO, NOMBRE_GRUPO, RUTINAS_ESTANDAR, type Grupo, type IdRutina } from '../data/catalogo';
import { MUSCULOS, NOMBRE_MUSCULO, NOMBRE_PRIORIDAD, REGLAS_TIPO } from '../data/reglas-tipo';
import { fmt1, plural } from '../motor/formato';
import { NOMBRE_RUNNING, sesionesPlanificadas, TIPOS_RUNNING } from '../motor/planificacion';
import {
  agregarEjercicio,
  aplicarRutinaEstandar,
  crearPlantilla,
  definicionPara,
  eliminarPlantilla,
  fijarVeces,
  guardarEjercicio,
  MAX_VECES,
  misEjercicios,
  moverEjercicio,
  quitarEjercicio,
  renombrarPlantilla,
} from '../motor/rutina';
import { analisisVolumen } from '../motor/volumen';

const ORDEN_PRIORIDAD = ['alta', 'media', 'mantencion'] as const;

function BotonIcono({ etiqueta, children, onClick, disabled }: { etiqueta: string; children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" aria-label={etiqueta} disabled={disabled} onClick={onClick} className="h-10 w-10 shrink-0 rounded-lg text-lg text-texto2 active:bg-superficie disabled:opacity-25">
      {children}
    </button>
  );
}

function Contador({ valor, onCambio, etiqueta }: { valor: number; onCambio: (v: number) => void; etiqueta: string }) {
  return (
    <div className="flex shrink-0 items-center">
      <BotonIcono etiqueta={`Menos ${etiqueta}`} disabled={valor <= 0} onClick={() => onCambio(valor - 1)}>
        −
      </BotonIcono>
      <span className="num w-6 text-center text-xl">{valor}</span>
      <BotonIcono etiqueta={`Más ${etiqueta}`} disabled={valor >= MAX_VECES} onClick={() => onCambio(valor + 1)}>
        +
      </BotonIcono>
    </div>
  );
}

export function EditorRutina({ onVolver }: { onVolver: () => void }) {
  const { datos, actualizar } = useDatos();
  const [plantillaId, setPlantillaId] = useState<string | null>(null);
  const [estandar, setEstandar] = useState(false);
  const [confirmar, setConfirmar] = useState<IdRutina | null>(null);
  const { rutina } = datos;

  if (plantillaId) return <EditorPlantilla id={plantillaId} onVolver={() => setPlantillaId(null)} />;

  const volumen = analisisVolumen(rutina).filter((f) => f.series > 0 || f.prioridad !== 'mantencion');
  const veces = (ref: RefBloque, v: number) => actualizar((d) => fijarVeces(d, ref, v));

  return (
    <div>
      <Volver onClick={onVolver}>Ajustes</Volver>
      <Encabezado>Plan semanal</Encabezado>
      <p className="mt-1 text-sm text-texto2">{sesionesPlanificadas(datos)} sesiones por semana. Cada día eliges cuál hacer.</p>

      <section className="mt-5">
        <h2 className="text-sm text-texto2">Gym · veces por semana</h2>
        <ul className="mt-1 border-t border-linea">
          {rutina.plantillas.map((p) => (
            <li key={p.id} className="flex items-center gap-2 border-b border-linea">
              <button type="button" onClick={() => setPlantillaId(p.id)} className="min-w-0 flex-1 py-3 text-left">
                <span className="block text-[17px]">{p.nombre}</span>
                <span className="block text-sm text-texto2">
                  {plural(p.ejercicios.length, 'ejercicio')} · {plural(p.ejercicios.reduce((a, e) => a + e.series, 0), 'serie')}
                </span>
              </button>
              <Contador valor={p.vecesPorSemana} etiqueta={p.nombre} onCambio={(v) => veces({ clase: 'gym', plantillaId: p.id }, v)} />
            </li>
          ))}
        </ul>
        <Boton
          variante="texto"
          className="mt-1 !px-0"
          onClick={() => {
            const r = crearPlantilla(datos);
            actualizar(() => r.datos);
            setPlantillaId(r.id);
          }}
        >
          + Nueva sesión de gym
        </Boton>
      </section>

      <section className="mt-5">
        <h2 className="text-sm text-texto2">Running · veces por semana</h2>
        <ul className="mt-1 border-t border-linea">
          {TIPOS_RUNNING.map((t) => (
            <li key={t} className="flex items-center gap-2 border-b border-linea py-1">
              <span className="flex-1 text-[17px]">{NOMBRE_RUNNING[t]}</span>
              <Contador valor={rutina.running[t]} etiqueta={NOMBRE_RUNNING[t]} onCambio={(v) => veces({ clase: 'running', tipo: t }, v)} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-texto2">Series por músculo en una semana</h2>
          <PorQue id="volumen" />
        </div>
        <p className="mt-1 text-sm text-texto2">Toca un músculo para cambiar su prioridad.</p>
        <ul className="mt-2 border-t border-linea">
          {volumen.map((f) => (
            <li key={f.musculo} className="border-b border-linea">
              <button
                type="button"
                onClick={() => actualizar((d) => ({ ...d, rutina: { ...d.rutina, prioridades: { ...d.rutina.prioridades, [f.musculo]: ORDEN_PRIORIDAD[(ORDEN_PRIORIDAD.indexOf(f.prioridad) + 1) % 3] } } }))}
                className="flex w-full items-baseline justify-between gap-3 py-2.5 text-left"
              >
                <span className="text-[15px]">
                  {NOMBRE_MUSCULO[f.musculo]}
                  <span className="text-sm text-texto2">
                    {' '}
                    · {NOMBRE_PRIORIDAD[f.prioridad]} {f.objetivo[0]}–{f.objetivo[1]}
                  </span>
                </span>
                <span className="shrink-0">
                  {f.estado !== 'ok' && <span className="mr-2 text-sm text-texto2">{f.estado === 'bajo' ? 'bajo el rango' : 'sobre el rango'}</span>}
                  <span className="num text-xl">{fmt1(f.series)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 flex justify-center">
        <Boton variante="texto" disabled={!!datos.borradorGym} onClick={() => setEstandar(true)}>
          Partir de una rutina estándar
        </Boton>
      </div>

      <Hoja
        abierta={estandar}
        onCerrar={() => {
          setEstandar(false);
          setConfirmar(null);
        }}
        titulo={confirmar ? `¿Cambiar a ${RUTINAS_ESTANDAR.find((r) => r.id === confirmar)?.nombre}?` : 'Rutinas estándar'}
      >
        {confirmar ? (
          <>
            <p className="text-[15px] text-texto2">Tu plan actual se reemplaza. Tu historial queda intacto y tus ejercicios siguen disponibles en "Tus ejercicios".</p>
            <Boton
              className="mt-5"
              onClick={() => {
                actualizar((d) => aplicarRutinaEstandar(d, confirmar));
                setEstandar(false);
                setConfirmar(null);
              }}
            >
              Reemplazar mi plan
            </Boton>
          </>
        ) : (
          <div className="space-y-2">
            {RUTINAS_ESTANDAR.map((r) => (
              <button key={r.id} type="button" onClick={() => setConfirmar(r.id)} className="w-full rounded-xl border border-linea px-4 py-3 text-left">
                <span className="block text-[17px]">{r.nombre}</span>
                <span className="block text-sm text-texto2">{r.descripcion}</span>
              </button>
            ))}
          </div>
        )}
      </Hoja>
    </div>
  );
}

function EditorPlantilla({ id, onVolver }: { id: string; onVolver: () => void }) {
  const { datos, actualizar } = useDatos();
  const [editando, setEditando] = useState<EjercicioDef | 'nuevo' | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const plantilla = datos.rutina.plantillas.find((p) => p.id === id);

  if (!plantilla) {
    return (
      <div>
        <Volver onClick={onVolver}>Plan semanal</Volver>
        <p className="text-texto2">Esta sesión ya no existe.</p>
      </div>
    );
  }

  const enCurso = datos.borradorGym?.sesion.plantillaId === id;

  return (
    <div>
      <Volver onClick={onVolver}>Plan semanal</Volver>
      <Campo etiqueta="Nombre de la sesión" valor={plantilla.nombre} onCambio={(v) => actualizar((d) => renombrarPlantilla(d, id, v))} teclado="text" />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[15px]">Veces por semana</span>
        <Contador valor={plantilla.vecesPorSemana} etiqueta="veces por semana" onCambio={(v) => actualizar((d) => fijarVeces(d, { clase: 'gym', plantillaId: id }, v))} />
      </div>

      {plantilla.ejercicios.length ? (
        <ul className="mt-4 border-t border-linea">
          {plantilla.ejercicios.map((e, k) => (
            <li key={e.id} className="flex items-center gap-1 border-b border-linea">
              <button type="button" onClick={() => setEditando(e)} className="min-w-0 flex-1 py-3 text-left">
                <span className="block text-[15px]">
                  {e.nombre}
                  {e.esProtocoloTobillo && <span className="text-texto2"> · tobillo</span>}
                </span>
                <span className="block text-sm text-texto2">
                  {e.series} × {e.rangoReps[0]}–{e.rangoReps[1]}
                  {e.modo === 'tiempo' ? ' s' : ''} · {REGLAS_TIPO[e.tipo].etiqueta.toLowerCase()}
                </span>
              </button>
              <BotonIcono etiqueta="Subir" disabled={k === 0} onClick={() => actualizar((d) => moverEjercicio(d, id, k, -1))}>
                ↑
              </BotonIcono>
              <BotonIcono etiqueta="Bajar" disabled={k === plantilla.ejercicios.length - 1} onClick={() => actualizar((d) => moverEjercicio(d, id, k, 1))}>
                ↓
              </BotonIcono>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[15px] text-texto2">Todavía no tiene ejercicios.</p>
      )}
      <Boton variante="secundario" className="mt-4" onClick={() => setAgregando(true)}>
        Agregar ejercicio
      </Boton>

      <div className="mt-8">
        {confirmarEliminar ? (
          <Boton
            variante="peligro"
            onClick={() => {
              actualizar((d) => eliminarPlantilla(d, id));
              onVolver();
            }}
          >
            Sí, eliminar {plantilla.nombre}
          </Boton>
        ) : (
          <Boton variante="texto" className="w-full" disabled={enCurso} onClick={() => setConfirmarEliminar(true)}>
            Eliminar sesión
          </Boton>
        )}
        <p className="mt-1 text-center text-sm text-texto2">{enCurso ? 'Termina la sesión en curso para eliminarla.' : 'El historial de esta sesión se conserva.'}</p>
      </div>

      {agregando && (
        <SelectorEjercicio
          yaEsta={plantilla.ejercicios.map((e) => e.id)}
          onCerrar={() => setAgregando(false)}
          onElegir={(ejercicioId) => {
            const def = definicionPara(datos, ejercicioId);
            if (def) actualizar((d) => agregarEjercicio(d, id, def));
            setAgregando(false);
          }}
          onCrear={() => {
            setAgregando(false);
            setEditando('nuevo');
          }}
        />
      )}

      {editando && (
        <EditorEjercicio
          inicial={editando === 'nuevo' ? undefined : editando}
          onCerrar={() => setEditando(null)}
          onGuardar={(e) => {
            actualizar((d) => guardarEjercicio(d, id, e));
            setEditando(null);
          }}
          onQuitar={
            editando === 'nuevo'
              ? undefined
              : () => {
                  actualizar((d) => quitarEjercicio(d, id, editando.id));
                  setEditando(null);
                }
          }
        />
      )}
    </div>
  );
}

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

type Filtro = 'todos' | 'tuyos' | Grupo;

function SelectorEjercicio({ yaEsta, onElegir, onCrear, onCerrar }: { yaEsta: string[]; onElegir: (id: string) => void; onCrear: () => void; onCerrar: () => void }) {
  const { datos } = useDatos();
  const [buscar, setBuscar] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const tuyos = misEjercicios(datos);
  const q = sinTildes(buscar.trim());
  const coincide = (nombre: string) => !q || sinTildes(nombre).includes(q);

  const filas = [
    ...(filtro === 'todos' || filtro === 'tuyos' ? tuyos.map((e) => ({ id: e.id, nombre: e.nombre, sub: 'Tuyo' })) : []),
    ...(filtro === 'tuyos' ? [] : CATALOGO.filter((c) => filtro === 'todos' || c.grupo === filtro).map((c) => ({ id: c.id, nombre: c.nombre, sub: NOMBRE_GRUPO[c.grupo] }))),
  ].filter((f) => coincide(f.nombre));

  const filtros: [Filtro, string][] = [['todos', 'Todos'], ...(tuyos.length ? ([['tuyos', 'Tuyos']] as [Filtro, string][]) : []), ...(Object.entries(NOMBRE_GRUPO) as [Grupo, string][])];

  return (
    <Hoja abierta onCerrar={onCerrar} titulo="Agregar ejercicio">
      <Campo etiqueta="Buscar" valor={buscar} onCambio={setBuscar} teclado="text" placeholder="press, remo, sentadilla…" />
      <div className="sin-barra -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
        {filtros.map(([v, e]) => (
          <button key={v} type="button" onClick={() => setFiltro(v)} aria-pressed={filtro === v} className={`h-9 shrink-0 rounded-full px-3.5 text-sm ${filtro === v ? 'bg-texto text-fondo' : 'border border-linea text-texto2'}`}>
            {e}
          </button>
        ))}
      </div>
      {filas.length ? (
        <ul className="mt-2 divide-y divide-linea border-y border-linea">
          {filas.map((f) => {
            const esta = yaEsta.includes(f.id);
            return (
              <li key={f.id}>
                <button type="button" disabled={esta} onClick={() => onElegir(f.id)} className="flex w-full items-baseline justify-between gap-3 py-3 text-left disabled:opacity-40">
                  <span className="text-[15px]">{f.nombre}</span>
                  <span className="shrink-0 text-sm text-texto2">{esta ? 'ya está' : f.sub}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-[15px] text-texto2">No hay ejercicios con ese nombre.</p>
      )}
      <Boton variante="secundario" className="mt-4" onClick={onCrear}>
        Crear ejercicio propio
      </Boton>
    </Hoja>
  );
}

function Selector<T extends string>({ etiqueta, valor, opciones, onCambio }: { etiqueta: string; valor: T; opciones: [T, string][]; onCambio: (v: T) => void }) {
  return (
    <label className="block">
      <span className="text-sm text-texto2">{etiqueta}</span>
      <select value={valor} onChange={(e) => onCambio(e.target.value as T)} className="mt-1 h-12 w-full rounded-xl border border-linea bg-fondo px-3 text-[17px] text-texto">
        {opciones.map(([v, e]) => (
          <option key={v} value={v}>
            {e}
          </option>
        ))}
      </select>
    </label>
  );
}

function Chips({ valores, onCambio, excluir = [] }: { valores: Musculo[]; onCambio: (v: Musculo[]) => void; excluir?: Musculo[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MUSCULOS.filter((m) => !excluir.includes(m)).map((m) => {
        const activo = valores.includes(m);
        return (
          <button key={m} type="button" aria-pressed={activo} onClick={() => onCambio(activo ? valores.filter((x) => x !== m) : [...valores, m])} className={`h-9 rounded-full px-3 text-sm ${activo ? 'bg-texto text-fondo' : 'border border-linea text-texto2'}`}>
            {NOMBRE_MUSCULO[m]}
          </button>
        );
      })}
    </div>
  );
}

const TIPOS = Object.entries(REGLAS_TIPO).map(([k, r]) => [k, r.etiqueta]) as [TipoEjercicio, string][];
const MODOS: [ModoRegistro, string][] = [
  ['carga', 'Peso × reps'],
  ['reps', 'Solo reps'],
  ['tiempo', 'Segundos'],
];

function EditorEjercicio({ inicial, onGuardar, onQuitar, onCerrar }: { inicial?: EjercicioDef; onGuardar: (e: EjercicioDef) => void; onQuitar?: () => void; onCerrar: () => void }) {
  const base = inicial ?? { tipo: 'aislamiento' as TipoEjercicio, modo: 'carga' as ModoRegistro, rangoReps: REGLAS_TIPO.aislamiento.rango, series: 3, incrementoKg: REGLAS_TIPO.aislamiento.incrementoKg };
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [tipo, setTipo] = useState<TipoEjercicio>(base.tipo);
  const [modo, setModo] = useState<ModoRegistro>(base.modo);
  const [min, setMin] = useState(deNum(base.rangoReps[0]));
  const [max, setMax] = useState(deNum(base.rangoReps[1]));
  const [series, setSeries] = useState(deNum(base.series));
  const [incremento, setIncremento] = useState(deNum(base.incrementoKg));
  const [pesoInicial, setPesoInicial] = useState(deNum(inicial?.pesoInicial));
  const [musculos, setMusculos] = useState<Musculo[]>(inicial?.musculos ?? []);
  const [secundarios, setSecundarios] = useState<Musculo[]>(inicial?.secundarios ?? []);
  const [tobillo, setTobillo] = useState(!!inicial?.esProtocoloTobillo);
  const [porLado, setPorLado] = useState(!!inicial?.porLado);
  const [nota, setNota] = useState(inicial?.nota ?? '');
  const [error, setError] = useState('');
  const [confirmarQuitar, setConfirmarQuitar] = useState(false);

  const cambiarTipo = (t: TipoEjercicio) => {
    setTipo(t);
    setMin(deNum(REGLAS_TIPO[t].rango[0]));
    setMax(deNum(REGLAS_TIPO[t].rango[1]));
    setIncremento(deNum(REGLAS_TIPO[t].incrementoKg));
  };

  const guardar = () => {
    const mn = aNum(min);
    const mx = aNum(max);
    const se = aNum(series);
    if (!nombre.trim() || !mn || !mx || mn > mx || !se || se < 1) {
      setError('Revisa el nombre, el rango (mínimo ≤ máximo) y las series.');
      return;
    }
    const pi = aNum(pesoInicial);
    onGuardar({
      id: inicial?.id ?? nuevoId(),
      nombre: nombre.trim(),
      tipo,
      modo,
      rangoReps: [Math.round(mn), Math.round(mx)],
      series: Math.round(se),
      incrementoKg: modo === 'carga' ? (aNum(incremento) ?? REGLAS_TIPO[tipo].incrementoKg) : 0,
      musculos,
      secundarios: secundarios.filter((m) => !musculos.includes(m)),
      pesoInicial: modo === 'carga' && pi !== null ? pi : undefined,
      esProtocoloTobillo: tobillo || undefined,
      porLado: porLado || undefined,
      nota: nota.trim() || undefined,
    });
  };

  return (
    <Hoja abierta onCerrar={onCerrar} titulo={inicial ? 'Editar ejercicio' : 'Nuevo ejercicio'}>
      <div className="space-y-3">
        <Campo etiqueta="Nombre" valor={nombre} onCambio={setNombre} teclado="text" />
        <div className="grid grid-cols-2 gap-3">
          <Selector etiqueta="Tipo" valor={tipo} opciones={TIPOS} onCambio={cambiarTipo} />
          <Selector etiqueta="Registro" valor={modo} opciones={MODOS} onCambio={setModo} />
          <Campo etiqueta={modo === 'tiempo' ? 'Mínimo (s)' : 'Reps mínimas'} valor={min} onCambio={setMin} teclado="numeric" />
          <Campo etiqueta={modo === 'tiempo' ? 'Máximo (s)' : 'Reps máximas'} valor={max} onCambio={setMax} teclado="numeric" />
          <Campo etiqueta="Series" valor={series} onCambio={setSeries} teclado="numeric" />
          {modo === 'carga' && <Campo etiqueta="Incremento" valor={incremento} onCambio={setIncremento} unidad="kg" />}
          {modo === 'carga' && <Campo etiqueta="Peso inicial" valor={pesoInicial} onCambio={setPesoInicial} unidad="kg" placeholder="por confirmar" />}
        </div>
        <div>
          <p className="mb-2 text-sm text-texto2">Músculo principal (cuenta 1 serie)</p>
          <Chips valores={musculos} onCambio={setMusculos} />
        </div>
        <div>
          <p className="mb-2 text-sm text-texto2">Secundarios (cuentan 0,5)</p>
          <Chips valores={secundarios} onCambio={setSecundarios} excluir={musculos} />
        </div>
        <Campo etiqueta="Nota (opcional)" valor={nota} onCambio={setNota} teclado="text" />
        <div>
          <Casilla marcada={porLado} onCambio={setPorLado}>
            Se hace por lado
          </Casilla>
          <Casilla marcada={tobillo} onCambio={setTobillo}>
            Protocolo de tobillo (obligatorio para cerrar la sesión)
          </Casilla>
        </div>
        {inicial && <p className="text-sm text-texto2">Los cambios (salvo las series) se aplican a este ejercicio en todas tus sesiones. El historial se conserva.</p>}
        {error && <p className="text-sm text-alerta">{error}</p>}
        <Boton onClick={guardar}>Guardar ejercicio</Boton>
        {onQuitar &&
          (confirmarQuitar ? (
            <Boton variante="peligro" onClick={onQuitar}>
              Sí, quitar de esta sesión
            </Boton>
          ) : (
            <Boton variante="texto" className="w-full" onClick={() => setConfirmarQuitar(true)}>
              Quitar de esta sesión
            </Boton>
          ))}
      </div>
    </Hoja>
  );
}
