import { fileURLToPath } from 'node:url';

// Ruta explícita: Tailwind buscaría su config en la carpeta desde donde se lanzó el proceso.
export default {
  plugins: {
    tailwindcss: { config: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)) },
    autoprefixer: {},
  },
};
