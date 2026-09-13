import type { ReactNode } from 'react';
import { useDatos } from '../almacen/contexto';
import { Boton, Encabezado, Segmentado } from '../componentes/ui';
import { PorQue } from '../componentes/PorQue';
import { diaLocal } from '../motor/fechas';
import { fmt0, fmt1 } from '../motor/formato';
import { aplicarKcal, guiaAyuno, macros, metaSemanal, pesoActual, pisoGrasa, promediosSemanales, propuestaKcal, proteinaPorComida, rangoProteinaDeficit } from '../motor/nutricion';

const NOMBRE_SEMANA = ['Últimos 7 días', 'Semana anterior', 'Hace 2 semanas', 'Hace 3 semanas'];

export function Nutricion() {
  const { datos, actualizar } = useDatos();
  const ahora = new Date();
  const hoy = diaLocal(ahora);
  const m = macros(datos.perfil);
  const peso = pesoActual(datos);
  const enDeficit = datos.perfil.objetivo === 'perder_grasa';
  const rango = enDeficit ? rangoProteinaDeficit(datos) : null;
  const porComida = proteinaPorComida(m.proteina, peso);
  const semanas = promediosSemanales(datos.pesos, ahora, 4);
  const propuesta = propuestaKcal(datos, ahora);
  const entreno = datos.entrenoHoy?.fecha === hoy ? datos.entrenoHoy : undefined;
  const guia = guiaAyuno(entreno, m.proteina, ahora);
  const bajoPisoGrasa = m.grasa < pisoGrasa(peso);

  const fijarEntreno = (cambio: Partial<{ hora: string | null; ayunoRoto: boolean }>) =>
    actualizar((d) => {
      const base = d.entrenoHoy?.fecha === hoy ? d.entrenoHoy : { fecha: hoy, hora: '19:00', ayunoRoto: true };
      return { ...d, entrenoHoy: { ...base, ...cambio } };
    });

  const extraProteina = enDeficit ? rango ? <>Con tu última estimación de grasa, el rango en déficit es {rango[0]}–{rango[1]} g/día.</> : <>Registra cuello y cintura para calcular tu rango en déficit.</> : undefined;

  return (
    <div>
      <Encabezado>Nutrición</Encabezado>

      <section className="border-b border-linea py-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-texto2">Objetivo diario</h2>
          <PorQue id="objetivo_kcal" />
        </div>
        <p className="num mt-1 text-[64px] leading-none">
          {fmt0(m.kcal)} <span className="text-2xl text-texto2">kcal</span>
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Macro nombre="Proteína" gramos={m.proteina} porQue="proteina" extra={extraProteina} sub={`${fmt1(m.proteina / peso)} g/kg`} />
          <Macro nombre="Grasa" gramos={m.grasa} porQue="grasa" sub={bajoPisoGrasa ? `bajo el piso (${pisoGrasa(peso)} g)` : `${fmt1(m.grasa / peso)} g/kg`} alerta={bajoPisoGrasa} />
          <Macro nombre="Carbos" gramos={m.carbos} sub="el resto" />
        </div>
      </section>

      <section className="border-b border-linea py-5">
        <h2 className="text-sm text-texto2">Hoy</h2>
        <div className="mt-3 flex items-center gap-3">
          <span className="flex-1 text-[15px]">Entreno a las</span>
          <input
            type="time"
            value={entreno?.hora ?? ''}
            onChange={(e) => fijarEntreno({ hora: e.target.value || null })}
            className="num h-12 rounded-xl border border-linea bg-superficie px-3 text-2xl text-texto"
            aria-label="Hora de entreno"
          />
        </div>
        <div className="mt-3">
          <Segmentado<'si' | 'no' | 'libre'>
            opciones={[
              { valor: 'no', etiqueta: 'En ayunas' },
              { valor: 'si', etiqueta: 'Ya comí' },
              { valor: 'libre', etiqueta: 'Sin entreno' },
            ]}
            valor={!entreno ? null : entreno.hora === null ? 'libre' : entreno.ayunoRoto ? 'si' : 'no'}
            onCambio={(v) => fijarEntreno(v === 'libre' ? { hora: null } : { ayunoRoto: v === 'si', hora: entreno?.hora ?? '19:00' })}
          />
        </div>
        {guia ? (
          <div className="mt-4 flex items-start gap-3">
            <p className="flex-1 text-[17px] leading-snug">{guia.texto}</p>
            <PorQue id={guia.porQue} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-texto2">Marca tu hora de entreno para ver la guía de hoy.</p>
        )}
        <div className="mt-4 flex items-start gap-3">
          <p className="flex-1 text-[15px] text-texto2">
            Proteína en {porComida.comidas} comidas de ~{porComida.gramos} g (mínimo ~{porComida.minimo} g cada una).
          </p>
          <PorQue id="reparto_proteina" />
        </div>
      </section>

      <section className="py-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-texto2">Calibración</h2>
          <PorQue id="calibracion" />
        </div>
        <ul className="mt-2 divide-y divide-linea">
          {semanas.map((s) => (
            <li key={s.semana} className="flex justify-between py-2 text-[15px]">
              <span className="text-texto2">{NOMBRE_SEMANA[s.semana]}</span>
              <span className="num text-lg">{s.promedio !== null ? `${fmt1(s.promedio)} kg` : s.n === 1 ? '1 pesaje' : '–'}</span>
            </li>
          ))}
        </ul>
        {propuesta ? (
          <div className="mt-4">
            <div className="flex items-start gap-3">
              <p className="flex-1 text-[15px] leading-snug">{propuesta.texto}</p>
              <PorQue id={propuesta.porQue} />
            </div>
            {propuesta.deltaKcal !== 0 && (
              <Boton className="mt-3" variante="secundario" onClick={() => actualizar((d) => aplicarKcal(d, propuesta.deltaKcal, new Date()))}>
                Aplicar {propuesta.deltaKcal > 0 ? '+' : '−'}
                {Math.abs(propuesta.deltaKcal)} kcal
              </Boton>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-texto2">{metaSemanal(datos.perfil, peso)} Con 2 o más pesajes por semana la app calibra sola.</p>
        )}
      </section>
    </div>
  );
}

function Macro({ nombre, gramos, sub, porQue, extra, alerta }: { nombre: string; gramos: number; sub: string; porQue?: string; extra?: ReactNode; alerta?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-texto2">{nombre}</span>
        {porQue && <PorQue id={porQue} extra={extra} pequeno />}
      </div>
      <p className="num mt-1 text-4xl leading-none">
        {fmt0(gramos)}
        <span className="text-lg text-texto2"> g</span>
      </p>
      <p className={`mt-1 text-xs ${alerta ? 'text-alerta' : 'text-texto2'}`}>{sub}</p>
    </div>
  );
}
