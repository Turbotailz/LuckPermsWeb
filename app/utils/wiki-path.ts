export function stripTrailingSlash(path: string) {
  if (path === '/') {
    return '/'
  }
  return path.replace(/\/+$/, '') || '/'
}

export function wikiPagePathFromSlug(slug: string | string[] | undefined) {
  const parts = Array.isArray(slug) ? slug : slug ? [slug] : []
  const joined = parts.filter(Boolean).join('/')
  return stripTrailingSlash(joined ? `/wiki/${joined}` : '/wiki')
}
