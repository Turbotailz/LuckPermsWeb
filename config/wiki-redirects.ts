export const wikiRedirects: Record<string, string> = {
  '/wiki/Home': '/wiki',
  '/wiki/Installation': '/wiki/install',
  '/wiki/Network-Installation': '/wiki/install/network',
  '/wiki/Hytale': '/wiki/install/hytale',
  '/wiki/Usage': '/wiki/getting-started',
  '/wiki/Storage-types': '/wiki/storage',
  '/wiki/Configuration': '/wiki/configuration',
  '/wiki/FAQ': '/wiki/faq',
  '/wiki/Command-Usage': '/wiki/commands',
  '/wiki/General-Commands': '/wiki/commands/general',
  '/wiki/User-Commands': '/wiki/commands/user',
  '/wiki/Group-Commands': '/wiki/commands/group',
  '/wiki/Permission-Commands': '/wiki/commands/permission',
  '/wiki/Parent-Commands': '/wiki/commands/parent',
  '/wiki/Meta-Commands': '/wiki/commands/meta',
  '/wiki/Track-Commands': '/wiki/commands/track',
  '/wiki/Log-Commands': '/wiki/commands/log',
  '/wiki/Permissions': '/wiki/commands/permissions',
  '/wiki/Web-Editor': '/wiki/features/web-editor',
  '/wiki/Web-Editor-Technical-Details': '/wiki/features/web-editor/technical',
  '/wiki/Context': '/wiki/features/context',
  '/wiki/Weight': '/wiki/features/weight',
  '/wiki/Prefixes,-Suffixes-&-Meta': '/wiki/features/prefixes-suffixes-meta',
  '/wiki/Verbose': '/wiki/features/verbose',
  '/wiki/Tracks': '/wiki/features/tracks',
  '/wiki/Default-Groups': '/wiki/features/default-groups',
  '/wiki/Syncing-data-between-servers': '/wiki/guides/syncing',
  '/wiki/Storage-system-errors': '/wiki/guides/storage-errors',
  '/wiki/Migration': '/wiki/guides/migration',
  '/wiki/Switching-storage-types': '/wiki/guides/switching-storage',
  '/wiki/Bulk-Editing': '/wiki/guides/bulk-editing',
  '/wiki/Prefix-&-Suffix-Stacking': '/wiki/guides/prefix-stacking',
  '/wiki/Extensions': '/wiki/guides/extensions',
  '/wiki/Argument-based-command-permissions': '/wiki/guides/argument-permissions',
  '/wiki/Developer-API': '/wiki/developers/api',
  '/wiki/Developer-API-Usage': '/wiki/developers/api-usage',
  '/wiki/Standalone-and-REST-API': '/wiki/developers/standalone-rest',
  '/wiki/Contributing': '/wiki/developers/contributing',
  '/wiki/Upgrading-from-v4-to-v5': '/wiki/reference/upgrade-v4-v5',
  '/wiki/Migrating-from-GroupManager-or-PermissionsEx': '/wiki/reference/migrating-gm-pex',
  '/wiki/Advanced-Setup': '/wiki/reference/permission-calculation',
  '/wiki/Self-hosting-the-web-interfaces': '/wiki/reference/self-hosting',
  '/wiki/Why-LuckPerms': '/wiki/about/why-luckperms',
  '/wiki/Credits': '/wiki/about/credits',
  '/wiki/Locale-and-Translations': '/wiki/about/locale',
  '/wiki/Placeholders': '/wiki/about/placeholders',
  '/wiki/External-connections': '/wiki/about/external-connections'
}

function isCaseOnlyRedirect(from: string, to: string) {
  return from !== to && from.toLowerCase() === to.toLowerCase()
}

/** Old GitHub wiki URLs that differ from the new path only by case. */
export const wikiCaseOnlyRedirects = Object.fromEntries(
  Object.entries(wikiRedirects).filter(([from, to]) => isCaseOnlyRedirect(from, to))
) as Record<string, string>

const DEFAULT_LOCALE = 'en'

/** Old wiki URL, including a non-default locale prefix, mapped to the new path. */
export function redirectForWikiPath(pathname: string, localeCodes: Iterable<string> = []) {
  const codes = new Set(localeCodes)
  codes.delete(DEFAULT_LOCALE)
  const path = pathname.replace(/\/+$/, '') || '/'
  const parts = path.split('/')
  let prefix = ''
  let wikiPath = path
  if (parts.length > 2 && parts[1] && codes.has(parts[1]) && parts[2] === 'wiki') {
    prefix = `/${parts[1]}`
    wikiPath = `/${parts.slice(2).join('/')}`
  }
  const to = wikiRedirects[wikiPath]
  if (!to || to === wikiPath) {
    return null
  }
  return `${prefix}${to}`
}

/** Case-sensitive `_redirects` lines. Route rules cannot express the case-only pairs. */
export function cloudflareRedirectLines(localeCodes: Iterable<string>) {
  const codes = [...new Set(localeCodes)].filter(code => code && code !== 'en')
  const lines: string[] = []
  for (const [from, to] of Object.entries(wikiRedirects)) {
    if (isCaseOnlyRedirect(from, to)) {
      lines.push(`${from}  ${to}  301`)
    }
    for (const code of codes) {
      lines.push(`/${code}${from}  /${code}${to}  301`)
    }
  }
  return lines
}

export const CLOUDFLARE_REDIRECT_LIMIT = 2000

export function mergeRedirectFile(existing: string, extra: string[]) {
  const seen = new Set<string>()
  const lines: string[] = []
  for (const raw of `${existing}\n${extra.join('\n')}`.split('\n')) {
    const line = raw.trim()
    if (!line || seen.has(line)) {
      continue
    }
    // Nitro adds `/* /404.html 404` when that file exists. Pages only accepts
    // 200 and 3xx in `_redirects`; a root `404.html` is what actually 404s
    // missing static files (without it, Pages serves index.html with 200).
    const status = line.split(/\s+/).at(-1)
    if (status === '404') {
      continue
    }
    seen.add(line)
    lines.push(line)
  }
  const redirects = lines.filter(line => !line.startsWith('#'))
  if (redirects.length > CLOUDFLARE_REDIRECT_LIMIT) {
    throw new Error(
      `Cloudflare Pages _redirects would have ${redirects.length} rules (limit ${CLOUDFLARE_REDIRECT_LIMIT}).`
    )
  }
  return `${lines.join('\n')}\n`
}

export function wikiRouteRules() {
  // Vue Router matches routeRules case-insensitively, so `/wiki/FAQ` → `/wiki/faq`
  // would loop forever and blank the FAQ / Configuration pages.
  return Object.fromEntries(
    Object.entries(wikiRedirects)
      .filter(([from, to]) => !isCaseOnlyRedirect(from, to))
      .map(([from, to]) => [
        from,
        { redirect: { to, statusCode: 301 as const } }
      ])
  )
}
