/** @type {import('tailwindcss').Config} */
export default {
  // relative: las rutas se resuelven desde este archivo, no desde la carpeta donde se lanzó el proceso.
  content: { relative: true, files: ['./index.html', './src/**/*.{ts,tsx}'] },
  theme: {
    colors: {
      transparent: 'transparent',
      fondo: 'var(--fondo)',
      superficie: 'var(--superficie)',
      texto: 'var(--texto)',
      texto2: 'var(--texto-2)',
      acento: 'var(--acento)',
      alerta: 'var(--alerta)',
      linea: 'var(--linea)',
      velo: 'rgba(0, 0, 0, 0.6)',
    },
    fontFamily: {
      num: ['"Barlow Condensed"', 'Inter', 'system-ui', 'sans-serif'],
      sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
    },
    extend: {},
  },
  plugins: [],
};
