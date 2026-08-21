import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeMedia from './src/lib/rehype-media.mjs';

export default defineConfig({
  site: 'https://renegalindo.com',
  // Bind the port Paseo assigns. Paseo's "service" scripts allocate a port per
  // worktree and hand it to the process as $PASEO_PORT, then proxy their
  // preview URL to it. Astro otherwise ignores that and binds its own default
  // 4321 — so Paseo proxies to the wrong port and the preview shows a 502.
  // Reading $PASEO_PORT makes the one-click Paseo server "just work" and also
  // sidesteps cross-worktree collisions on 4321. Falls back to 4321 when run
  // outside Paseo (plain `npm run dev`). strictPort fails loudly instead of
  // silently drifting to a port Paseo can't find.
  server: {
    host: true,
    port: Number(process.env.PASEO_PORT ?? process.env.PORT ?? 4321),
    strictPort: true,
  },
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
      rehypeMedia,
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
  },
  build: {
    format: 'directory'
  }
});
