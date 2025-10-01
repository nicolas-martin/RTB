import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://kaijuswap.com',
  base: '/june',
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
        '@quest-src': '/src/lib/quest',
        '@data': '/src/data'
      }
    }
  }
});
