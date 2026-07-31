import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  site: 'https://renegalindo.com',
  // Hide the floating Astro dev toolbar — it overlaps the deck's bottom controls
  // while previewing. Dev-only anyway; it never ships to the production build.
  devToolbar: { enabled: false },
  // Warm destination HTML on hover intent so client-router navigations (e.g.
  // opening/closing the portfolio drawer) start their transition instantly
  // instead of waiting on a cold fetch.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
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
