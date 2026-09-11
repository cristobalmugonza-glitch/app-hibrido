import { useState } from 'react';
import { Encabezado, Fila, Volver } from '../componentes/ui';
import { Ciencia } from './Ciencia';
import { Ajustes } from './Ajustes';

export function Mas() {
  const [sub, setSub] = useState<null | 'ciencia' | 'ajustes'>(null);

  if (sub === 'ciencia') {
    return (
      <div>
        <Volver onClick={() => setSub(null)}>Más</Volver>
        <Ciencia />
      </div>
    );
  }
  if (sub === 'ajustes') return <Ajustes onVolver={() => setSub(null)} />;

  return (
    <div>
      <Encabezado>Más</Encabezado>
      <div className="mt-4">
        <Fila titulo="Ciencia" sub="El por qué de cada recomendación y sus referencias" onClick={() => setSub('ciencia')} />
        <Fila titulo="Ajustes" sub="Perfil, rutina, secuencia y respaldo" onClick={() => setSub('ajustes')} />
      </div>
    </div>
  );
}
