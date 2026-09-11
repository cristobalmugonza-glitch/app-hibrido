import { fechaCorta } from '../motor/fechas';

export type Punto = { fecha: string; y: number };
type Serie = { puntos: Punto[]; tono: 'acento' | 'tenue'; conPuntos?: boolean };

const W = 320;
const IZQ = 44;
const DER = 8;
const ARR = 10;
const ABA = 22;

// Línea simple en SVG, sin librerías. invertir = valores bajos arriba (ritmo: más rápido es mejor).
export function Grafico({ series, alto = 150, invertir = false, fmtY, vacio = 'Con un segundo registro aparece la tendencia.' }: { series: Serie[]; alto?: number; invertir?: boolean; fmtY: (y: number) => string; vacio?: string }) {
  const todos = series.flatMap((s) => s.puntos);
  // Hace falta al menos una serie con dos fechas distintas para que haya una tendencia que mostrar.
  const hayTendencia = series.some((s) => new Set(s.puntos.map((p) => p.fecha)).size >= 2);
  if (!hayTendencia) return vacio ? <p className="mt-2 text-sm text-texto2">{vacio}</p> : null;

  const xs = todos.map((p) => new Date(p.fecha).getTime());
  const ys = todos.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs) === minX ? minX + 1 : Math.max(...xs);
  const minYReal = Math.min(...ys);
  const maxYReal = Math.max(...ys);
  const margen = (maxYReal - minYReal) * 0.12 || Math.abs(maxYReal) * 0.02 || 1;
  const minY = minYReal - margen;
  const maxY = maxYReal + margen;

  const sx = (f: string) => IZQ + ((new Date(f).getTime() - minX) / (maxX - minX)) * (W - IZQ - DER);
  const sy = (y: number) => {
    const t = (y - minY) / (maxY - minY);
    return invertir ? ARR + t * (alto - ARR - ABA) : alto - ABA - t * (alto - ARR - ABA);
  };
  const color = (t: Serie['tono']) => (t === 'acento' ? 'var(--acento)' : 'var(--texto-2)');
  const primera = todos.reduce((a, b) => (a.fecha < b.fecha ? a : b)).fecha;
  const ultima = todos.reduce((a, b) => (a.fecha > b.fecha ? a : b)).fecha;

  return (
    <svg viewBox={`0 0 ${W} ${alto}`} className="mt-3 w-full" role="img" aria-label="Gráfico de tendencia">
      <line x1={IZQ} x2={W - DER} y1={alto - ABA} y2={alto - ABA} stroke="var(--linea)" />
      {[maxYReal, minYReal].map((v, i) => (
        <text key={i} x={IZQ - 8} y={sy(v) + 4} textAnchor="end" fontSize="11" fill="var(--texto-2)">
          {fmtY(v)}
        </text>
      ))}
      <text x={IZQ} y={alto - 5} fontSize="11" fill="var(--texto-2)">
        {fechaCorta(primera)}
      </text>
      <text x={W - DER} y={alto - 5} textAnchor="end" fontSize="11" fill="var(--texto-2)">
        {fechaCorta(ultima)}
      </text>
      {series.map((s, i) => (
        <g key={i}>
          <polyline fill="none" stroke={color(s.tono)} strokeWidth={s.tono === 'acento' ? 2.5 : 1.5} strokeLinejoin="round" strokeLinecap="round" points={s.puntos.map((p) => `${sx(p.fecha)},${sy(p.y)}`).join(' ')} />
          {s.conPuntos && s.puntos.map((p, j) => <circle key={j} cx={sx(p.fecha)} cy={sy(p.y)} r={2.5} fill={color(s.tono)} />)}
        </g>
      ))}
    </svg>
  );
}
