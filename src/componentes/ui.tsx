import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PorQue } from './PorQue';

export const aNum = (s: string): number | null => {
  const n = parseFloat(s.replace(',', '.'));
  return isFinite(n) ? n : null;
};
export const deNum = (n: number | null | undefined): string => (n === null || n === undefined ? '' : String(n).replace('.', ','));

type Variante = 'primario' | 'secundario' | 'texto' | 'peligro';
const VARIANTES: Record<Variante, string> = {
  primario: 'h-14 w-full rounded-xl bg-acento text-[17px] font-semibold text-fondo',
  secundario: 'h-12 w-full rounded-xl border border-linea font-medium text-texto',
  texto: 'h-11 px-2 font-medium text-texto2',
  peligro: 'h-12 w-full rounded-xl border border-alerta font-medium text-alerta',
};

export function Boton({ children, onClick, variante = 'primario', className = '', disabled }: { children: ReactNode; onClick?: () => void; variante?: Variante; className?: string; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${VARIANTES[variante]} active:opacity-75 disabled:opacity-35 ${className}`}>
      {children}
    </button>
  );
}

export function Hoja({ abierta, onCerrar, titulo, children }: { abierta: boolean; onCerrar: () => void; titulo: string; children: ReactNode }) {
  useEffect(() => {
    if (!abierta) return;
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', tecla);
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', tecla);
      document.body.style.overflow = previo;
    };
  }, [abierta, onCerrar]);

  if (!abierta) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-velo" onClick={onCerrar} />
      <div role="dialog" aria-modal="true" aria-label={titulo} className="relative mx-auto max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-superficie px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="pt-1.5 text-lg font-semibold leading-snug">{titulo}</h2>
          <button type="button" onClick={onCerrar} className="-mr-2 h-10 shrink-0 px-2 text-texto2">
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Campo({ etiqueta, valor, onCambio, unidad, teclado = 'decimal', placeholder }: { etiqueta: string; valor: string; onCambio: (v: string) => void; unidad?: string; teclado?: 'decimal' | 'numeric' | 'text'; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-sm text-texto2">{etiqueta}</span>
      <div className="mt-1 flex items-center rounded-xl border border-linea bg-fondo px-3">
        <input value={valor} onChange={(e) => onCambio(e.target.value)} inputMode={teclado} placeholder={placeholder} className="h-12 w-full min-w-0 bg-transparent text-[17px] text-texto outline-none placeholder:text-texto2" />
        {unidad && <span className="ml-2 shrink-0 text-sm text-texto2">{unidad}</span>}
      </div>
    </label>
  );
}

export function Casilla({ marcada, onCambio, children }: { marcada: boolean; onCambio: (v: boolean) => void; children: ReactNode }) {
  return (
    <button type="button" role="checkbox" aria-checked={marcada} onClick={() => onCambio(!marcada)} className="flex min-h-12 w-full items-center gap-3 text-left">
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${marcada ? 'border-acento bg-acento text-fondo' : 'border-texto2'}`}>{marcada ? '✓' : ''}</span>
      <span className="text-[15px]">{children}</span>
    </button>
  );
}

export function Segmentado<T extends string | number>({ opciones, valor, onCambio }: { opciones: { valor: T; etiqueta: string }[]; valor: T | null; onCambio: (v: T) => void }) {
  return (
    <div className="flex gap-2">
      {opciones.map((o) => (
        <button key={String(o.valor)} type="button" onClick={() => onCambio(o.valor)} aria-pressed={valor === o.valor} className={`h-11 flex-1 rounded-xl text-[15px] font-medium ${valor === o.valor ? 'bg-texto text-fondo' : 'border border-linea text-texto2'}`}>
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}

// Aviso de alerta: la única superficie donde aparece el color de alerta.
export function Aviso({ texto, porQue }: { texto: string; porQue: string }) {
  return (
    <div className="mt-4 flex items-start gap-3 border-l-2 border-alerta pl-3">
      <p className="flex-1 text-[15px] leading-snug">{texto}</p>
      <PorQue id={porQue} />
    </div>
  );
}

export function Nota({ children, porQue }: { children: ReactNode; porQue?: string }) {
  return (
    <div className="mt-4 flex items-start gap-3 border-l-2 border-linea pl-3">
      <p className="flex-1 text-[15px] leading-snug text-texto2">{children}</p>
      {porQue && <PorQue id={porQue} />}
    </div>
  );
}

export function Fila({ titulo, sub, onClick }: { titulo: string; sub?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-3 border-b border-linea py-4 text-left">
      <span>
        <span className="block text-[17px]">{titulo}</span>
        {sub && <span className="block text-sm text-texto2">{sub}</span>}
      </span>
      <span aria-hidden className="text-xl text-texto2">›</span>
    </button>
  );
}

export function Encabezado({ children }: { children: ReactNode }) {
  return <h1 className="text-2xl font-semibold">{children}</h1>;
}

// Un solo enlace de volver por pantalla: cada subpantalla dibuja el suyo.
export function Volver({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="-ml-1 mb-2 h-11 px-1 text-texto2">
      ‹ {children}
    </button>
  );
}
