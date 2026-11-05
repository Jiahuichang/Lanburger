import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves the game from /Lanburger/; the deploy workflow sets BASE_PATH. Local dev stays at /.
  base: process.env.BASE_PATH ?? '/',
  server: { port: 5173, host: true },
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
});
