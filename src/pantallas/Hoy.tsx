import { useState } from 'react';
import type { Tab } from '../App';
import type { Datos, EjercicioDef, PasoSecuencia } from '../tipos/modelo';
import { useDatos } from '../almacen/contexto';
import { Aviso, Boton, Hoja, Nota } from '../componentes/ui';
import { PorQue } from '../componentes/PorQue';
import { FormRunning } from './FormRunning';
import { alertas, ajustesRunning } from '../motor/alertas';
import { pendientes } from '../motor/benchmarks';
import { fmt0, fmt1, fmt2 } from '../motor/formato';
import { historialDe, sugerir, type Sugerencia } from '../motor/progresion';
import { prescribir, type Prescripcion } from '../motor/running';
import { completarPaso, contexto, nombrePaso, pasoActual, proximos, ultimaSesionHoy, type Contexto } from '../motor/secuencia';
import { iniciarGym } from '../motor/sesiones';

export function Hoy({ onIr, onAbrirRegistro }: { onIr: (t: Tab) => void; onAbrirRegistro: () => void }) {
  const { datos, actualizar } = useDatos();
  const [confirmarSalto, setConfirmarSalto] = useState(false);
  const [formRunning, setFormRunning] = useState(false);
  const ahora = new Date();
  const ctx = contexto(datos.cola);
  const paso = pasoActual(datos.rutina, datos.cola);

  if (!paso) {
    return <p className="text-texto2">La secuencia está vacía. Agrega sesiones en Más › Ajustes › Rutina.</p>;
  }

  const nombre = nombrePaso(paso, datos.rutina);
  const despues = proximos(datos.rutina, datos.cola, 3).map((p) => nombrePaso(p, datos.rutina));
  const avisos = alertas(datos, ahora);
  const pend = pendientes(datos, ctx);
  const previa = ultimaSesionHoy(datos, ahora);
  const prescripcion = paso.clase === 'running' ? prescribir(paso.tipo, datos, ctx, ajustesRunning(datos, ahora, ctx)) : null;
  const plantilla = paso.clase === 'gym' ? datos.rutina.plantillas.find((p) => p.id === paso.plantillaId) : undefined;
  const enCurso = datos.borradorGym;

  const principal = () => {
    if (enCurso) return onAbrirRegistro();
    if (paso.clase === 'gym') {
      actualizar((d) => iniciarGym(d, paso.plantillaId, paso.id));
      onAbrirRegistro();
    } else if (paso.clase === 'running') setFormRunning(true);
    else actualizar((d) => completarPaso(d, 'hecha'));
  };
  const textoPrincipal = enCurso ? `Continuar ${enCurso.sesion.nombre}` : paso.clase === 'gym' ? `Empezar ${nombre}` : paso.clase === 'running' ? 'Registrar carrera' : 'Marcar descanso';

  return (
    <div className="pb-36">
      <p className="text-sm text-texto2">
        Ciclo {ctx.ciclo} · Vuelta {ctx.vuelta} de 4
      </p>
      {ctx.descarga && (
        <div className="mt-3 flex items-start gap-3 rounded-xl bg-acento px-4 py-3 text-fondo">
          <div className="flex-1">
            <p className="font-semibold">Vuelta 4 · Descarga</p>
            <p className="text-[15px]">Mitad de series, sin fallo, 60 % de los km.</p>
          </div>
          <PorQue id="descarga" tono="invertido" />
        </div>
      )}

      <p className="mt-6 text-texto2">Tu próxima sesión es</p>
      <div className="mt-1 flex items-start gap-3">
        <h1 className="num flex-1 text-[48px] leading-[1.05]">{nombre}</h1>
        <PorQue id="secuencia" className="mt-3" />
      </div>
      <p className="mt-2 text-texto2">{resumen(paso, datos, ctx, prescripcion)}</p>
      {despues.length > 0 && <p className="mt-1 text-sm text-texto2">Después: {despues.join(', ')}</p>}

      {previa && paso.clase !== 'libre' && <Nota porQue="sesion_doble">{notaSesionDoble(datos, previa, paso)}</Nota>}
      {avisos.map((a) => (
        <Aviso key={a.id} texto={a.texto} porQue={a.porQue} />
      ))}
      {pend.length > 0 && (
        <button type="button" onClick={() => onIr('registrar')} className="mt-4 block text-left text-sm text-texto2 underline decoration-linea underline-offset-4">
          Pendiente este ciclo: {pend.join(', ')}
        </button>
      )}

      <div className="mt-6">
        {plantilla && <ListaEjercicios ejercicios={plantilla.ejercicios} datos={datos} descarga={ctx.descarga} />}
        {prescripcion && <BloqueRunning p={prescripcion} />}
        {paso.clase === 'libre' && <p className="text-[15px] text-texto2">Descanso o movilidad suave. Márcalo cuando pase el día.</p>}
      </div>

      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-linea bg-fondo">
        <div className="mx-auto max-w-md px-5 pt-3">
          <Boton onClick={principal}>{textoPrincipal}</Boton>
          <div className="flex justify-center">
            <Boton variante="texto" disabled={!!enCurso} onClick={() => setConfirmarSalto(true)}>
              Saltar sesión
            </Boton>
          </div>
        </div>
      </div>

      <Hoja abierta={confirmarSalto} onCerrar={() => setConfirmarSalto(false)} titulo={`¿Saltar ${nombre}?`}>
        <p className="text-[15px] text-texto2">La cola avanza a {despues[0] ?? nombre}. Queda registrada como saltada; el ciclo no se rompe.</p>
        <div className="mt-5 space-y-2">
          <Boton
            variante="secundario"
            onClick={() => {
              actualizar((d) => completarPaso(d, 'saltada'));
              setConfirmarSalto(false);
            }}
          >
            Saltar {nombre}
          </Boton>
        </div>
      </Hoja>

      {formRunning && paso.clase === 'running' && <FormRunning tipo={paso.tipo} pasoId={paso.id} onCerrar={() => setFormRunning(false)} />}
    </div>
  );
}

