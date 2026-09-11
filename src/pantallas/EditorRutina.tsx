import { useState, type ReactNode } from 'react';
import type { EjercicioDef, ModoRegistro, Musculo, PasoSecuencia, PlantillaGym, Rutina, TipoEjercicio } from '../tipos/modelo';
import { useDatos } from '../almacen/contexto';
import { nuevoId } from '../almacen/storage';
import { aNum, Boton, Campo, Casilla, deNum, Encabezado, Fila, Hoja, Volver } from '../componentes/ui';
import { PorQue } from '../componentes/PorQue';
import { MUSCULOS, NOMBRE_MUSCULO, NOMBRE_PRIORIDAD, REGLAS_TIPO } from '../data/reglas-tipo';
import { fmt1 } from '../motor/formato';
import { nombrePaso } from '../motor/secuencia';
import { analisisVolumen } from '../motor/volumen';

const ORDEN_PRIORIDAD = ['alta', 'media', 'mantencion'] as const;

// Omit distributivo: conserva cada variante de la unión PasoSecuencia.
type SinId<T> = T extends unknown ? Omit<T, 'id'> : never;

function mover<T>(xs: T[], k: number, d: number): T[] {
  const j = k + d;
  if (j < 0 || j >= xs.length) return xs;
  const c = [...xs];
  [c[k], c[j]] = [c[j], c[k]];
  return c;
}

function BotonIcono({ etiqueta, children, onClick, disabled }: { etiqueta: string; children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" aria-label={etiqueta} disabled={disabled} onClick={onClick} className="h-10 w-10 shrink-0 rounded-lg text-lg text-texto2 active:bg-superficie disabled:opacity-25">
      {children}
    </button>
  );
}

