import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize bundle size
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false
  },
  // Define env variable prefix for security — only VITE_ prefixed vars are exposed
  envPrefix: 'VITE_'
});
