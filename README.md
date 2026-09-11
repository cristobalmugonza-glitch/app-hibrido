# Híbrido

App web personal de entrenamiento híbrido (fuerza + running). Funciona en el navegador del celular, se instala en la pantalla de inicio y funciona sin conexión. Sin cuentas, sin servidor: los datos viven en el teléfono (`localStorage`) y se respaldan exportando un JSON.

- **Hoy**: te dice cuál es tu próxima sesión. No usa días de la semana, sino una cola de 8 sesiones que avanza solo cuando completas o saltas una.
- **Registrar**: peso, molestias, medidas con estimación de grasa (Navy), test de 8 km, dominadas con lastre y sesiones no planificadas.
- **Progreso**: ratio hombros/cintura, ritmo Z2 a FC constante, peso, grasa estimada, km de la semana, carga por ejercicio y benchmarks.
- **Nutrición**: objetivos del día, guía de ayuno flexible según la hora de entreno y calibración semanal de calorías.
- **Más › Ciencia**: el "por qué" de cada recomendación, con referencias verificadas y filtros por nivel de evidencia.
- **Más › Ajustes**: perfil, rutina editable (sesiones, ejercicios, secuencia y prioridades por músculo), respaldo y reinicio.

## Requisitos

- Node.js 20 o más nuevo (probado con Node 24).

## Correr en tu computador

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (por ejemplo `http://localhost:5173`).

Otros comandos:

| Comando | Qué hace |
| --- | --- |
| `npm test` | Tests del motor (secuencia, progresión, running, nutrición, grasa, alertas, volumen y reglas anti-invención de las referencias) |
| `npm run typecheck` | Revisión de tipos de la app y de los tests |
| `npm run build` | Compila la versión de producción en `dist/` (incluye el service worker) |
| `npm run preview` | Sirve `dist/` para probar la versión compilada, incluido el modo sin conexión |
| `npm run iconos` | Regenera los íconos PNG en `public/` |

## Probar en el celular sin publicar

Con el celular en la misma red wifi, `npm run dev` también muestra una URL `Network` (por ejemplo `http://192.168.1.20:5173`) que puedes abrir en el celular. **Instalar la app y usarla sin conexión requiere HTTPS**, así que para eso tienes que publicarla (siguiente sección).

## Publicar (gratis)

### Opción A: Vercel (la más simple)

1. Sube esta carpeta a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com), crea un proyecto nuevo e importa el repositorio. Vercel detecta Vite solo: build `npm run build`, salida `dist`.
3. Queda en una URL `https://<nombre>.vercel.app`.

### Opción B: GitHub Pages

1. Sube esta carpeta a un repositorio de GitHub (rama `main`).
2. En el repositorio: **Settings › Pages › Source: GitHub Actions**.
3. Cada push a `main` corre `.github/workflows/deploy.yml`: revisa tipos, corre los tests, compila y publica en `https://<usuario>.github.io/<repositorio>/`.

La app usa rutas relativas (`base: './'`), así que funciona igual en la raíz de un dominio o dentro de una subcarpeta.

## Instalar en el celular

**iPhone (Safari):** abre la URL publicada › botón Compartir › **Agregar a pantalla de inicio**. La primera vez hay que abrirla con señal; después funciona sin conexión.

**Android (Chrome):** abre la URL › menú ⋮ › **Instalar app**.

## Respaldo de datos

Los datos quedan solo en ese navegador y ese teléfono. En **Más › Ajustes › Respaldo**:

- **Exportar JSON**: en iPhone abre la hoja de compartir (guárdalo en Archivos, iCloud o mándatelo). En otros navegadores se descarga.
- **Importar JSON**: reemplaza los datos actuales por los del respaldo (pide confirmación).

Exporta un respaldo de vez en cuando: si borras los datos de Safari o cambias de teléfono, es la única copia.

## Cómo está armado

