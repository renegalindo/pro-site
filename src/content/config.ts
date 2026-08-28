import { defineCollection, z } from 'astro:content';

const work = defineCollection({
  type: 'content',
  schema: z.object({
    // The project/company name shown as the card label and page heading.
    // Named `name` (not `title`) to avoid confusion with `role`, the job title.
    name: z.string(),
    // One-line summary used only as metadata — the page's `<meta description>`
    // and OpenGraph/Twitter description for link sharing. NOT shown on the page
    // (the write-up lives in the Markdown body). Optional.
    description: z.string().optional(),
    company: z.string().optional(),
    role: z.string().optional(),
    year: z.string().optional(),
    // What the work was, which drives the Work page's grouping (Clients first,
    // then Companies, then Personal). Required, so every project declares it:
    //   client   — fractional / Design Partner work for a client (my current mode)
    //   company  — an employed/founding role at a company; also notable products
    //              from a role, like Movo
    //   personal — my own side projects
    // Within each group, cards are ordered newest-first (by `year`).
    type: z.enum(['client', 'company', 'personal']),
    // Tiebreaker for two entries that share a year within a group (e.g. two 2026
    // client projects); lower sorts first. Recency (from `year`) does the real
    // ordering, so most projects can omit this.
    order: z.number().default(0),
    logo: z.string().optional(),
    // Visibility switch. When true, /work/<slug> is a public page and its card
    // links to it. When false (default), the page is gated behind preview mode
    // (noindex + redirect for a normal visitor) and the card links straight out
    // to `externalUrl` instead, so in-progress drafts stay hidden.
    published: z.boolean().default(false),
    // The live product URL. A draft card links here (new tab); also shown as the
    // outbound link inside a detail page. When set, the detail page renders a CTA
    // button on the meta line under the write-up (its presence is derived from
    // this URL — there's no separate opt-in flag).
    externalUrl: z.string().url().optional(),
    // Overrides the CTA's label (default `Go to website`). Set when the outbound
    // destination isn't the product itself — e.g. a LinkedIn or video link.
    ctaLabel: z.string().optional(),
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
