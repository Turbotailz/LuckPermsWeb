import { join } from 'node:path'
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'
import { wikiContentRepository } from './config/wiki-source'

const wikiSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  updatedAt: z.string().optional()
})

const wikiPath = process.env.WIKI_PATH

const wikiSource = wikiPath
  ? {
      cwd: join(wikiPath, 'en'),
      include: '**' as const,
      prefix: '/wiki'
    }
  : {
      repository: wikiContentRepository(),
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
