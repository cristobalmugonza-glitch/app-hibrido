# Híbrido

**App publicada:** https://cristobalmugonza-glitch.github.io/app-hibrido/ (en el iPhone: ábrela en Safari › Compartir › *Agregar a pantalla de inicio*).

App web de entrenamiento de fuerza y running, genérica para cualquier persona. Funciona en el navegador del celular, se instala en la pantalla de inicio y funciona sin conexión. Sin cuentas, sin servidor: los datos viven en el teléfono (`localStorage`) y se respaldan exportando un JSON.

- **Primera vez**: ingresas tus datos (sexo, edad, altura, peso, FC máxima opcional), tu objetivo (perder grasa, mantener o ganar músculo) y eliges una rutina estándar. La app calcula calorías, macros y zonas de FC.
- **Hoy**: eliges libremente qué bloque entrenar. La app sugiere uno entre lo pendiente de la semana que no choca con tu recuperación, y muestra cuántas veces llevas cada bloque. Desde acá se registran peso, molestias, medidas y tests.
- **Semana**: lo hecho vs. lo planificado (sesiones, series por músculo y km), la proyección de la próxima semana con ajustes que se aplican con un toque, y el historial semana a semana.
- **Progreso**: ratio hombros/cintura, ritmo Z2 a FC constante, peso, grasa estimada, km, carga por ejercicio y benchmarks.
- **Nutrición**: objetivos del día, guía de ayuno flexible según la hora de entreno y calibración semanal de calorías según tu objetivo.
- **Más › Ciencia**: el "por qué" de cada recomendación, con referencias verificadas y filtros por nivel de evidencia.
- **Más › Ajustes**: perfil y objetivos (con recálculo), plan semanal editable (bloques, veces por semana, ejercicios del catálogo o propios, prioridades por músculo), respaldo y borrado.

## Requisitos

- Node.js 20 o más nuevo (probado con Node 24).

## Correr en tu computador

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (por ejemplo `http://localhost:5173`).

| Comando | Qué hace |
| --- | --- |
| `npm test` | Tests del motor: planificación semanal, sugerencia del día, proyección, progresión, running, nutrición, perfil, catálogo, migración y reglas anti-invención de las referencias |
| `npm run typecheck` | Revisión de tipos de la app y de los tests |
| `npm run build` | Compila la versión de producción en `dist/` (incluye el service worker) |
| `npm run preview` | Sirve `dist/` para probar la versión compilada, incluido el modo sin conexión |
| `npm run iconos` | Regenera los íconos PNG en `public/` |

## Publicar

Cada push a `main` corre `.github/workflows/deploy.yml`: revisa tipos, corre los tests, compila y publica en GitHub Pages. La app usa rutas relativas (`base: './'`), así que también funciona en Vercel o en cualquier hosting estático.

**Instalar y usar sin conexión requiere HTTPS**: pruébala en el celular desde la URL publicada.

## Respaldo de datos

Los datos quedan solo en ese navegador y ese teléfono. En **Más › Ajustes › Respaldo**:

- **Exportar JSON**: en iPhone abre la hoja de compartir (guárdalo en Archivos, iCloud o mándatelo).
- **Importar JSON**: reemplaza los datos actuales (pide confirmación). Acepta respaldos de la versión actual y de la anterior.

## Cómo funciona el plan

- **Bloques libres.** Tu plan es una lista de bloques con cuántas veces por semana haces cada uno (por ejemplo Torso ×2, Pierna ×2, Running Z2 ×1). No hay orden obligatorio: cada día eliges.
- **Semana de lunes a domingo.** Todo se cuenta por semana real: sesiones por bloque, series por músculo (1 al principal, 0,5 a cada secundario) y km.
- **Sugerencia del día.** Entre lo pendiente, descarta lo que carga músculos entrenados con 3 series o más hace menos de 48 h, y las carreras exigentes a menos de 24 h de piernas pesadas u otra carrera exigente. Prioriza lo que más falta y lo que hace más tiempo no haces.
- **Descarga.** Después de 3 semanas de carga, la cuarta es de descarga (mismo peso, mitad de series, sin fallo, 60 % de los km). Se adelanta si 2 ejercicios o más llevan dos sesiones bajo su rango. Una semana con menos de la mitad de las sesiones cuenta como descanso y reinicia el bloque. Se puede cambiar a mano en **Semana**.
- **Proyección de la próxima semana.** Usa tu historial para proponer: tipo de semana, subir o bajar peso (doble progresión), sumar o quitar series donde un músculo quedó fuera del rango de su prioridad (hasta 2 series por semana), sacar un bloque si llevas 2 semanas bajo el 70 % de lo planificado, el running de la semana (calidad del bloque, fondo, tope y salto de km), ajuste de calorías y tests pendientes. Cada ajuste trae su "por qué".
- **Progresión.** Funciona igual para cualquier ejercicio: sin historial ni peso inicial, te pide registrar libremente la primera vez. Un mismo ejercicio en dos sesiones comparte historial.
- **Protocolo de tobillo.** Si al crear el perfil marcas tobillo inestable, las sesiones de pierna incluyen sóleo, banda y equilibrio, que son obligatorios para cerrar la sesión, y cada carrera parte con 2 × 30 s de equilibrio por lado.

