import { useState } from 'react';
import { Encabezado, Segmentado } from '../componentes/ui';
import { Chip, Cita, DetallePorQue } from '../componentes/PorQue';
import { NOMBRE_ETIQUETA, PORQUES_LISTA } from '../data/porques';
import { NOMBRE_TEMA, REFERENCIAS, type Tema } from '../data/referencias';

type FiltroRec = 'todas' | 'discusion' | 'limitada';
type FiltroRef = 'todas' | 'metaanalisis' | 'eca' | 'consenso' | 'disputa';

const TEMAS = Object.keys(NOMBRE_TEMA) as Tema[];

function Filtros<T extends string>({ opciones, valor, onCambio }: { opciones: [T, string][]; valor: T; onCambio: (v: T) => void }) {
  return (
    <div className="sin-barra -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
      {opciones.map(([v, e]) => (
        <button key={v} type="button" onClick={() => onCambio(v)} aria-pressed={valor === v} className={`h-9 shrink-0 rounded-full px-3.5 text-sm ${valor === v ? 'bg-texto text-fondo' : 'border border-linea text-texto2'}`}>
          {e}
        </button>
      ))}
    </div>
  );
}

export function Ciencia() {
  const [vista, setVista] = useState<'rec' | 'ref'>('rec');
  const [filtroRec, setFiltroRec] = useState<FiltroRec>('todas');
  const [filtroRef, setFiltroRef] = useState<FiltroRef>('todas');
  const [abierto, setAbierto] = useState<string | null>(null);
  const alternar = (id: string) => setAbierto((a) => (a === id ? null : id));

  const recs = PORQUES_LISTA.filter((p) => filtroRec === 'todas' || p.etiqueta === filtroRec);
  const refs = REFERENCIAS.filter((r) => {
    if (filtroRef === 'todas') return true;
    if (filtroRef === 'disputa') return r.enDisputa;
    if (filtroRef === 'metaanalisis') return r.nivelEvidencia === 'metaanalisis' || r.nivelEvidencia === 'revision_sistematica';
    if (filtroRef === 'eca') return r.nivelEvidencia === 'eca' || r.nivelEvidencia === 'experimental';
    return r.nivelEvidencia === filtroRef;
  });

  return (
    <div>
      <Encabezado>Ciencia</Encabezado>
      <p className="mt-1 text-sm text-texto2">{REFERENCIAS.length} referencias. Todas con DOI verificado, salvo el informe técnico Navy.</p>
      <div className="mt-4">
        <Segmentado
          opciones={[
            { valor: 'rec', etiqueta: 'Recomendaciones' },
            { valor: 'ref', etiqueta: 'Referencias' },
          ]}
          valor={vista}
          onCambio={(v) => {
            setVista(v);
            setAbierto(null);
          }}
        />
      </div>
      <div className="mt-3">
        {vista === 'rec' ? (
          <Filtros<FiltroRec>
            opciones={[
              ['todas', 'Todas'],
              ['discusion', NOMBRE_ETIQUETA.discusion],
              ['limitada', 'Evidencia limitada'],
            ]}
            valor={filtroRec}
            onCambio={setFiltroRec}
          />
        ) : (
          <Filtros<FiltroRef>
            opciones={[
              ['todas', 'Todas'],
              ['metaanalisis', 'Metaanálisis y revisiones'],
              ['eca', 'Ensayos'],
              ['consenso', 'Consenso'],
              ['disputa', 'En discusión'],
            ]}
            valor={filtroRef}
            onCambio={setFiltroRef}
          />
        )}
      </div>

      {TEMAS.map((tema) => {
        if (vista === 'rec') {
          const items = recs.filter((p) => p.tema === tema);
          if (!items.length) return null;
          return (
            <section key={tema} className="mt-6">
              <h2 className="text-sm text-texto2">{NOMBRE_TEMA[tema]}</h2>
              <ul className="mt-1 divide-y divide-linea border-y border-linea">
                {items.map((p) => (
                  <li key={p.id} className="py-3">
                    <button type="button" onClick={() => alternar(p.id)} aria-expanded={abierto === p.id} className="flex w-full items-start justify-between gap-3 text-left">
                      <span className="text-[16px]">{p.titulo}</span>
                      {p.etiqueta && <Chip>{p.etiqueta === 'discusion' ? 'en discusión' : 'limitada'}</Chip>}
                    </button>
                    {abierto === p.id && (
                      <div className="mt-3">
                        <DetallePorQue pq={p} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        }
        const items = refs.filter((r) => r.tema === tema);
        if (!items.length) return null;
        return (
          <section key={tema} className="mt-6">
            <h2 className="text-sm text-texto2">{NOMBRE_TEMA[tema]}</h2>
            <ul className="mt-1 divide-y divide-linea border-y border-linea">
              {items.map((r) => (
                <li key={r.id} className="py-3">
                  <button type="button" onClick={() => alternar(r.id)} aria-expanded={abierto === r.id} className="w-full text-left">
                    <span className="block text-sm text-texto2">
                      {r.autores.split(',')[0]} {r.anio}
                      {r.enDisputa ? ' · en discusión' : ''}
                    </span>
                    <span className="block text-[15px] leading-snug">{r.titulo}</span>
                  </button>
                  {abierto === r.id && (
                    <div className="mt-3">
                      <Cita r={r} completa />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
