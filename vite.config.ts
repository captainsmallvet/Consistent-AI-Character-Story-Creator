
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // We avoid stringifying the key directly to allow dynamic updates at runtime via window.process.env
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          /* Fixed: replaced process.cwd() with '.' to avoid TypeScript error on 'process' object in some environments */
          '@': path.resolve('.'),
        }
      }
    };
});
