import localesMeta from '../../i18n/locales.meta.json'

const LOCALE_CODES = new Set(
  (localesMeta.locales || [])
    .map(locale => locale.code)
    .filter(code => code && code !== 'en')
)

const TOOL_PREFIXES = ['/editor', '/verbose', '/treeview']

export function splitLocalePrefix(path: string) {
  const normalized = (path.split('?')[0]?.split('#')[0] || '/').replace(/\/+$/, '') || '/'
  const parts = normalized.split('/')
  const code = parts[1]
  if (!code || !LOCALE_CODES.has(code)) {
    return { locale: null as string | null, path: normalized }
  }
  const rest = `/${parts.slice(2).join('/')}`.replace(/\/+$/, '') || '/'
  return { locale: code, path: rest }
}

export function stripLocalePrefix(path: string) {
  return splitLocalePrefix(path).path
}

export function withLocalePrefix(path: string, locale: string | null | undefined) {
  const bare = path.startsWith('/') ? path : `/${path}`
  if (!locale || locale === 'en') {
    return bare
  }
  return bare === '/' ? `/${locale}` : `/${locale}${bare}`
}

export function isToolRoute(path: string) {
  const bare = stripLocalePrefix(path)
  return TOOL_PREFIXES.some(prefix => bare === prefix || bare.startsWith(`${prefix}/`))
}

export function isEditorPath(path: string) {
  const bare = stripLocalePrefix(path)
  return bare === '/editor' || bare.startsWith('/editor/')
}

export function isWikiPath(path: string) {
  const bare = stripLocalePrefix(path)
  return bare === '/wiki' || bare.startsWith('/wiki/')
}

export function toolHasSession(path: string) {
  const bare = stripLocalePrefix(path)
  return TOOL_PREFIXES.some(prefix => bare.startsWith(`${prefix}/`) && bare.length > prefix.length + 1)
}
