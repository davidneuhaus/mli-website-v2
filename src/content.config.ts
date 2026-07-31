import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const storySchema = z.object({
  title: z.string(),
  description: z.string().optional().default(""),
  path: z.string(),
  lang: z.enum(["de", "en"]).default("de"),
});

const stories = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/stories" }),
  schema: storySchema,
});

const keynotes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/keynotes" }),
  schema: storySchema,
});

export const collections = { stories, keynotes };
