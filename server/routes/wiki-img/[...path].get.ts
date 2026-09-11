import { createReadStream, existsSync } from 'node:fs'
import { resolve } from 'node:path'

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

  const branch = config.wikiBranch || 'v3-structure'
  return sendRedirect(event, `https://raw.githubusercontent.com/LuckPerms/wiki/${branch}/img/${safe}`, 302)
})
