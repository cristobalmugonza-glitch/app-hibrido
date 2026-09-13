import { useRef, useState, type ReactNode } from 'react';
import type { Datos, Objetivo, Sexo } from '../tipos/modelo';
import { leerJSON } from '../almacen/exportar';
import { aNum, Boton, Campo, Casilla, Segmentado, Volver } from '../componentes/ui';
import { PorQue } from '../componentes/PorQue';
import { construirRutina, RUTINAS_ESTANDAR, type IdRutina } from '../data/catalogo';
import { fmt0 } from '../motor/formato';
import { crearDatos, fcMaxTanaka, objetivosDe, validarDatosBasicos, type Respuestas } from '../motor/perfil';
import { contarSesiones } from '../motor/planificacion';

type Paso = 'inicio' | 'datos' | 'objetivo' | 'rutina' | 'resumen';
const PASOS: Paso[] = ['datos', 'objetivo', 'rutina', 'resumen'];

const OBJETIVOS: { valor: Objetivo; nombre: string; sub: string }[] = [
  { valor: 'perder_grasa', nombre: 'Perder grasa', sub: 'Conservando músculo y fuerza' },
  { valor: 'mantener', nombre: 'Mantener', sub: 'Rendir más sin cambiar el peso' },
  { valor: 'ganar_musculo', nombre: 'Ganar músculo', sub: 'Con un superávit moderado' },
];

// "5:45" → 345 segundos por km.
function leerRitmo(texto: string): number | null {
  const m = texto.trim().match(/^(\d{1,2})[:.,](\d{2})$/);
  if (!m) return null;
  const seg = Number(m[1]) * 60 + Number(m[2]);
  return seg >= 180 && seg <= 900 ? seg : null;
}

function Opcion({ titulo, sub, marcada, onClick }: { titulo: string; sub: string; marcada: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={marcada} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left ${marcada ? 'border-acento' : 'border-linea'}`}>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${marcada ? 'border-acento' : 'border-texto2'}`}>{marcada && <span className="h-2.5 w-2.5 rounded-full bg-acento" />}</span>
      <span>
        <span className="block text-[17px]">{titulo}</span>
        <span className="block text-sm text-texto2">{sub}</span>
      </span>
    </button>
  );
}

function Macro({ nombre, gramos, porQue }: { nombre: string; gramos: number; porQue?: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-texto2">{nombre}</span>
        {porQue && <PorQue id={porQue} pequeno />}
      </div>
      <p className="num mt-1 text-4xl leading-none">
        {fmt0(gramos)}
        <span className="text-lg text-texto2"> g</span>
      </p>
    </div>
  );
}

