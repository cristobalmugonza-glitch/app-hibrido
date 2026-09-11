import { useEffect, useState } from 'react';
import { aNum, deNum } from './ui';

// Número grande editable con botones +/− para usar con una mano.
export function Stepper({ valor, onCambio, paso, unidad, min = 0 }: { valor: number; onCambio: (v: number) => void; paso: number; unidad: string; min?: number }) {
  const [texto, setTexto] = useState(deNum(valor));
  useEffect(() => setTexto(deNum(valor)), [valor]);

  const confirmar = () => {
    const n = aNum(texto);
    if (n !== null && n >= min) onCambio(n);
    else setTexto(deNum(valor));
  };
  const sumar = (d: number) => onCambio(Math.max(min, Math.round((valor + d) * 100) / 100));

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <input
        aria-label={unidad}
        value={texto}
        inputMode="decimal"
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="num w-full bg-transparent text-center text-[64px] leading-none text-texto outline-none"
      />
      <span className="mt-1 text-sm text-texto2">{unidad}</span>
      <div className="mt-3 flex w-full gap-2">
        <button type="button" aria-label={`Menos ${unidad}`} onClick={() => sumar(-paso)} className="h-14 flex-1 rounded-xl bg-superficie text-3xl active:opacity-70">
          −
        </button>
        <button type="button" aria-label={`Más ${unidad}`} onClick={() => sumar(paso)} className="h-14 flex-1 rounded-xl bg-superficie text-3xl active:opacity-70">
          +
        </button>
      </div>
    </div>
  );
}
