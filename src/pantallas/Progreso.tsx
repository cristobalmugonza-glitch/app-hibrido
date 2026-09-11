import { useState, type ReactNode } from 'react';
import { useDatos } from '../almacen/contexto';
import { Encabezado } from '../componentes/ui';
import { PorQue } from '../componentes/PorQue';
import { Grafico, type Punto } from '../componentes/Grafico';
import { enVentana, fechaCorta } from '../motor/fechas';
import { fmt1, fmt2, ritmo } from '../motor/formato';
import { ratioHombrosCintura } from '../motor/grasa';
import { tasaSemanal } from '../motor/nutricion';
import { kmEnVentana, ritmoSesion, tendenciaZ2, zonas } from '../motor/running';

// Sin datos: un solo texto que dice cómo aparecen. Con 1 dato: el valor. Con 2 o más: el gráfico.
function Bloque({ titulo, valor, sub, sinDatos, porQue, children }: { titulo: string; valor: string | null; sub?: string; sinDatos?: string; porQue?: string; children?: ReactNode }) {
  return (
    <section className="border-b border-linea py-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm text-texto2">{titulo}</h2>
        {porQue && <PorQue id={porQue} />}
      </div>
      {valor === null ? (
        <p className="mt-2 text-[15px] text-texto2">{sinDatos}</p>
      ) : (
        <>
          <p className="num mt-1 text-[40px] leading-none">{valor}</p>
          {sub && <p className="mt-1 text-sm text-texto2">{sub}</p>}
          {children}
        </>
      )}
    </section>
  );
}

export function Progreso() {
  const { datos } = useDatos();
  const ahora = new Date();

  const ratios: Punto[] = datos.medidas.flatMap((m) => {
    const y = ratioHombrosCintura(m);
    return y === null ? [] : [{ fecha: m.fecha, y }];
  });
  const z2: Punto[] = tendenciaZ2(datos).map((p) => ({ fecha: p.fecha, y: p.segKm }));
  const pesos: Punto[] = datos.pesos.map((p) => ({ fecha: p.fecha, y: p.peso }));
  const media7: Punto[] = datos.pesos.map((p) => {
    const ventana = datos.pesos.filter((q) => enVentana(q.fecha, new Date(p.fecha), 0, 7));
    return { fecha: p.fecha, y: ventana.reduce((a, q) => a + q.peso, 0) / ventana.length };
  });
  const grasa: Punto[] = datos.medidas.filter((m) => m.grasaNavy !== undefined).map((m) => ({ fecha: m.fecha, y: m.grasaNavy! }));
  const tasa = tasaSemanal(datos, ahora);
  const km7 = kmEnVentana(datos, ahora, 0, 7);
  const topeZ2 = zonas(datos.perfil.fcMax)[1].hasta;

  const conCarga = datos.rutina.plantillas
    .flatMap((p) => p.ejercicios)
    .filter((e, i, a) => e.modo === 'carga' && a.findIndex((x) => x.id === e.id) === i && datos.sesionesGym.some((s) => s.ejercicios.some((r) => r.ejercicioId === e.id)));
  const [ejId, setEjId] = useState(conCarga[0]?.id ?? '');
  const cargas: Punto[] = datos.sesionesGym.flatMap((s) => {
    const r = s.ejercicios.find((e) => e.ejercicioId === ejId);
    return r && r.series.length ? [{ fecha: s.fecha, y: Math.max(...r.series.map((x) => x.peso)) }] : [];
  });

  const tests = datos.sesionesRunning.filter((s) => s.tipo === 'test');
  const ultimo = (xs: Punto[]) => xs.at(-1)?.y;

  return (
    <div>
      <Encabezado>Progreso</Encabezado>

      <Bloque titulo="Hombros / cintura" valor={ratios.length ? fmt2(ultimo(ratios)!) : null} sinDatos="Registra hombros y cintura en Medidas.">
        <Grafico series={[{ puntos: ratios, tono: 'acento', conPuntos: true }]} fmtY={fmt2} />
      </Bloque>

      <Bloque titulo={`Ritmo Z2 a FC ≤ ${topeZ2}`} valor={z2.length ? `${ritmo(ultimo(z2)!)}/km` : null} sinDatos="Aparece con tus carreras en Z2 y tus tests." porQue="densidad_aerobica">
        <Grafico series={[{ puntos: z2, tono: 'acento', conPuntos: true }]} fmtY={ritmo} invertir />
      </Bloque>

      <Bloque
        titulo="Peso"
        valor={pesos.length ? `${fmt1(ultimo(media7)!)} kg` : null}
        sub={`Promedio de 7 días${tasa !== null ? ` · ${tasa >= 0 ? '−' : '+'}${fmt1(Math.abs(tasa))} kg/semana` : ''}`}
        sinDatos="Registra tu peso en Registrar."
        porQue="ritmo_perdida"
      >
        <Grafico
          series={[
            { puntos: pesos, tono: 'tenue', conPuntos: true },
            { puntos: media7, tono: 'acento' },
          ]}
          fmtY={fmt1}
        />
      </Bloque>

      <Bloque titulo="Grasa estimada (Navy)" valor={grasa.length ? `${fmt1(ultimo(grasa)!)} %` : null} sub="±3–4 puntos: mira la tendencia" sinDatos="Registra cuello y cintura en Medidas." porQue="navy">
        <Grafico series={[{ puntos: grasa, tono: 'acento', conPuntos: true }]} fmtY={fmt1} />
      </Bloque>

      <Bloque titulo="Km en los últimos 7 días" valor={`${fmt1(km7)} km`} sub={`Tope ${datos.perfil.topeKmSemanal} km`} porQue="tope_km" />

      <section className="border-b border-linea py-5">
        <h2 className="text-sm text-texto2">Carga por ejercicio</h2>
        {conCarga.length ? (
          <>
            <select value={ejId} onChange={(e) => setEjId(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-linea bg-superficie px-3 text-texto">
              {conCarga.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
            <Grafico series={[{ puntos: cargas, tono: 'acento', conPuntos: true }]} fmtY={(y) => `${fmt1(y)} kg`} vacio="Con una segunda sesión de este ejercicio aparece la curva." />
          </>
        ) : (
          <p className="mt-2 text-[15px] text-texto2">Aparece después de tu primera sesión de gym.</p>
        )}
      </section>

      <section className="py-5">
        <h2 className="text-sm text-texto2">Benchmarks</h2>
        {tests.length === 0 && datos.dominadas.length === 0 ? (
          <p className="mt-2 text-[15px] text-texto2">Todavía no hay tests registrados.</p>
        ) : (
          <ul className="mt-2 divide-y divide-linea">
            {tests.map((t) => (
              <li key={t.id} className="flex justify-between py-2 text-[15px]">
                <span className="text-texto2">Test 8 km · {fechaCorta(t.fecha)}</span>
                <span className="num text-lg">
                  {ritmo(ritmoSesion(t))}/km · {t.fcPromedio} lpm
                </span>
              </li>
            ))}
            {datos.dominadas.map((d, i) => (
              <li key={i} className="flex justify-between py-2 text-[15px]">
                <span className="text-texto2">Dominadas · {fechaCorta(d.fecha)}</span>
                <span className="num text-lg">
                  {fmt1(d.lastreKg)} kg × {d.reps}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