export function Onboarding({ onListo }: { onListo: (d: Datos) => void }) {
  const [paso, setPaso] = useState<Paso>('inicio');
  const [sexo, setSexo] = useState<Sexo>('hombre');
  const [edad, setEdad] = useState('');
  const [altura, setAltura] = useState('');
  const [peso, setPeso] = useState('');
  const [fcMax, setFcMax] = useState('');
  const [objetivo, setObjetivo] = useState<Objetivo>('perder_grasa');
  const [rutina, setRutina] = useState<IdRutina>('torso_pierna');
  const [corre, setCorre] = useState(false);
  const [tobillo, setTobillo] = useState(false);
  const [km, setKm] = useState('20');
  const [ritmoTexto, setRitmoTexto] = useState('6:00');
  const [error, setError] = useState('');
  const archivo = useRef<HTMLInputElement>(null);

  const validacion = validarDatosBasicos({ edad, altura, peso, fcMax });
  const basicos = validacion.valores;
  const edadEscrita = aNum(edad);
  const esHibrido = rutina === 'hibrido';
  const conRunning = corre || esHibrido;
  const ritmoSeg = leerRitmo(ritmoTexto);
  const kmSemana = aNum(km);
  const rutinaOk = !conRunning || (kmSemana !== null && kmSemana >= 0 && ritmoSeg !== null);

  const respuestas = (): Respuestas => ({
    sexo,
    edad: basicos?.edad ?? 30,
    altura: basicos?.altura ?? 170,
    peso: basicos?.peso ?? 70,
    fcMax: basicos?.fcMax ?? null,
    objetivo,
    rutina,
    corre: conRunning,
    tobillo,
    kmSemana: kmSemana ?? 20,
    ritmoSegKm: ritmoSeg ?? 360,
  });

  const indice = PASOS.indexOf(paso);
  const atras = () => setPaso(indice <= 0 ? 'inicio' : PASOS[indice - 1]);
  const siguiente = () => setPaso(PASOS[indice + 1]);

  const importar = async (archivoElegido: File | undefined) => {
    setError('');
    if (!archivoElegido) return;
    try {
      onListo(await leerJSON(archivoElegido));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const marco = (contenido: ReactNode, pie: ReactNode) => (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      {paso !== 'inicio' && (
        <div className="flex items-center justify-between">
          <Volver onClick={atras}>Atrás</Volver>
          <span className="mb-2 text-sm text-texto2">
            {indice + 1} de {PASOS.length}
          </span>
        </div>
      )}
      <div className="flex-1">{contenido}</div>
      <div className="pt-6">{pie}</div>
    </div>
  );

  if (paso === 'inicio') {
    return marco(
      <div className="pt-16">
        <h1 className="num text-[64px] leading-none">Híbrido</h1>
        <p className="mt-5 text-[17px] leading-relaxed">Arma tu plan semanal de fuerza y running, te sugiere qué entrenar cada día y proyecta la semana siguiente con tu historial.</p>
        <p className="mt-3 text-[15px] leading-relaxed text-texto2">Cada recomendación trae su por qué, con referencias científicas. Tus datos quedan solo en este teléfono.</p>
      </div>,
      <>
        <Boton onClick={() => setPaso('datos')}>Empezar</Boton>
        <Boton variante="texto" className="mt-2 w-full" onClick={() => archivo.current?.click()}>
          Tengo un respaldo
        </Boton>
        <input ref={archivo} type="file" accept="application/json,.json" className="hidden" onChange={(ev) => importar(ev.target.files?.[0]).finally(() => (ev.target.value = ''))} />
        {error && <p className="mt-2 text-center text-sm text-alerta">{error}</p>}
      </>,
    );
  }

  if (paso === 'datos') {
    return marco(
      <>
        <h1 className="text-2xl font-semibold">Tus datos</h1>
        <p className="mt-1 text-[15px] text-texto2">Con esto se calculan tus calorías y tus zonas de frecuencia cardíaca.</p>
        <div className="mt-5">
          <Segmentado<Sexo>
            opciones={[
              { valor: 'hombre', etiqueta: 'Hombre' },
              { valor: 'mujer', etiqueta: 'Mujer' },
            ]}
            valor={sexo}
            onCambio={setSexo}
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Campo etiqueta="Edad" valor={edad} onCambio={setEdad} unidad="años" teclado="numeric" placeholder="21" />
          <Campo etiqueta="Altura" valor={altura} onCambio={setAltura} unidad="cm" placeholder="178" />
          <Campo etiqueta="Peso" valor={peso} onCambio={setPeso} unidad="kg" placeholder="75" />
        </div>
        <div className="mt-4">
          <Campo etiqueta="FC máxima (opcional)" valor={fcMax} onCambio={setFcMax} unidad="lpm" teclado="numeric" placeholder={edadEscrita ? `estimada: ${fcMaxTanaka(edadEscrita)}` : 'si la conoces'} />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <p className="flex-1 text-sm text-texto2">Si la dejas vacía, se estima con tu edad.</p>
          <PorQue id="fcmax_estimada" pequeno />
        </div>
        {validacion.errores.length > 0 && (
          <ul className="mt-4 space-y-1" role="alert">
            {validacion.errores.map((e) => (
              <li key={e} className="text-sm text-alerta">
                {e}
              </li>
            ))}
          </ul>
        )}
      </>,
      <>
        {!basicos && !validacion.errores.length && <p className="mb-2 text-center text-sm text-texto2">Completa edad, altura y peso para seguir.</p>}
        <Boton disabled={!basicos} onClick={siguiente}>
          Seguir
        </Boton>
      </>,
    );
  }

  if (paso === 'objetivo') {
    return marco(
      <>
        <h1 className="text-2xl font-semibold">Tu objetivo</h1>
        <p className="mt-1 text-[15px] text-texto2">Define tus calorías y cómo se calibran semana a semana.</p>
        <div className="mt-5 space-y-2">
          {OBJETIVOS.map((o) => (
            <Opcion key={o.valor} titulo={o.nombre} sub={o.sub} marcada={objetivo === o.valor} onClick={() => setObjetivo(o.valor)} />
          ))}
        </div>
      </>,
      <Boton onClick={siguiente}>Seguir</Boton>,
    );
  }

  if (paso === 'rutina') {
    return marco(
      <>
        <h1 className="text-2xl font-semibold">Tu plan base</h1>
        <p className="mt-1 text-[15px] text-texto2">Parte de una rutina estándar; después puedes cambiar ejercicios, series y bloques.</p>
        <div className="mt-5 space-y-2">
          {RUTINAS_ESTANDAR.map((r) => (
            <Opcion key={r.id} titulo={r.nombre} sub={r.descripcion} marcada={rutina === r.id} onClick={() => setRutina(r.id)} />
          ))}
        </div>
        <div className="mt-4">
          {!esHibrido && (
            <Casilla marcada={corre} onCambio={setCorre}>
              También corro (suma 3 salidas por semana)
            </Casilla>
          )}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Casilla marcada={tobillo} onCambio={setTobillo}>
                Tobillo inestable o esguinces previos
              </Casilla>
            </div>
            <PorQue id="tobillo_protocolo" />
          </div>
        </div>
        {conRunning && (
          <>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Campo etiqueta="Km por semana hoy" valor={km} onCambio={setKm} unidad="km" teclado="numeric" />
              <Campo etiqueta="Ritmo cómodo" valor={ritmoTexto} onCambio={setRitmoTexto} unidad="/km" teclado="text" placeholder="6:00" />
            </div>
            {!rutinaOk && <p className="mt-3 text-sm text-alerta">Escribe los km por semana y el ritmo como minutos:segundos, por ejemplo 6:00.</p>}
          </>
        )}
      </>,
      <Boton disabled={!rutinaOk} onClick={siguiente}>
        Seguir
      </Boton>,
    );
  }

  const r = respuestas();
  const obj = objetivosDe(r);
  const carbos = Math.max(0, Math.round((obj.kcal - obj.proteina * 4 - obj.grasa * 9) / 4));
  const plan = construirRutina(r.rutina, { running: r.corre, tobillo: r.tobillo });
  const bloques = [
    ...plan.plantillas.map((x) => (x.vecesPorSemana > 1 ? `${x.nombre} ×${x.vecesPorSemana}` : x.nombre)),
    ...(plan.running.z2 ? ['Running Z2'] : []),
    ...(plan.running.calidad ? ['Running calidad'] : []),
    ...(plan.running.fondo ? ['Fondo largo'] : []),
  ];

  return marco(
    <>
      <h1 className="text-2xl font-semibold">Tu punto de partida</h1>
      <div className="mt-5 flex items-start justify-between gap-3">
        <p className="num text-[56px] leading-none">
          {fmt0(obj.kcal)} <span className="text-2xl text-texto2">kcal</span>
        </p>
        <PorQue id="objetivo_kcal" />
      </div>
      <p className="mt-1 text-sm text-texto2">Gasto estimado: {fmt0(obj.gasto)} kcal al día</p>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Macro nombre="Proteína" gramos={obj.proteina} porQue="proteina" />
        <Macro nombre="Grasa" gramos={obj.grasa} porQue="grasa" />
        <Macro nombre="Carbos" gramos={carbos} />
      </div>
      <p className="mt-6 text-sm text-texto2">Plan semanal · {contarSesiones(plan)} sesiones</p>
      <p className="mt-1 text-[15px] leading-snug">{bloques.join(', ')}</p>
      <p className="mt-6 text-sm text-texto2">Todo se ajusta después en Más › Ajustes, y las calorías se calibran solas con tus pesajes.</p>
    </>,
    <Boton onClick={() => onListo(crearDatos(r))}>Crear mi plan</Boton>,
  );
}
