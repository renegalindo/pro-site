import { defineCollection, z } from 'astro:content';

const work = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    // One-line summary used only as metadata — the page's `<meta description>`
    // and OpenGraph/Twitter description for link sharing. NOT shown on the page
    // (the write-up lives in the Markdown body). Optional.
    description: z.string().optional(),
    company: z.string().optional(),
    role: z.string().optional(),
    year: z.string().optional(),
    sideProject: z.boolean().default(false),
    order: z.number().default(0),
    logo: z.string().optional(),
    // Visibility switch. When true, the project's detail page at /work/<slug>
    // is generated and its card links there. When false (default), the page is
    // not built and the card links straight out to `externalUrl` (new tab), so
    // in-progress work can't be reached even by direct URL.
    published: z.boolean().default(false),
    // Where an unpublished card links to (the live product). Also shown as the
    // outbound link inside a published detail page.
    externalUrl: z.string().url().optional(),
  }),
});

const now = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      date: z.coerce.date(),
      location: z.string(),
      image: image().optional(),
      imageAlt: z.string().optional(),
    }),
});

export const collections = { work, now };