// El consejo de orden solo aplica cuando se juntan fuerza y running el mismo día.
function notaSesionDoble(datos: Datos, previa: { pasoId: string; horas: number }, paso: PasoSecuencia): string {
  const anterior = datos.rutina.secuencia.find((p) => p.id === previa.pasoId);
  const nombreAnterior = anterior ? nombrePaso(anterior, datos.rutina) : 'una sesión';
  const hace = previa.horas < 1 ? 'hace menos de 1 h' : `hace ${fmt0(previa.horas)} h`;
  const base = `Ya hiciste ${nombreAnterior} hoy, ${hace}. Si puedes, separa al menos 3 h`;
  if (anterior?.clase === 'gym' && paso.clase === 'running') return `${base}; si quedan juntas, este orden (fuerza y después running) es el recomendado.`;
  if (anterior?.clase === 'running' && paso.clase === 'gym') return `${base}: con poca separación lo que más se resiente es la potencia, no la hipertrofia.`;
  return `${base}.`;
}

function resumen(paso: PasoSecuencia, datos: Datos, ctx: Contexto, p: Prescripcion | null): string {
  if (paso.clase === 'gym') {
    const pl = datos.rutina.plantillas.find((x) => x.id === paso.plantillaId);
    if (!pl) return '';
    const series = pl.ejercicios.reduce((a, e) => a + (ctx.descarga ? Math.ceil(e.series / 2) : e.series), 0);
    const tobillo = pl.ejercicios.filter((e) => e.esProtocoloTobillo).length;
    return `${pl.ejercicios.length} ejercicios · ${series} series${tobillo ? ` · ${tobillo} de tobillo` : ''}`;
  }
  // Los km ya aparecen grandes justo abajo; acá solo el tipo de sesión.
  if (paso.clase === 'running' && p) return p.etiqueta === 'Z2' ? 'Rodaje suave en Z2' : p.etiqueta === 'Fondo' ? 'Fondo largo en Z2' : `Calidad del ciclo: ${p.etiqueta}`;
  return 'Día sin entrenamiento';
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
