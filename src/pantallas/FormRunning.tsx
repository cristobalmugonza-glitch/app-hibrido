import { useState } from 'react';
import type { TipoRunning } from '../tipos/modelo';
import { useDatos } from '../almacen/contexto';
import { aNum, Boton, Campo, Casilla, Hoja } from '../componentes/ui';
import { ahoraIso } from '../motor/fechas';
import { ritmo } from '../motor/formato';
import { NOMBRE_RUNNING } from '../motor/planificacion';
import { fcTest, tieneProtocoloTobillo, zonaDe } from '../motor/running';
import { guardarRunning } from '../motor/sesiones';

export function FormRunning({ tipo, onCerrar }: { tipo: TipoRunning | 'test'; onCerrar: () => void }) {
  const { datos, actualizar } = useDatos();
  const fcDelTest = fcTest(datos.perfil.fcMax);
  const [km, setKm] = useState(tipo === 'test' ? '8' : '');
  const [min, setMin] = useState('');
  const [seg, setSeg] = useState('');
  const [fc, setFc] = useState(tipo === 'test' ? String(fcDelTest) : '');
  const [fcMax, setFcMax] = useState('');
  const [esTest, setEsTest] = useState(tipo === 'test');
  const [equilibrio, setEquilibrio] = useState(false);
  const conTobillo = tieneProtocoloTobillo(datos);

  const distancia = aNum(km);
  const duracion = (aNum(min) ?? 0) + (aNum(seg) ?? 0) / 60;
  const fcProm = aNum(fc);
  const valido = !!distancia && distancia > 0 && duracion > 0 && !!fcProm && fcProm > 0;

  const guardar = () => {
    if (!valido) return;
    actualizar((d) =>
      guardarRunning(d, {
        fecha: ahoraIso(),
        tipo: esTest ? 'test' : tipo,
        distanciaKm: distancia!,
        duracionMin: duracion,
        fcPromedio: fcProm!,
        fcMaxima: aNum(fcMax) ?? undefined,
        ...(conTobillo ? { equilibrioHecho: equilibrio } : {}),
      }),
    );
    onCerrar();
  };

  return (
    <Hoja abierta onCerrar={onCerrar} titulo={NOMBRE_RUNNING[esTest ? 'test' : tipo]}>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Distancia" valor={km} onCambio={setKm} unidad="km" />
        <Campo etiqueta="FC promedio" valor={fc} onCambio={setFc} unidad="lpm" teclado="numeric" />
        <Campo etiqueta="Duración" valor={min} onCambio={setMin} unidad="min" teclado="numeric" />
        <Campo etiqueta="y segundos" valor={seg} onCambio={setSeg} unidad="s" teclado="numeric" />
        <Campo etiqueta="FC máxima (opcional)" valor={fcMax} onCambio={setFcMax} unidad="lpm" teclado="numeric" />
      </div>

      <p className="mt-4 text-texto2">
        {valido ? (
          <>
            Ritmo <span className="num text-2xl text-texto">{ritmo((duracion * 60) / distancia!)}</span> /km · {zonaDe(fcProm!, datos.perfil.fcMax)}
          </>
        ) : (
          'Completa distancia, duración y FC.'
        )}
      </p>

      <div className="mt-2">
        {(tipo === 'z2' || tipo === 'test') && (
          <Casilla marcada={esTest} onCambio={setEsTest}>
            Fue el test de 8 km a {fcDelTest} lpm
          </Casilla>
        )}
        {conTobillo && (
          <Casilla marcada={equilibrio} onCambio={setEquilibrio}>
            Hice equilibrio antes (2 × 30 s por lado)
          </Casilla>
        )}
      </div>

      <Boton className="mt-4" disabled={!valido} onClick={guardar}>
        Guardar carrera
      </Boton>
    </Hoja>
  );
}