### Actualización desde la versión 1

Los datos de la versión anterior (cola de 8 sesiones) se migran solos al abrir la app: cada sesión de la cola pasa a ser 1 vez por semana, el historial se conserva completo, los ejercicios quedan en tu biblioteca y, si estabas en la vuelta de descarga, esa semana sigue siéndolo. La copia original queda guardada aparte hasta que uses **Borrar todo**.

## Cómo está armado

```
src/
├─ tipos/modelo.ts        Modelo de datos (versión 2)
├─ data/
│  ├─ catalogo.ts         Biblioteca de ejercicios y rutinas estándar
│  ├─ referencias.ts      Referencias con DOI verificado (Crossref) y hallazgo contrastado con el abstract
│  ├─ porques.ts          El "por qué" de cada recomendación, con etiqueta de evidencia
│  └─ reglas-tipo.ts      Reglas por tipo de ejercicio y prioridades por músculo
├─ almacen/               localStorage, migración v1 → v2, contexto de React, exportar/importar
├─ motor/                 Lógica pura y testeada, sin React
│  ├─ perfil.ts           Onboarding: Mifflin-St Jeor, FC máx de Tanaka, objetivos iniciales
│  ├─ planificacion.ts    Plan semanal, conteo por semana, carga/descarga, bloques (mesociclos)
│  ├─ sugerencia.ts       Estado de cada bloque y sugerencia del día según recuperación
│  ├─ proyeccion.ts       Proyección de la semana siguiente y acciones aplicables
│  ├─ rutina.ts           Edición del plan: sesiones, ejercicios, biblioteca propia
│  ├─ progresion.ts       Doble progresión genérica
│  ├─ running.ts          Zonas, ritmos desde el test, calidad, fondo, salto de carga
│  ├─ nutricion.ts        Macros, calibración semanal por objetivo, pisos, guía de ayuno
│  ├─ volumen.ts          Series por músculo (planificadas y hechas)
│  ├─ grasa.ts            Ecuación Navy (cm) y categorías ACE
│  ├─ alertas.ts          Tobillo, tope de km, salto de carga, protocolo y pérdida rápida
│  ├─ benchmarks.ts       Qué medir y cuándo
│  └─ semanas.ts          Semanas de lunes a domingo en hora local
├─ componentes/           PorQue, Stepper, Grafico (SVG propio) y piezas de UI
├─ pantallas/             Onboarding, Hoy, RegistroGym, Semana, Progreso, Nutrición, Ciencia, Ajustes, EditorRutina
└─ pruebas/fixtures.ts    Datos de prueba para los tests
```

## Referencias

Cada DOI de `src/data/referencias.ts` se verificó contra la API de Crossref y cada hallazgo se contrastó con el abstract (Europe PMC). El test `src/data/referencias.test.ts` exige que:

- toda referencia tenga DOI con formato válido (salvo el informe técnico Navy, que no tiene DOI);
- todo "por qué" cite referencias existentes;
- todo "por qué" sin referencias esté etiquetado como *Práctica común, evidencia limitada*;
- todo id de "por qué" usado en el código exista.

## Nota sobre OneDrive

El proyecto está dentro de OneDrive. Si notas lentitud por la sincronización de `node_modules`, puedes borrar esa carpeta cuando no estés trabajando (se regenera con `npm install`) o mover el proyecto fuera de OneDrive.
