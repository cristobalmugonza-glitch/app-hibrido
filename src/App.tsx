import { useState } from 'react';
import { useAlmacen } from './almacen/contexto';
import { Hoy } from './pantallas/Hoy';
import { RegistroGym } from './pantallas/RegistroGym';
import { Semana } from './pantallas/Semana';
import { Progreso } from './pantallas/Progreso';
import { Nutricion } from './pantallas/Nutricion';
import { Mas } from './pantallas/Mas';
import { Onboarding } from './pantallas/Onboarding';

export type Tab = 'hoy' | 'semana' | 'progreso' | 'nutricion' | 'mas';

const TABS: { id: Tab; nombre: string }[] = [
  { id: 'hoy', nombre: 'Hoy' },
  { id: 'semana', nombre: 'Semana' },
  { id: 'progreso', nombre: 'Progreso' },
  { id: 'nutricion', nombre: 'Nutrición' },
  { id: 'mas', nombre: 'Más' },
];

export default function App() {
  const { datos, reemplazar } = useAlmacen();
  const [tab, setTab] = useState<Tab>('hoy');
  const [registroOculto, setRegistroOculto] = useState(false);

  if (!datos) {
    return (
      <Onboarding
        onListo={(d) => {
          reemplazar(d);
          setTab('hoy');
        }}
      />
    );
  }

  if (datos.borradorGym && !registroOculto) {
    return <RegistroGym onMinimizar={() => setRegistroOculto(true)} />;
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-md">
      <main className="px-5 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))]">
        {tab === 'hoy' && <Hoy onAbrirRegistro={() => setRegistroOculto(false)} />}
        {tab === 'semana' && <Semana />}
        {tab === 'progreso' && <Progreso />}
        {tab === 'nutricion' && <Nutricion />}
        {tab === 'mas' && <Mas />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-fondo pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-md">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                window.scrollTo(0, 0);
              }}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`h-14 flex-1 text-[13px] font-medium ${tab === t.id ? 'text-texto' : 'text-texto2'}`}
            >
              <span className={`border-b-2 pb-1 ${tab === t.id ? 'border-acento' : 'border-transparent'}`}>{t.nombre}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
