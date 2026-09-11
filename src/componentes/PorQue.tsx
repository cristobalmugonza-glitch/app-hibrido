import { useState, type ReactNode } from 'react';
import { NOMBRE_ETIQUETA, PORQUES, type PorQue as TPorQue } from '../data/porques';
import { NOMBRE_NIVEL, REF_POR_ID, type Referencia } from '../data/referencias';
import { Hoja } from './ui';

// Ícono discreto junto a cada recomendación: abre el "por qué" con sus referencias.
// tono "invertido" es para ponerlo sobre la banda de color acento; className solo para márgenes.
export function PorQue({ id, extra, className = '', tono = 'normal', pequeno = false }: { id: string; extra?: ReactNode; className?: string; tono?: 'normal' | 'invertido'; pequeno?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const pq = PORQUES[id];
  if (!pq) return null;
  const color = tono === 'invertido' ? 'border-fondo text-fondo' : 'border-linea text-texto2';
  const tam = pequeno ? 'h-6 w-6 text-xs' : 'h-7 w-7 text-[13px]';
  return (
    <>
      <button
        type="button"
        aria-label={`Por qué: ${pq.titulo}`}
        onClick={(e) => {
          e.stopPropagation();
          setAbierto(true);
        }}
        className={`relative inline-flex shrink-0 items-center justify-center rounded-full border font-medium after:absolute after:-inset-2 after:content-[''] ${tam} ${color} ${className}`}
      >
        ?
      </button>
      <Hoja abierta={abierto} onCerrar={() => setAbierto(false)} titulo={pq.titulo}>
        <DetallePorQue pq={pq} extra={extra} />
      </Hoja>
    </>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="inline-block rounded-full border border-linea px-2.5 py-0.5 text-xs text-texto2">{children}</span>;
}

export function DetallePorQue({ pq, extra }: { pq: TPorQue; extra?: ReactNode }) {
  const refs = pq.refs.map((id) => REF_POR_ID[id]).filter(Boolean);
  return (
    <div className="space-y-3 text-[15px] leading-relaxed">
      {pq.etiqueta && <Chip>{NOMBRE_ETIQUETA[pq.etiqueta]}</Chip>}
      {pq.texto.map((t, i) => (
        <p key={i}>{t}</p>
      ))}
      {extra && <div className="rounded-xl border border-linea p-3 text-sm">{extra}</div>}
      {refs.length > 0 && (
        <div className="pt-2">
          <h3 className="mb-2 text-sm text-texto2">Referencias</h3>
          <ul className="space-y-4">
            {refs.map((r) => (
              <li key={r.id}>
                <Cita r={r} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Cita({ r, completa = false }: { r: Referencia; completa?: boolean }) {
  return (
    <div className="text-sm leading-relaxed">
      {/* En la vista completa (Ciencia) el título ya está en la fila; acá van los autores completos. */}
      <p>
        {completa ? (
          `${r.autores}.`
        ) : (
          <>
            {r.autores} ({r.anio}). {r.titulo}
            {/[.?!]$/.test(r.titulo) ? '' : '.'}
          </>
        )}
      </p>
      <p className="text-texto2">
        {r.revista} · {NOMBRE_NIVEL[r.nivelEvidencia]}
        {r.enDisputa ? ' · en discusión' : ''}
      </p>
      {completa && (
        <>
          <p className="mt-2">{r.hallazgo}</p>
          <p className="mt-1 text-texto2">Límites: {r.limitaciones}</p>
        </>
      )}
      <a href={r.url} target="_blank" rel="noopener noreferrer" className="break-all text-acento underline underline-offset-2">
        {r.doi ? `doi:${r.doi}` : 'Ver informe (DTIC)'}
      </a>
    </div>
  );
}
