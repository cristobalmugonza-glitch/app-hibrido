import { useRef, useState } from 'react';
import type { Datos, Perfil, Sexo } from '../tipos/modelo';
import { useDatos } from '../almacen/contexto';
import { exportarJSON, leerJSON } from '../almacen/exportar';
import { aNum, Boton, Campo, deNum, Encabezado, Fila, Hoja, Segmentado, Volver } from '../componentes/ui';
import { datosSemilla } from '../data/semilla';
import { EditorRutina } from './EditorRutina';
import { fmt0, fmt1, ritmo } from '../motor/formato';
import { PISO_KCAL, pesoActual, pisoGrasa } from '../motor/nutricion';
import { contexto, reiniciarCiclo } from '../motor/secuencia';

type Vista = null | 'perfil' | 'rutina';

export function Ajustes({ onVolver }: { onVolver: () => void }) {
  const { datos, actualizar } = useDatos();
  const [vista, setVista] = useState<Vista>(null);
  const [importado, setImportado] = useState<Datos | null>(null);
  const [error, setError] = useState('');
  const [confirmar, setConfirmar] = useState<null | 'reiniciar' | 'borrar'>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const ctx = contexto(datos.cola);

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

  return (
    <div>
      <Volver onClick={onVolver}>Más</Volver>
      <Encabezado>Ajustes</Encabezado>
      <div className="mt-4">
        <Fila titulo="Perfil y objetivos" sub={`${fmt1(pesoActual(datos))} kg · ${fmt0(datos.perfil.caloriasObjetivo)} kcal · FC máx ${datos.perfil.fcMax}`} onClick={() => setVista('perfil')} />
        <Fila titulo="Rutina y secuencia" sub={`${datos.rutina.plantillas.length} sesiones de gym · ${datos.rutina.secuencia.length} pasos por vuelta`} onClick={() => setVista('rutina')} />
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

      <section className="mt-8">
        <h2 className="text-sm text-texto2">Ciclo</h2>
        <p className="mt-1 text-sm text-texto2">
          Ciclo {ctx.ciclo}, vuelta {ctx.vuelta}. Reiniciar vuelve a la vuelta 1 y a la primera sesión, sin borrar historial.
        </p>
        <div className="mt-3 space-y-2">
          <Boton variante="secundario" onClick={() => setConfirmar('reiniciar')}>
            Reiniciar ciclo
          </Boton>
          <Boton variante="peligro" onClick={() => setConfirmar('borrar')}>
            Borrar todo
          </Boton>
        </div>
      </section>

      {vista === 'perfil' && <FormPerfil onCerrar={() => setVista(null)} />}

      <Hoja abierta={!!importado} onCerrar={() => setImportado(null)} titulo="¿Reemplazar tus datos?">
        <p className="text-[15px] text-texto2">
          El respaldo trae {importado?.sesionesGym.length ?? 0} sesiones de gym y {importado?.sesionesRunning.length ?? 0} carreras. Lo que tienes ahora se reemplaza.
        </p>
        <Boton
          className="mt-5"
          onClick={() => {
            if (importado) actualizar(() => importado);
            setImportado(null);
          }}
        >
          Reemplazar con el respaldo
        </Boton>
      </Hoja>

      <Hoja abierta={confirmar !== null} onCerrar={() => setConfirmar(null)} titulo={confirmar === 'borrar' ? '¿Borrar todo?' : '¿Reiniciar el ciclo?'}>
        <p className="text-[15px] text-texto2">
          {confirmar === 'borrar' ? 'Se borran todas tus sesiones, pesos y medidas, y vuelve la rutina semilla. Exporta un respaldo antes si lo quieres conservar.' : 'La cola vuelve a la primera sesión y a la vuelta 1 del ciclo actual.'}
        </p>
        <Boton
          className="mt-5"
          variante={confirmar === 'borrar' ? 'peligro' : 'primario'}
          onClick={() => {
            if (confirmar === 'borrar') actualizar(() => datosSemilla());
            else actualizar((d) => ({ ...d, cola: reiniciarCiclo(d.cola) }));
            setConfirmar(null);
          }}
        >
          {confirmar === 'borrar' ? 'Sí, borrar todo' : 'Reiniciar ciclo'}
        </Boton>
      </Hoja>
    </div>
  );
}

const CAMPOS: { k: keyof Perfil; etiqueta: string; unidad?: string }[] = [
  { k: 'altura', etiqueta: 'Altura', unidad: 'cm' },
  { k: 'pesoInicial', etiqueta: 'Peso inicial', unidad: 'kg' },
  { k: 'fcMax', etiqueta: 'FC máxima', unidad: 'lpm' },
  { k: 'caloriasObjetivo', etiqueta: 'Calorías', unidad: 'kcal' },
  { k: 'proteinaObjetivo', etiqueta: 'Proteína', unidad: 'g' },
  { k: 'grasaObjetivo', etiqueta: 'Grasa', unidad: 'g' },
  { k: 'z2Km', etiqueta: 'Distancia Z2', unidad: 'km' },
  { k: 'fondoKmInicial', etiqueta: 'Fondo inicial', unidad: 'km' },
  { k: 'topeFondoKm', etiqueta: 'Tope fondo', unidad: 'km' },
  { k: 'topeKmSemanal', etiqueta: 'Tope semanal', unidad: 'km' },
];

function FormPerfil({ onCerrar }: { onCerrar: () => void }) {
  const { datos, actualizar } = useDatos();
  const [sexo, setSexo] = useState<Sexo>(datos.perfil.sexo);
  const [valores, setValores] = useState<Record<string, string>>(() => Object.fromEntries(CAMPOS.map((c) => [c.k, deNum(datos.perfil[c.k] as number)])));
  const [ritmoSemilla, setRitmoSemilla] = useState(ritmo(datos.perfil.ritmoSemillaSegKm));
  const peso = pesoActual(datos);
  const kcal = aNum(valores.caloriasObjetivo ?? '');
  const grasa = aNum(valores.grasaObjetivo ?? '');

  const guardar = () => {
    const nuevo: Perfil = { ...datos.perfil, sexo };
    for (const c of CAMPOS) {
      const n = aNum(valores[c.k] ?? '');
      if (n !== null && n > 0) (nuevo as Record<keyof Perfil, unknown>)[c.k] = n;
    }
    const [m, s] = ritmoSemilla.split(':').map(Number);
    if (isFinite(m) && isFinite(s)) nuevo.ritmoSemillaSegKm = m * 60 + s;
    actualizar((d) => ({ ...d, perfil: nuevo }));
    onCerrar();
  };

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
        {CAMPOS.map((c) => (
          <Campo key={c.k} etiqueta={c.etiqueta} valor={valores[c.k] ?? ''} onCambio={(v) => setValores((x) => ({ ...x, [c.k]: v }))} unidad={c.unidad} />
        ))}
        <Campo etiqueta="Ritmo sin test" valor={ritmoSemilla} onCambio={setRitmoSemilla} unidad="/km" teclado="text" />
      </div>
      {kcal !== null && kcal < PISO_KCAL && <p className="mt-3 text-sm text-alerta">Bajo el piso de seguridad de {PISO_KCAL} kcal.</p>}
      {grasa !== null && grasa < pisoGrasa(peso) && <p className="mt-3 text-sm text-alerta">Bajo el piso de grasa ({pisoGrasa(peso)} g = 0,8 g/kg).</p>}
      <Boton className="mt-5" onClick={guardar}>
        Guardar
      </Boton>
    </Hoja>
  );
}
