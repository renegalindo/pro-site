import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  site: 'https://renegalindo.com',
  integrations: [tailwind()],
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
  },
  build: {
    format: 'directory'
  }
});
