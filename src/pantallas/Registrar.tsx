import { useState } from 'react';
import type { Medidas, Sexo, ZonaMolestia } from '../tipos/modelo';
import { useDatos } from '../almacen/contexto';
import { aNum, Boton, Campo, Casilla, deNum, Fila, Hoja, Nota, Segmentado } from '../componentes/ui';
import { PorQue } from '../componentes/PorQue';
import { FormRunning } from './FormRunning';
import { tieneDominadas } from '../motor/benchmarks';
import { ahoraIso, haceCuanto } from '../motor/fechas';
import { fmt1, fmt2, ritmo } from '../motor/formato';
import { ACE, categoriaACE, mostrarNotaAbdomen, navy, ratioHombrosCintura } from '../motor/grasa';
import { pesoActual } from '../motor/nutricion';
import { corre } from '../motor/planificacion';
import { fcTest, ritmoSesion } from '../motor/running';

type Formulario = 'peso' | 'molestia' | 'medidas' | 'test' | 'dominadas';

// Registros sueltos (peso, molestias, medidas y tests). Se abre desde Hoy.
export function RegistrarHoja({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
  const { datos } = useDatos();
  const [form, setForm] = useState<Formulario | null>(null);
  if (!abierta) return null;

  const cerrar = () => {
    setForm(null);
    onCerrar();
  };
  if (form === 'peso') return <FormPeso onCerrar={cerrar} />;
  if (form === 'molestia') return <FormMolestia onCerrar={cerrar} />;
  if (form === 'medidas') return <FormMedidas onCerrar={cerrar} />;
  if (form === 'dominadas') return <FormDominadas onCerrar={cerrar} />;
  if (form === 'test') return <FormRunning tipo="test" onCerrar={cerrar} />;

  const peso = datos.pesos.length ? datos.pesos.reduce((a, b) => (b.fecha > a.fecha ? b : a)) : null;
  const medida = datos.medidas.at(-1);
  const test = datos.sesionesRunning.filter((s) => s.tipo === 'test').at(-1);
  const dom = datos.dominadas.at(-1);

  return (
    <Hoja abierta onCerrar={onCerrar} titulo="Registrar">
      <Fila titulo="Peso" sub={peso ? `${fmt1(peso.peso)} kg · ${haceCuanto(peso.fecha)}` : 'Idealmente 3 veces por semana, en ayunas'} onClick={() => setForm('peso')} />
      <Fila titulo="Molestia" sub="Tobillo, rodilla, cadera, espalda u hombro" onClick={() => setForm('molestia')} />
      <Fila titulo="Medidas y grasa" sub={medida?.grasaNavy ? `${fmt1(medida.grasaNavy)} % · ${haceCuanto(medida.fecha)}` : 'Cintura, cuello y hombros · cada 4 semanas'} onClick={() => setForm('medidas')} />
      {corre(datos) && (
        <Fila titulo={`Test 8 km a ${fcTest(datos.perfil.fcMax)} lpm`} sub={test ? `${ritmo(ritmoSesion(test))}/km · ${haceCuanto(test.fecha)}` : 'Cada 8 semanas'} onClick={() => setForm('test')} />
      )}
      {tieneDominadas(datos) && (
        <Fila titulo="Dominadas con lastre" sub={dom ? `${fmt1(dom.lastreKg)} kg × ${dom.reps} · ${haceCuanto(dom.fecha)}` : 'Reps máximas con el mismo lastre · cada 8 semanas'} onClick={() => setForm('dominadas')} />
      )}
    </Hoja>
  );
}

function FormPeso({ onCerrar }: { onCerrar: () => void }) {
  const { datos, actualizar } = useDatos();
  const [kg, setKg] = useState(deNum(pesoActual(datos)));
  const n = aNum(kg);
  return (
    <Hoja abierta onCerrar={onCerrar} titulo="Peso">
      <Campo etiqueta="Peso en ayunas" valor={kg} onCambio={setKg} unidad="kg" />
      <Boton
        className="mt-5"
        disabled={!n || n < 30}
        onClick={() => {
          actualizar((d) => ({ ...d, pesos: [...d.pesos, { fecha: ahoraIso(), peso: n! }] }));
          onCerrar();
        }}
      >
        Guardar peso
      </Boton>
    </Hoja>
  );
}

const ZONAS: [ZonaMolestia, string][] = [
  ['tobillo', 'Tobillo'],
  ['rodilla', 'Rodilla'],
  ['cadera', 'Cadera'],
  ['espalda', 'Espalda'],
  ['hombro', 'Hombro'],
  ['otro', 'Otra'],
];

function FormMolestia({ onCerrar }: { onCerrar: () => void }) {
  const { actualizar } = useDatos();
  const [zona, setZona] = useState<ZonaMolestia>('tobillo');
  const [intensidad, setIntensidad] = useState<1 | 2 | 3>(1);
  const [nota, setNota] = useState('');
  return (
    <Hoja abierta onCerrar={onCerrar} titulo="Molestia">
      <p className="mb-2 text-sm text-texto2">Zona</p>
      <div className="grid grid-cols-3 gap-2">
        {ZONAS.map(([v, e]) => (
          <button key={v} type="button" onClick={() => setZona(v)} aria-pressed={zona === v} className={`h-11 rounded-xl text-[15px] font-medium ${zona === v ? 'bg-texto text-fondo' : 'border border-linea text-texto2'}`}>
            {e}
          </button>
        ))}
      </div>
      <p className="mb-2 mt-4 text-sm text-texto2">Intensidad</p>
      <Segmentado<1 | 2 | 3>
        opciones={[
          { valor: 1, etiqueta: '1 · leve' },
          { valor: 2, etiqueta: '2 · molesta' },
          { valor: 3, etiqueta: '3 · limita' },
        ]}
        valor={intensidad}
        onCambio={setIntensidad}
      />
      <div className="mt-4">
        <Campo etiqueta="Nota (opcional)" valor={nota} onCambio={setNota} teclado="text" />
      </div>
      <Boton
        className="mt-5"
        onClick={() => {
          actualizar((d) => ({ ...d, molestias: [...d.molestias, { fecha: ahoraIso(), zona, intensidad, nota: nota.trim() || undefined }] }));
          onCerrar();
        }}
      >
        Guardar molestia
      </Boton>
    </Hoja>
  );
}

export function TablaACE({ pct, sexo }: { pct: number; sexo: Sexo }) {
  const actual = categoriaACE(pct, sexo);
  return (
    <ul className="divide-y divide-linea border-y border-linea">
      {ACE[sexo].map((c) => (
        <li key={c.nombre} className={`flex justify-between py-2 text-[15px] ${c.nombre === actual.nombre ? 'text-texto' : 'text-texto2'}`}>
          <span>
            {c.nombre === actual.nombre && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-acento" />}
            {c.nombre}
          </span>
          <span className="num">{c.hasta === null ? `${c.desde} % o más` : `${c.desde}–${c.hasta} %`}</span>
        </li>
      ))}
    </ul>
  );
}

function FormMedidas({ onCerrar }: { onCerrar: () => void }) {
  const { datos, actualizar } = useDatos();
  const previa = datos.medidas.at(-1);
  const [cintura, setCintura] = useState(deNum(previa?.cintura));
  const [cuello, setCuello] = useState(deNum(previa?.cuello));
  const [cadera, setCadera] = useState(deNum(previa?.cadera));
  const [hombros, setHombros] = useState(deNum(previa?.hombros));
  const [brazo, setBrazo] = useState(deNum(previa?.brazo));
  const [muslo, setMuslo] = useState(deNum(previa?.muslo));
  const [foto, setFoto] = useState(false);
  const [resultado, setResultado] = useState<Medidas | null>(null);
  const { sexo, altura } = datos.perfil;

  const guardar = () => {
    const c = aNum(cintura);
    if (!c) return;
    const cu = aNum(cuello) ?? undefined;
    const ca = aNum(cadera) ?? undefined;
    const grasa = cu ? navy(sexo, altura, c, cu, ca) : null;
    const m: Medidas = {
      fecha: ahoraIso(),
      cintura: c,
      cuello: cu,
      cadera: ca,
      hombros: aNum(hombros) ?? undefined,
      brazo: aNum(brazo) ?? undefined,
      muslo: aNum(muslo) ?? undefined,
      grasaNavy: grasa ?? undefined,
      fotoTomada: foto,
    };
    actualizar((d) => ({ ...d, medidas: [...d.medidas, m] }));
    setResultado(m);
  };

  if (resultado) {
    const ratio = ratioHombrosCintura(resultado);
    const pct = resultado.grasaNavy;
    return (
      <Hoja abierta onCerrar={onCerrar} titulo="Resultado">
        {pct !== undefined ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="num text-[56px] leading-none">{fmt1(pct)}</span>
              <span className="flex-1 text-texto2">% grasa estimada</span>
              <PorQue id="navy" />
            </div>
            <p className="mt-2 text-sm text-texto2">Margen de ±3–4 puntos. Lo que importa es la tendencia medida siempre igual.</p>
            <div className="mb-2 mt-5 flex items-center justify-between">
              <span className="text-sm text-texto2">Categorías de referencia</span>
              <PorQue id="ace" />
            </div>
            <TablaACE pct={pct} sexo={sexo} />
            {mostrarNotaAbdomen(pct, sexo) && <Nota porQue="abdomen">En este rango el abdomen normalmente no se marca todavía, aunque no haya grasa excesiva. Es lo esperable, no una contradicción.</Nota>}
          </>
        ) : (
          <p className="text-texto2">Sin cuello{sexo === 'mujer' ? ' o cadera' : ''} no se puede estimar la grasa. Se guardaron las medidas.</p>
        )}
        {ratio !== null && (
          <p className="mt-5 text-texto2">
            Hombros / cintura <span className="num ml-2 text-3xl text-texto">{fmt2(ratio)}</span>
          </p>
        )}
        <Boton className="mt-6" onClick={onCerrar}>
          Listo
        </Boton>
      </Hoja>
    );
  }

  return (
    <Hoja abierta onCerrar={onCerrar} titulo="Medidas">
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Cintura (ombligo)" valor={cintura} onCambio={setCintura} unidad="cm" />
        <Campo etiqueta="Cuello" valor={cuello} onCambio={setCuello} unidad="cm" />
        {sexo === 'mujer' && <Campo etiqueta="Cadera" valor={cadera} onCambio={setCadera} unidad="cm" />}
        <Campo etiqueta="Hombros" valor={hombros} onCambio={setHombros} unidad="cm" />
        <Campo etiqueta="Brazo" valor={brazo} onCambio={setBrazo} unidad="cm" />
        <Campo etiqueta="Muslo" valor={muslo} onCambio={setMuslo} unidad="cm" />
      </div>
      <div className="mt-2">
        <Casilla marcada={foto} onCambio={setFoto}>
          Tomé la foto de progreso
        </Casilla>
      </div>
      <Boton className="mt-4" disabled={!aNum(cintura)} onClick={guardar}>
        Guardar y calcular
      </Boton>
    </Hoja>
  );
}

function FormDominadas({ onCerrar }: { onCerrar: () => void }) {
  const { datos, actualizar } = useDatos();
  const previa = datos.dominadas.at(-1);
  const [lastre, setLastre] = useState(deNum(previa?.lastreKg ?? 0));
  const [reps, setReps] = useState('');
  const l = aNum(lastre);
  const r = aNum(reps);
  return (
    <Hoja abierta onCerrar={onCerrar} titulo="Dominadas con lastre">
      <p className="mb-4 text-sm text-texto2">Reps máximas con el mismo lastre que la vez anterior{previa ? ` (${fmt1(previa.lastreKg)} kg)` : ''}, así el resultado es comparable.</p>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Lastre" valor={lastre} onCambio={setLastre} unidad="kg" />
        <Campo etiqueta="Repeticiones" valor={reps} onCambio={setReps} teclado="numeric" />
      </div>
      <Boton
        className="mt-5"
        disabled={l === null || !r}
        onClick={() => {
          actualizar((d) => ({ ...d, dominadas: [...d.dominadas, { fecha: ahoraIso(), lastreKg: l!, reps: Math.round(r!) }] }));
          onCerrar();
        }}
      >
        Guardar
      </Boton>
    </Hoja>
  );
}
