import { join } from 'node:path'
import { wikiEditUrl, wikiFileUpdatedAt, wikiRelativeFromRoute } from '../../config/wiki-git'

export default defineEventHandler((event) => {
  const path = String(getQuery(event).path || '').replace(/\/+$/, '') || '/'
  const config = useRuntimeConfig()
  const wikiPath = String(config.wikiPath || '')
  const relative = wikiRelativeFromRoute(wikiPath, path)
  const branch = String(config.wikiBranch || 'v3-structure')
  const repo = String(config.wikiRepo || config.public.wikiRepo || '')
  const updatedAt = wikiPath
    ? wikiFileUpdatedAt(wikiPath, join(wikiPath, relative))
    : undefined

  return {
    updatedAt,
    editUrl: wikiEditUrl(relative, branch, repo || undefined)
  }
})
