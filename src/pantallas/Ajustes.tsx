import { useRef, useState } from 'react';
import type { Datos, Objetivo, Perfil, Sexo } from '../tipos/modelo';
import { useDatos } from '../almacen/contexto';
import { exportarJSON, leerJSON } from '../almacen/exportar';
import { aNum, Boton, Campo, deNum, Encabezado, Fila, Hoja, Segmentado, Volver } from '../componentes/ui';
import { PorQue } from '../componentes/PorQue';
import { EditorRutina } from './EditorRutina';
import { fmt0, fmt1, ritmo } from '../motor/formato';
import { pesoActual, pisoGrasa } from '../motor/nutricion';
import { alturaCm, calcularObjetivos } from '../motor/perfil';
import { corre, sesionesPlanificadas } from '../motor/planificacion';

type Vista = null | 'perfil' | 'rutina';

const NOMBRE_OBJETIVO: Record<Objetivo, string> = { perder_grasa: 'Perder grasa', mantener: 'Mantener', ganar_musculo: 'Ganar músculo' };

export function Ajustes({ onVolver }: { onVolver: () => void }) {
  const { datos, reemplazar } = useDatos();
  const [vista, setVista] = useState<Vista>(null);
  const [importado, setImportado] = useState<Datos | null>(null);
  const [error, setError] = useState('');
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);

  if (vista === 'rutina') return <EditorRutina onVolver={() => setVista(null)} />;

  const importar = async (f: File | undefined) => {
    setError('');
    if (!f) return;
    try {
      setImportado(await leerJSON(f));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const { perfil } = datos;

  return (
    <div>
      <Volver onClick={onVolver}>Más</Volver>
      <Encabezado>Ajustes</Encabezado>
      <div className="mt-4">
        <Fila titulo="Perfil y objetivos" sub={`${NOMBRE_OBJETIVO[perfil.objetivo]} · ${fmt1(pesoActual(datos))} kg · ${fmt0(perfil.caloriasObjetivo)} kcal`} onClick={() => setVista('perfil')} />
        <Fila titulo="Plan semanal" sub={`${sesionesPlanificadas(datos)} sesiones por semana · ejercicios y series`} onClick={() => setVista('rutina')} />
      </div>

      <section className="mt-8">
        <h2 className="text-sm text-texto2">Respaldo</h2>
        <p className="mt-1 text-sm text-texto2">Los datos viven solo en este teléfono. Exporta un respaldo de vez en cuando.</p>
        <div className="mt-3 space-y-2">
          <Boton variante="secundario" onClick={() => exportarJSON(datos)}>
            Exportar JSON
          </Boton>
          <Boton variante="secundario" onClick={() => archivo.current?.click()}>
            Importar JSON
          </Boton>
          <input ref={archivo} type="file" accept="application/json,.json" className="hidden" onChange={(e) => importar(e.target.files?.[0]).finally(() => (e.target.value = ''))} />
          {error && <p className="text-sm text-alerta">{error}</p>}
        </div>
      </section>

      <div className="mt-8">
        <Boton variante="peligro" onClick={() => setConfirmarBorrar(true)}>
          Borrar todo
        </Boton>
      </div>

      {vista === 'perfil' && <FormPerfil onCerrar={() => setVista(null)} />}

      <Hoja abierta={!!importado} onCerrar={() => setImportado(null)} titulo="¿Reemplazar tus datos?">
        <p className="text-[15px] text-texto2">
          El respaldo trae {importado?.sesionesGym.length ?? 0} sesiones de gym y {importado?.sesionesRunning.length ?? 0} carreras. Lo que tienes ahora se reemplaza.
        </p>
        <Boton
          className="mt-5"
          onClick={() => {
            if (importado) reemplazar(importado);
            setImportado(null);
          }}
        >
          Reemplazar con el respaldo
        </Boton>
      </Hoja>

      <Hoja abierta={confirmarBorrar} onCerrar={() => setConfirmarBorrar(false)} titulo="¿Borrar todo?">
        <p className="text-[15px] text-texto2">Se borran tus sesiones, pesos, medidas y tu plan, y vuelves a la configuración inicial. Exporta un respaldo antes si lo quieres conservar.</p>
        <Boton className="mt-5" variante="peligro" onClick={() => reemplazar(null)}>
          Sí, borrar todo
        </Boton>
      </Hoja>
    </div>
  );
}

type Clave = 'altura' | 'pesoInicial' | 'fcMax' | 'caloriasObjetivo' | 'proteinaObjetivo' | 'grasaObjetivo' | 'pisoKcal' | 'z2Km' | 'fondoKmInicial' | 'topeFondoKm' | 'topeKmSemanal';

const CUERPO: { k: Clave; etiqueta: string; unidad: string }[] = [
  { k: 'altura', etiqueta: 'Altura', unidad: 'cm' },
  { k: 'pesoInicial', etiqueta: 'Peso inicial', unidad: 'kg' },
  { k: 'fcMax', etiqueta: 'FC máxima', unidad: 'lpm' },
];
const NUTRICION: { k: Clave; etiqueta: string; unidad: string }[] = [
  { k: 'caloriasObjetivo', etiqueta: 'Calorías', unidad: 'kcal' },
  { k: 'pisoKcal', etiqueta: 'Piso de seguridad', unidad: 'kcal' },
  { k: 'proteinaObjetivo', etiqueta: 'Proteína', unidad: 'g' },
  { k: 'grasaObjetivo', etiqueta: 'Grasa', unidad: 'g' },
];
const RUNNING: { k: Clave; etiqueta: string; unidad: string }[] = [
  { k: 'z2Km', etiqueta: 'Distancia Z2', unidad: 'km' },
  { k: 'fondoKmInicial', etiqueta: 'Fondo inicial', unidad: 'km' },
  { k: 'topeFondoKm', etiqueta: 'Tope fondo', unidad: 'km' },
  { k: 'topeKmSemanal', etiqueta: 'Tope semanal', unidad: 'km' },
];
const TODOS = [...CUERPO, ...NUTRICION, ...RUNNING];

function FormPerfil({ onCerrar }: { onCerrar: () => void }) {
  const { datos, actualizar } = useDatos();
  const [sexo, setSexo] = useState<Sexo>(datos.perfil.sexo);
  const [objetivo, setObjetivo] = useState<Objetivo>(datos.perfil.objetivo);
  const [edad, setEdad] = useState(deNum(datos.perfil.edad));
  const [valores, setValores] = useState<Record<string, string>>(() => Object.fromEntries(TODOS.map((c) => [c.k, deNum(datos.perfil[c.k])])));
  const [ritmoTexto, setRitmoTexto] = useState(ritmo(datos.perfil.ritmoSemillaSegKm));
  const [gasto, setGasto] = useState<number | null>(null);
  const peso = pesoActual(datos);
  const v = (k: Clave) => aNum(valores[k] ?? '');
  const e = aNum(edad);
  const kcal = v('caloriasObjetivo');
  const piso = v('pisoKcal');
  const grasa = v('grasaObjetivo');
  const alturaEscrita = v('altura');
  const altura = alturaEscrita !== null ? alturaCm(alturaEscrita) : null;

  const recalcular = () => {
    if (!e || !altura) return;
    const o = calcularObjetivos({ sexo, peso, altura, edad: e, objetivo, sesiones: sesionesPlanificadas(datos) });
    setValores((x) => ({ ...x, caloriasObjetivo: String(o.kcal), proteinaObjetivo: String(o.proteina), grasaObjetivo: String(o.grasa), pisoKcal: String(o.piso) }));
    setGasto(o.gasto);
  };

  const guardar = () => {
    const nuevo: Perfil = { ...datos.perfil, sexo, objetivo, ...(e && e > 0 ? { edad: Math.round(e) } : {}) };
    for (const c of TODOS) {
      const n = v(c.k);
      // La altura se acepta también en metros (1,78).
      if (n !== null && n > 0) nuevo[c.k] = c.k === 'altura' ? alturaCm(n) : n;
    }
    const [m, s] = ritmoTexto.split(':').map(Number);
    if (isFinite(m) && isFinite(s)) nuevo.ritmoSemillaSegKm = m * 60 + s;
    actualizar((d) => ({ ...d, perfil: nuevo }));
    onCerrar();
  };

  const campos = (lista: typeof TODOS) =>
    lista.map((c) => <Campo key={c.k} etiqueta={c.etiqueta} valor={valores[c.k] ?? ''} onCambio={(x) => setValores((y) => ({ ...y, [c.k]: x }))} unidad={c.unidad} />);

  return (
    <Hoja abierta onCerrar={onCerrar} titulo="Perfil y objetivos">
      <Segmentado<Sexo>
        opciones={[
          { valor: 'hombre', etiqueta: 'Hombre' },
          { valor: 'mujer', etiqueta: 'Mujer' },
        ]}
        valor={sexo}
        onCambio={setSexo}
      />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Campo etiqueta="Edad" valor={edad} onCambio={setEdad} unidad="años" teclado="numeric" />
        {campos(CUERPO)}
      </div>

      <h3 className="mb-2 mt-6 text-sm text-texto2">Objetivo</h3>
      <Segmentado<Objetivo>
        opciones={[
          { valor: 'perder_grasa', etiqueta: 'Perder' },
          { valor: 'mantener', etiqueta: 'Mantener' },
          { valor: 'ganar_musculo', etiqueta: 'Ganar' },
        ]}
        valor={objetivo}
        onCambio={setObjetivo}
      />
      <div className="mt-4 grid grid-cols-2 gap-3">{campos(NUTRICION)}</div>
      <div className="mt-2 flex items-center gap-2">
        <Boton variante="texto" className="!px-0" disabled={!e || !altura} onClick={recalcular}>
          Recalcular con mis datos
        </Boton>
        <PorQue id="objetivo_kcal" pequeno />
      </div>
      {gasto !== null && <p className="text-sm text-texto2">Gasto estimado: {fmt0(gasto)} kcal al día. Revisa y guarda.</p>}
      {!e && <p className="text-sm text-texto2">Para recalcular, completa tu edad.</p>}
      {kcal !== null && piso !== null && kcal < piso && <p className="mt-2 text-sm text-alerta">Bajo tu piso de seguridad de {fmt0(piso)} kcal.</p>}
      {grasa !== null && grasa < pisoGrasa(peso) && <p className="mt-2 text-sm text-alerta">Bajo el piso de grasa ({pisoGrasa(peso)} g = 0,8 g/kg).</p>}

      {corre(datos) && (
        <>
          <h3 className="mb-2 mt-6 text-sm text-texto2">Running</h3>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Ritmo sin test" valor={ritmoTexto} onCambio={setRitmoTexto} unidad="/km" teclado="text" />
            {campos(RUNNING)}
          </div>
        </>
      )}

      <Boton className="mt-6" onClick={guardar}>
        Guardar
      </Boton>
    </Hoja>
  );
}
