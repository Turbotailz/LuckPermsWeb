import { createReadStream, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { wikiRawUrl } from '../../../config/wiki-source'

export default defineEventHandler(async (event) => {
  const pathParam = getRouterParam(event, 'path') || getRouterParam(event, '_') || ''
  const relative = Array.isArray(pathParam) ? pathParam.join('/') : String(pathParam)
  const safe = relative.replace(/\.\./g, '')
  const config = useRuntimeConfig()

  if (config.wikiPath) {
    const file = resolve(config.wikiPath, 'img', safe)
    if (existsSync(file)) {
      return sendStream(event, createReadStream(file))
    }
  }

  const branch = String(config.wikiBranch || 'v3-structure')
  const repo = String(config.wikiRepo || '')
  return sendRedirect(event, wikiRawUrl(`img/${safe}`, repo || undefined, branch), 302)
})