```
src/
├─ tipos/modelo.ts        Modelo de datos (Perfil, Rutina, sesiones, medidas…)
├─ data/
│  ├─ referencias.ts      Referencias con DOI verificado (Crossref) y hallazgo contrastado con el abstract
│  ├─ porques.ts          El "por qué" de cada recomendación, con etiqueta de evidencia
│  ├─ reglas-tipo.ts      Reglas por tipo de ejercicio (rango, descanso, incremento, fallo)
│  └─ semilla.ts          Rutina y perfil iniciales (solo carga inicial, todo editable)
├─ almacen/               localStorage, contexto de React, exportar/importar
├─ motor/                 Lógica pura y testeada, sin React
│  ├─ secuencia.ts        Cola de sesiones, vueltas, ciclos, descarga
│  ├─ progresion.ts       Doble progresión genérica
│  ├─ running.ts          Zonas, ritmos desde el test, calidad, fondo, salto de carga
│  ├─ nutricion.ts        Macros, calibración semanal, pisos, guía de ayuno
│  ├─ grasa.ts            Ecuación Navy (cm) y categorías ACE
│  ├─ volumen.ts          Series por músculo con conteo fraccionado
│  ├─ alertas.ts          Alertas de tobillo, km, salto de carga, piernas y pérdida rápida
│  └─ benchmarks.ts       Qué test toca en el ciclo
├─ componentes/           PorQue, Stepper, Grafico (SVG propio) y piezas de UI
└─ pantallas/             Hoy, RegistroGym, Registrar, Progreso, Nutrición, Ciencia, Ajustes, EditorRutina
```

### Reglas que conviene saber

- **Vuelta y ciclo.** Una vuelta es una pasada completa por la secuencia (8 sesiones). Las vueltas 1 a 3 son de carga y la 4 es descarga (mitad de series, sin fallo, running al 60 %). 4 vueltas forman un ciclo.
- **Días reales vs. vueltas.** La estructura del entrenamiento se mide en vueltas. Lo fisiológico se mide en días reales, con ventanas móviles de 7 días: peso, calorías, molestias, km semanales y días sin piernas.
- **Progresión.** Funciona igual para cualquier ejercicio que agregues. Sin historial ni peso inicial, te pide registrar libremente la primera vez.
- **Protocolo de tobillo.** La sesión que lo contenga no se puede cerrar sin esos ejercicios. Además, cada carrera parte con 2 × 30 s de equilibrio por lado.

### Ajustes de series respecto de la rutina original

Con conteo fraccionado (1 serie al músculo principal y 0,5 a cada secundario) y rangos por prioridad (alta 12–20, media 8–14, mantención 4–8 por vuelta):

- **Hombro lateral** (prioridad alta, da el ancho): pasa a 4 series en Empuje y Calistenia, y se agregan 4 series en Tirón. Total 12, antes 6.
- **Deltoide posterior (pájaros)**: 3 → 4 series.
- **Pec deck** y los **aislados de bíceps y tríceps de Calistenia**: 3 → 2 series. Pecho, bíceps y tríceps ya reciben mucho trabajo indirecto; así quedan en 14.
- **Gemelos de pie**: 3 → 2 series, porque se sumó el sóleo (3) del protocolo de tobillo.
- Todo lo demás se mantiene en 3 series.

El detalle está en **Ajustes › Rutina y secuencia › Series por músculo**, y cambia en vivo si editas la rutina.

## Referencias

Cada DOI de `src/data/referencias.ts` se verificó contra la API de Crossref y cada hallazgo se contrastó con el abstract (Europe PMC) el 11/09/2026. El test `src/data/referencias.test.ts` exige que:

- toda referencia tenga DOI con formato válido (salvo el informe técnico Navy, que no tiene DOI);
- todo "por qué" cite referencias existentes;
- todo "por qué" sin referencias esté etiquetado como *Práctica común, evidencia limitada*;
- todo id de "por qué" usado en el código exista.

## Nota sobre OneDrive

El proyecto está dentro de OneDrive. La carpeta `node_modules` tiene cientos de paquetes que OneDrive intentará sincronizar. Si notas lentitud, puedes borrar `node_modules` cuando no estés trabajando (se regenera con `npm install`), o mover el proyecto fuera de OneDrive.