export function EditorRutina({ onVolver }: { onVolver: () => void }) {
  const { datos, actualizar } = useDatos();
  const [plantillaId, setPlantillaId] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);
  const { rutina } = datos;

  const cambiarRutina = (f: (r: Rutina) => Rutina) => actualizar((d) => ({ ...d, rutina: f(d.rutina) }));

  // Al editar la secuencia, la cola sigue apuntando al mismo paso (no al mismo índice).
  const cambiarSecuencia = (f: (s: PasoSecuencia[]) => PasoSecuencia[]) =>
    actualizar((d) => {
      const n = d.rutina.secuencia.length;
      const actual = n ? d.rutina.secuencia[d.cola.posicion % n]?.id : undefined;
      const secuencia = f(d.rutina.secuencia);
      const idx = secuencia.findIndex((p) => p.id === actual);
      const posicion = idx >= 0 ? idx : Math.min(d.cola.posicion, Math.max(0, secuencia.length - 1));
      return { ...d, rutina: { ...d.rutina, secuencia }, cola: { ...d.cola, posicion } };
    });

  if (plantillaId) return <EditorPlantilla id={plantillaId} onVolver={() => setPlantillaId(null)} />;

  const volumen = analisisVolumen(rutina);
  const posicionActual = rutina.secuencia.length ? datos.cola.posicion % rutina.secuencia.length : -1;

  const nuevaPlantilla = () => {
    const p: PlantillaGym = { id: nuevoId(), nombre: 'Nueva sesión', ejercicios: [] };
    cambiarRutina((r) => ({ ...r, plantillas: [...r.plantillas, p] }));
    setPlantillaId(p.id);
  };

  const agregarPaso = (p: SinId<PasoSecuencia>) => {
    cambiarSecuencia((s) => [...s, { ...p, id: nuevoId() } as PasoSecuencia]);
    setAgregando(false);
  };

  return (
    <div>
      <Volver onClick={onVolver}>Ajustes</Volver>
      <Encabezado>Rutina</Encabezado>

      <section className="mt-4">
        <h2 className="text-sm text-texto2">Sesiones de gym</h2>
        {rutina.plantillas.map((p) => (
          <Fila key={p.id} titulo={p.nombre} sub={`${p.ejercicios.length} ejercicios · ${p.ejercicios.reduce((a, e) => a + e.series, 0)} series`} onClick={() => setPlantillaId(p.id)} />
        ))}
        <Boton variante="texto" className="mt-1 !px-0" onClick={nuevaPlantilla}>
          + Nueva sesión de gym
        </Boton>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-texto2">Secuencia de una vuelta</h2>
          <PorQue id="secuencia" />
        </div>
        <ol className="mt-1 border-t border-linea">
          {rutina.secuencia.map((p, k) => (
            <li key={p.id} className="flex items-center gap-1 border-b border-linea py-1">
              <span className="num w-7 text-lg text-texto2">{k + 1}</span>
              <span className="flex-1 text-[15px]">
                {nombrePaso(p, rutina)}
                {k === posicionActual && <span className="text-acento"> · próxima</span>}
              </span>
              <BotonIcono etiqueta="Subir" disabled={k === 0} onClick={() => cambiarSecuencia((s) => mover(s, k, -1))}>
                ↑
              </BotonIcono>
              <BotonIcono etiqueta="Bajar" disabled={k === rutina.secuencia.length - 1} onClick={() => cambiarSecuencia((s) => mover(s, k, 1))}>
                ↓
              </BotonIcono>
              <BotonIcono etiqueta="Quitar" onClick={() => cambiarSecuencia((s) => s.filter((x) => x.id !== p.id))}>
                ×
              </BotonIcono>
            </li>
          ))}
        </ol>
        <Boton variante="texto" className="mt-1 !px-0" onClick={() => setAgregando(true)}>
          + Agregar paso
        </Boton>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-texto2">Series por músculo en una vuelta</h2>
          <PorQue id="volumen" />
        </div>
        <p className="mt-1 text-sm text-texto2">Secundarios cuentan 0,5. Toca un músculo para cambiar su prioridad.</p>
        <ul className="mt-2 border-t border-linea">
          {volumen.map((f) => (
            <li key={f.musculo} className="border-b border-linea">
              <button
                type="button"
                onClick={() => cambiarRutina((r) => ({ ...r, prioridades: { ...r.prioridades, [f.musculo]: ORDEN_PRIORIDAD[(ORDEN_PRIORIDAD.indexOf(f.prioridad) + 1) % 3] } }))}
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

      <Hoja abierta={agregando} onCerrar={() => setAgregando(false)} titulo="Agregar paso">
        <div className="space-y-2">
          {rutina.plantillas.map((p) => (
            <Boton key={p.id} variante="secundario" onClick={() => agregarPaso({ clase: 'gym', plantillaId: p.id })}>
              {p.nombre}
            </Boton>
          ))}
          <Boton variante="secundario" onClick={() => agregarPaso({ clase: 'running', tipo: 'z2' })}>
            Running Z2
          </Boton>
          <Boton variante="secundario" onClick={() => agregarPaso({ clase: 'running', tipo: 'calidad' })}>
            Running calidad
          </Boton>
          <Boton variante="secundario" onClick={() => agregarPaso({ clase: 'running', tipo: 'fondo' })}>
            Fondo largo
          </Boton>
          <Boton variante="secundario" onClick={() => agregarPaso({ clase: 'libre' })}>
            Libre
          </Boton>
        </div>
      </Hoja>
    </div>
  );
}

function EditorPlantilla({ id, onVolver }: { id: string; onVolver: () => void }) {
  const { datos, actualizar } = useDatos();
  const [editando, setEditando] = useState<EjercicioDef | 'nuevo' | null>(null);
  const plantilla = datos.rutina.plantillas.find((p) => p.id === id);

  if (!plantilla) {
    return (
      <div>
        <Volver onClick={onVolver}>Rutina</Volver>
        <p className="text-texto2">Esta sesión ya no existe.</p>
      </div>
    );
  }

  const enUso = datos.rutina.secuencia.some((p) => p.clase === 'gym' && p.plantillaId === id);
  const cambiar = (f: (p: PlantillaGym) => PlantillaGym) => actualizar((d) => ({ ...d, rutina: { ...d.rutina, plantillas: d.rutina.plantillas.map((p) => (p.id === id ? f(p) : p)) } }));

  const guardarEjercicio = (e: EjercicioDef) => {
    cambiar((p) => ({ ...p, ejercicios: p.ejercicios.some((x) => x.id === e.id) ? p.ejercicios.map((x) => (x.id === e.id ? e : x)) : [...p.ejercicios, e] }));
    setEditando(null);
  };

  return (
    <div>
      <Volver onClick={onVolver}>Rutina</Volver>
      <Campo etiqueta="Nombre de la sesión" valor={plantilla.nombre} onCambio={(v) => cambiar((p) => ({ ...p, nombre: v }))} teclado="text" />

      <ul className="mt-5 border-t border-linea">
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
            <BotonIcono etiqueta="Subir" disabled={k === 0} onClick={() => cambiar((p) => ({ ...p, ejercicios: mover(p.ejercicios, k, -1) }))}>
              ↑
            </BotonIcono>
            <BotonIcono etiqueta="Bajar" disabled={k === plantilla.ejercicios.length - 1} onClick={() => cambiar((p) => ({ ...p, ejercicios: mover(p.ejercicios, k, 1) }))}>
              ↓
            </BotonIcono>
          </li>
        ))}
      </ul>
      <Boton variante="secundario" className="mt-4" onClick={() => setEditando('nuevo')}>
        Agregar ejercicio
      </Boton>

      <div className="mt-8">
        <Boton
          variante="peligro"
          disabled={enUso}
          onClick={() => {
            actualizar((d) => ({ ...d, rutina: { ...d.rutina, plantillas: d.rutina.plantillas.filter((p) => p.id !== id) } }));
            onVolver();
          }}
        >
          Eliminar sesión
        </Boton>
        {enUso && <p className="mt-2 text-sm text-texto2">Para eliminarla, primero quítala de la secuencia. El historial se conserva siempre.</p>}
      </div>

      {editando && (
        <EditorEjercicio
          inicial={editando === 'nuevo' ? undefined : editando}
          onCerrar={() => setEditando(null)}
          onGuardar={guardarEjercicio}
          onQuitar={
            editando === 'nuevo'
              ? undefined
              : () => {
                  cambiar((p) => ({ ...p, ejercicios: p.ejercicios.filter((x) => x.id !== editando.id) }));
                  setEditando(null);
                }
          }
        />
      )}
    </div>
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
        {inicial && <p className="text-sm text-texto2">Cambiar el nombre o el tipo no borra el historial de este ejercicio.</p>}
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
