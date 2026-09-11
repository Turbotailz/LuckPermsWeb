import { join } from 'node:path'
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'

const wikiSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  updatedAt: z.string().optional()
})

const wikiPath = process.env.WIKI_PATH
const wikiBranch = process.env.WIKI_BRANCH || 'v3-structure'

const wikiSource = wikiPath
  ? {
      cwd: join(wikiPath, 'en'),
      include: '**' as const,
      prefix: '/wiki'
    }
  : {
      repository: `https://github.com/LuckPerms/wiki/tree/${wikiBranch}`,
      include: 'en/**' as const,
      prefix: '/wiki'
    }

export default defineContentConfig({
  collections: {
    wiki_en: defineCollection({
      type: 'page',
      source: wikiSource,
      schema: wikiSchema
    })
  }
})
