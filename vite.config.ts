import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // During `vite dev`, forward /api/* to the local Vercel dev server
    // (run `vercel dev` on 3000) so the serverless function is exercised.
    // With `vercel dev` alone this proxy is unused.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
