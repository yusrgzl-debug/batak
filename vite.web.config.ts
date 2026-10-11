import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/** Single-file web build (all JS/CSS inlined) for sharing a playable browser demo. */
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'dist-web', emptyOutDir: true },
});
