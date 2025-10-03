import { defineCollection, z } from 'astro:content';

const ecosystem = defineCollection({
  type: 'data',
  schema: z.object({
    projects: z.array(
      z.object({
        name: z.string(),
        website: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        tag_ids: z.array(z.string()).optional(),
        logo_alt: z.string().optional(),
        logo_src: z.string().optional(),
        cover_image: z.string().optional(),
        quest_slug: z.string().optional(),
        twitter: z.string().optional(),
        discord: z.string().optional()
      })
    )
  })
});

export const collections = {
  ecosystem
};
