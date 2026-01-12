import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://renegalindo.com',
  integrations: [tailwind()],
  build: {
    format: 'directory'
  }
});
