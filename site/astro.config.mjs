import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  srcDir: 'src',
  server: {
    host: true,
    port: 4321
  },
  vite: {
    resolve: {
      alias: {
        '@components': '/src/components',
        '@layouts': '/src/layouts',
        '@lib': '/src/lib',
        '@quest': '/quest',
        '@quest-src': '/quest/src',
        '@data': '/src/data'
      }
    }
  }
});
