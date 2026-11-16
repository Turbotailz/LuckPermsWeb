import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'
import { resolveWikiGitDir } from './config/wiki-clone'
import { wikiContentRepository } from './config/wiki-source'

const wikiSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  updatedAt: z.string().optional(),
  editUrl: z.string().optional(),
  contributors: z.array(z.object({
    name: z.string(),
    username: z.string().optional(),
    avatar: z.string().optional()
  })).optional()
})

const wikiGitDir = resolveWikiGitDir()
const wikiEn = wikiGitDir ? join(wikiGitDir, 'en') : ''
const legalDir = join(process.cwd(), 'content/wiki-legal')
// Until Turbotailz/wiki `v3-structure` contains these pages, ship the vendored
// copies. Once the clone has them, the wiki files win and this fallback is idle.
const wikiHasLegal = Boolean(
  wikiEn
  && existsSync(join(wikiEn, 'terms-of-service.md'))
  && existsSync(join(wikiEn, 'privacy-policy.md'))
)

const wikiSource = wikiEn && existsSync(wikiEn)
  ? {
      cwd: wikiEn,
      include: '**' as const,
      prefix: '/wiki'
    }
  : {
      repository: wikiContentRepository(),
      include: 'en/**' as const,
      prefix: '/wiki'
    }

const sources = [
  wikiSource,
  ...(!wikiHasLegal && existsSync(legalDir)
    ? [{
        cwd: legalDir,
        include: '*.md' as const,
        prefix: '/wiki'
      }]
    : [])
]

export default defineContentConfig({
  collections: {
    wiki_en: defineCollection({
      type: 'page',
      source: sources,
      schema: wikiSchema
    })
  }
})
