import { useEffect, useMemo, useState } from 'react';
import type { BorradorGym, EjercicioDef, SerieRegistrada } from '../tipos/modelo';
import { useDatos } from '../almacen/contexto';
import { Boton, Casilla, Hoja } from '../componentes/ui';
import { PorQue } from '../componentes/PorQue';
import { Stepper } from '../componentes/Stepper';
import { REGLAS_TIPO } from '../data/reglas-tipo';
import { fmt0, fmt2, rangoDescanso, segundosAMinTexto } from '../motor/formato';
import { historialDe, sugerir } from '../motor/progresion';
import { faltantesTobillo, terminarGym } from '../motor/sesiones';

type ModoPanel = 'confirmar' | 'editar' | 'siguiente' | 'terminar';

function textoSerie(def: EjercicioDef, s: SerieRegistrada): string {
  if (def.modo === 'carga') return `${fmt2(s.peso)} × ${s.reps}`;
  return def.modo === 'tiempo' ? `${s.reps} s` : `${s.reps}`;
}

export function RegistroGym({ onMinimizar }: { onMinimizar: () => void }) {
  const { datos, actualizar } = useDatos();
  const b = datos.borradorGym!;
  const plantilla = datos.rutina.plantillas.find((p) => p.id === b.sesion.plantillaId);
  const ejercicios = plantilla?.ejercicios ?? [];
  const i = Math.min(b.indiceEjercicio, Math.max(0, ejercicios.length - 1));
  const def = ejercicios[i] as EjercicioDef | undefined;
  const hechas = b.sesion.ejercicios.find((e) => e.ejercicioId === def?.id)?.series ?? [];
  const sug = useMemo(() => (def ? sugerir(def, historialDe(def.id, datos.sesionesGym), b.sesion.descarga) : null), [def, datos.sesionesGym, b.sesion.descarga]);

  const [editando, setEditando] = useState<number | null>(null);
  const [descansoDesde, setDescansoDesde] = useState<number | null>(null);
  const [ahora, setAhora] = useState(Date.now());
  const [hojaSalir, setHojaSalir] = useState(false);
  const [confirmarDescarte, setConfirmarDescarte] = useState(false);
  const [hojaTerminar, setHojaTerminar] = useState(false);

  useEffect(() => {
    if (descansoDesde === null) return;
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [descansoDesde]);

  const cambiarBorrador = (f: (x: BorradorGym) => BorradorGym) => actualizar((d) => (d.borradorGym ? { ...d, borradorGym: f(d.borradorGym) } : d));
  const irA = (j: number) => {
    setEditando(null);
    cambiarBorrador((x) => ({ ...x, indiceEjercicio: j }));
  };

  if (!def || !sug) {
    return (
      <div className="mx-auto max-w-md px-5 pt-10">
        <p className="text-texto2">Esta sesión no tiene ejercicios. Agrégalos en Más › Ajustes › Rutina.</p>
        <Boton className="mt-6" variante="secundario" onClick={() => actualizar((d) => ({ ...d, borradorGym: undefined }))}>
          Cerrar
        </Boton>
      </div>
    );
  }

  const regla = REGLAS_TIPO[def.tipo];
  const [min] = def.rangoReps;
  const completo = hechas.length >= sug.series;
  const ultimoEjercicio = i >= ejercicios.length - 1;
  const segundos = descansoDesde ? Math.floor((ahora - descansoDesde) / 1000) : 0;
  const esCalistenia = def.tipo === 'calistenia_peso_corporal';
  const lineaFallo = def.tipo === 'compuesto_pesado' || b.sesion.descarga ? ' · sin fallo' : esCalistenia ? ' · fallo solo sin lastre, en la última' : regla.falloUltimaSerie ? ' · fallo solo en la última' : '';
  const faltan = faltantesTobillo(datos);

  const escribirSeries = (series: SerieRegistrada[]) => {
    const orden = (id: string) => ejercicios.findIndex((e) => e.id === id);
    cambiarBorrador((x) => {
      const otros = x.sesion.ejercicios.filter((e) => e.ejercicioId !== def.id);
      const lista = [...otros, { ejercicioId: def.id, nombre: def.nombre, series }].sort((a, c) => orden(a.ejercicioId) - orden(c.ejercicioId));
      return { ...x, sesion: { ...x.sesion, ejercicios: lista } };
    });
  };

  const confirmar = (serie: SerieRegistrada) => {
    if (editando !== null) {
      escribirSeries(hechas.map((s, k) => (k === editando ? serie : s)));
      setEditando(null);
      return;
    }
    escribirSeries([...hechas, serie]);
    setDescansoDesde(Date.now());
    setAhora(Date.now());
    if (hechas.length + 1 >= sug.series && !ultimoEjercicio) cambiarBorrador((x) => ({ ...x, indiceEjercicio: i + 1 }));
  };

  const borrarSerie = () => {
    if (editando === null) return;
    escribirSeries(hechas.filter((_, k) => k !== editando));
    setEditando(null);
  };

  const objetivo = (k: number) => {
    const r = sug.reps[k] ?? sug.reps.at(-1) ?? min;
    if (def.modo !== 'carga') return def.modo === 'tiempo' ? `${r} s` : `${r}`;
    return sug.peso !== null ? `${fmt2(sug.peso)} × ${r}` : `– × ${r}`;
  };

  // Valores con que parte el panel: la serie que editas, o lo sugerido / lo último de hoy.
  const ultima = hechas.at(-1);
  const inicial: SerieRegistrada =
    editando !== null && hechas[editando]
      ? hechas[editando]
      : { peso: ultima?.peso ?? sug.peso ?? 0, reps: sug.reps[hechas.length] ?? ultima?.reps ?? def.rangoReps[0] };
  const modo: ModoPanel = editando !== null ? 'editar' : completo ? (ultimoEjercicio ? 'terminar' : 'siguiente') : 'confirmar';

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-[calc(0.5rem+env(safe-area-inset-top))]">
      <header className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => setHojaSalir(true)} className="h-11 text-texto2">
          Salir
        </button>
        <span className="truncate text-sm text-texto2">
          {b.sesion.nombre} · {i + 1} de {ejercicios.length}
          {b.sesion.descarga ? ' · descarga' : ''}
        </span>
        <button type="button" onClick={() => setHojaTerminar(true)} className="h-11 font-medium text-acento">
          Terminar
        </button>
      </header>

      <section className="mt-3">
        <div className="flex items-start gap-3">
          <h1 className="flex-1 text-2xl font-semibold leading-tight">{def.nombre}</h1>
          <PorQue id={sug.porQue} />
        </div>
        <p className="mt-1 text-[15px] leading-snug">{sug.texto}</p>
        {sug.saltoPct && (
          <div className="mt-1 flex items-start gap-3">
            <p className="flex-1 text-sm text-texto2">
              Salto de {fmt0(sug.saltoPct)} %: si no llegas a {min}, vuelve al peso anterior.
            </p>
            <PorQue id="incremento" />
          </div>
        )}
        {def.modo === 'carga' && (
          <div className="mt-2 flex items-center gap-3">
            <p className="flex-1 text-sm text-texto2">Bajada 2–3 s · deja 1–2 reps{lineaFallo}</p>
            <PorQue id="tecnica" />
          </div>
        )}
        {def.nota && <p className="mt-1 text-sm text-texto2">{def.nota}</p>}
      </section>

      <ol className="mt-3 divide-y divide-linea border-y border-linea">
        {Array.from({ length: Math.max(sug.series, hechas.length) }, (_, k) => {
          const s = hechas[k];
          if (s) {
            return (
              <li key={k}>
                <button type="button" onClick={() => setEditando(editando === k ? null : k)} className="flex h-11 w-full items-center gap-3 text-left">
                  <span className={`w-20 text-sm ${editando === k ? 'text-acento' : 'text-texto2'}`}>{editando === k ? 'Editando' : `Serie ${k + 1}`}</span>
                  <span className="num flex-1 text-xl">
                    {textoSerie(def, s)}
                    {s.alFallo ? ' · fallo' : ''}
                  </span>
                  <span aria-hidden className="text-acento">
                    ✓
                  </span>
                </button>
              </li>
            );
          }
          const actual = k === hechas.length && editando === null;
          return (
            <li key={k} className="flex h-11 items-center gap-3">
              <span className={`w-20 text-sm ${actual ? 'text-texto' : 'text-texto2'}`}>{actual ? 'Ahora' : `Serie ${k + 1}`}</span>
              <span className={`num flex-1 text-xl ${actual ? 'text-texto' : 'text-texto2'}`}>{objetivo(k)}</span>
            </li>
          );
        })}
      </ol>

      {descansoDesde !== null && segundos < 600 && (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-texto2">Descanso</span>
          <span className="num text-3xl">{segundosAMinTexto(segundos)}</span>
          <span className="flex-1 text-sm text-texto2">{rangoDescanso(regla.descansoSeg)}</span>
          <PorQue id={regla.porQueDescanso} />
        </div>
      )}

      <div className="min-h-4 flex-1" />

      <PanelSerie
        key={`${def.id}:${hechas.length}:${editando ?? '-'}`}
        def={def}
        inicial={inicial}
        esUltimaSerie={(editando ?? hechas.length) === sug.series - 1}
        descarga={b.sesion.descarga}
        modo={modo}
        onConfirmar={confirmar}
        onAvanzar={() => (modo === 'terminar' ? setHojaTerminar(true) : irA(i + 1))}
        onBorrar={borrarSerie}
        onAnterior={() => irA(i - 1)}
        onSiguiente={() => irA(i + 1)}
        hayAnterior={i > 0}
        haySiguiente={!ultimoEjercicio}
      />

      <Hoja
        abierta={hojaSalir}
        onCerrar={() => {
          setHojaSalir(false);
          setConfirmarDescarte(false);
        }}
        titulo="Salir de la sesión"
      >
        <p className="text-[15px] text-texto2">La sesión queda guardada como borrador y puedes seguir desde Hoy.</p>
        <div className="mt-5 space-y-2">
          <Boton onClick={onMinimizar}>Seguir después</Boton>
          {confirmarDescarte ? (
            <Boton variante="peligro" onClick={() => actualizar((d) => ({ ...d, borradorGym: undefined }))}>
              Sí, descartar las series de hoy
            </Boton>
          ) : (
            <Boton variante="secundario" onClick={() => setConfirmarDescarte(true)}>
              Descartar sesión
            </Boton>
          )}
        </div>
      </Hoja>

      <Hoja abierta={hojaTerminar} onCerrar={() => setHojaTerminar(false)} titulo={faltan.length ? 'Falta el protocolo de tobillo' : `¿Terminar ${b.sesion.nombre}?`}>
        {faltan.length ? (
          <>
            <div className="flex items-start gap-3">
              <p className="flex-1 text-[15px] leading-relaxed">Esta sesión no se cierra sin el trabajo de tobillo: es lo que construye la capacidad que te falta para correr sin molestias.</p>
              <PorQue id="tobillo_protocolo" />
            </div>
            <div className="mt-4 space-y-2">
              {faltan.map((e) => (
                <Boton
                  key={e.id}
                  variante="secundario"
                  onClick={() => {
                    irA(ejercicios.findIndex((x) => x.id === e.id));
                    setHojaTerminar(false);
                  }}
                >
                  Ir a {e.nombre}
                </Boton>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-[15px] text-texto2">
              {b.sesion.ejercicios.filter((e) => e.series.length).length} de {ejercicios.length} ejercicios con series registradas.
            </p>
            <Boton className="mt-5" onClick={() => actualizar(terminarGym)}>
              Guardar sesión
            </Boton>
          </>
        )}
      </Hoja>
    </div>
  );
}

// Parte con los valores sugeridos en su estado inicial; el padre lo reinicia con `key` en cada serie.
function PanelSerie({
  def,
  inicial,
  esUltimaSerie,
  descarga,
  modo,
  onConfirmar,
  onAvanzar,
  onBorrar,
  onAnterior,
  onSiguiente,
  hayAnterior,
  haySiguiente,
}: {
  def: EjercicioDef;
  inicial: SerieRegistrada;
  esUltimaSerie: boolean;
  descarga: boolean;
  modo: ModoPanel;
  onConfirmar: (s: SerieRegistrada) => void;
  onAvanzar: () => void;
  onBorrar: () => void;
  onAnterior: () => void;
  onSiguiente: () => void;
  hayAnterior: boolean;
  haySiguiente: boolean;
}) {
  const [peso, setPeso] = useState(inicial.peso);
  const [reps, setReps] = useState(inicial.reps);
  const [fallo, setFallo] = useState(!!inicial.alFallo);

  // Fallo real: solo en la última serie de aislamiento, o de calistenia sin lastre. Nunca en descarga.
  const esCalistenia = def.tipo === 'calistenia_peso_corporal';
  const puedeFallo = def.modo === 'carga' && !descarga && esUltimaSerie && (REGLAS_TIPO[def.tipo].falloUltimaSerie || (esCalistenia && peso === 0));
  const unidadReps = def.modo === 'tiempo' ? (def.porLado ? 's por lado' : 's') : def.porLado ? 'reps por lado' : 'reps';
  const serie = (): SerieRegistrada => ({ peso: def.modo === 'carga' ? peso : 0, reps: Math.round(reps), ...(fallo && puedeFallo ? { alFallo: true } : {}) });
  const resumen = def.modo === 'carga' ? `${fmt2(peso)} × ${Math.round(reps)}` : `${Math.round(reps)}${def.modo === 'tiempo' ? ' s' : ''}`;
  const texto = { confirmar: `Confirmar serie · ${resumen}`, editar: 'Guardar cambio', siguiente: 'Siguiente ejercicio', terminar: 'Terminar sesión' }[modo];
  // Una serie en 0 kg (fuera de calistenia) es casi siempre un olvido y ensuciaría la progresión.
  const faltaPeso = def.modo === 'carga' && !esCalistenia && peso <= 0 && (modo === 'confirmar' || modo === 'editar');

  return (
    <section>
      <div className="flex gap-4">
        {def.modo === 'carga' && <Stepper valor={peso} onCambio={setPeso} paso={Math.min(def.incrementoKg || 2.5, 2.5)} unidad={esCalistenia ? 'kg de lastre' : 'kg'} />}
        <Stepper valor={reps} onCambio={(v) => setReps(Math.round(v))} paso={def.modo === 'tiempo' ? 5 : 1} unidad={unidadReps} />
      </div>
      {puedeFallo && (modo === 'confirmar' || modo === 'editar') && (
        <div className="mt-2">
          <Casilla marcada={fallo} onCambio={setFallo}>
            Llegué al fallo en esta serie
          </Casilla>
        </div>
      )}
      <Boton className="mt-4" disabled={faltaPeso} onClick={() => (modo === 'confirmar' || modo === 'editar' ? onConfirmar(serie()) : onAvanzar())}>
        {faltaPeso ? 'Ingresa el peso' : texto}
      </Boton>
      <div className="mt-1 flex items-center justify-between">
        <Boton variante="texto" disabled={!hayAnterior} onClick={onAnterior}>
          Anterior
        </Boton>
        {modo === 'editar' ? (
          <Boton variante="texto" onClick={onBorrar}>
            Borrar serie
          </Boton>
        ) : modo === 'siguiente' || modo === 'terminar' ? (
          <Boton variante="texto" onClick={() => onConfirmar(serie())}>
            Serie extra
          </Boton>
        ) : null}
        <Boton variante="texto" disabled={!haySiguiente} onClick={onSiguiente}>
          Siguiente
        </Boton>
      </div>
    </section>
  );
}
