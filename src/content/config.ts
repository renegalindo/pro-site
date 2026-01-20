import { defineCollection, z } from 'astro:content';

const work = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    company: z.string().optional(),
    role: z.string().optional(),
    year: z.string().optional(),
    featured: z.boolean().default(false),
    sideProject: z.boolean().default(false),
    order: z.number().default(0),
    color: z.string().optional(),
    logo: z.string().optional(),
  }),
});

export const collections = { work };
