/**
 * Cloudflare Pages allows 100 include + exclude rules in `_routes.json`.
 * Nitro's default lists every static file and then truncates the list, so
 * prerendered pages past the cutoff are sent to the worker.
 *
 * The worker cannot query wiki content: Nuxt Content switches Cloudflare
 * builds onto a D1 binding this project does not have, and the query comes
 * back empty ("Wiki home not found"). Prerendered HTML already contains the
 * English article and the localized UI, so those URLs must stay on static
 * files. Wildcards cover every locale without a rule per page.
 *
 * Dynamic editor, verbose, and tree sessions are not excluded, so the worker
 * still renders their client shells.
 *
 * Missing files under an exclude would otherwise be served as `index.html`
 * with status 200. `public/404.html` makes Pages return 404 for those URLs
 * (a real wiki page still matches its prerendered HTML first).
 */
export const CLOUDFLARE_ROUTES_LIMIT = 100

export interface CloudflarePagesRoutes {
  version: 1
  include: string[]
  exclude: string[]
}

const STATIC_ROOTS = [
  '/_nuxt/*',
  // nuxt-og-image adds `/_og/s/*` on Cloudflare. A broader `/_og/*` overlaps
  // that rule, and wrangler rejects the routes file (Pages deploy fails).
  '/_og/s/*',
  '/_payload.json',
  '/*/_payload.json',
  '/wiki-img/*',
  '/',
  '/download',
  '/sponsor',
  '/editor',
  '/verbose',
  '/treeview',
  '/wiki',
  '/wiki/*',
  '/*/wiki',
  '/*/wiki/*',
  '/*/download',
  '/*/sponsor',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/logo.png',
  '/logo.svg',
  '/twemoji-pirate-flag.png',
  '/robots.txt',
  '/llms.txt'
]

export function cloudflarePagesRoutes(localeCodes: Iterable<string>): CloudflarePagesRoutes {
  const locales = [...new Set(localeCodes)].filter(code => code && code !== 'en').sort()
  const include = ['/*']
  const exclude = [...STATIC_ROOTS]
  for (const code of locales) {
    exclude.push(`/${code}`, `/${code}/editor`)
  }

  let routes: CloudflarePagesRoutes = { version: 1, include, exclude }
  if (ruleCount(routes) <= CLOUDFLARE_ROUTES_LIMIT) {
    return routes
  }

  // Editor landings can be server-rendered. Wiki pages and locale homes cannot.
  const withoutEditorIndexes = exclude.filter(rule => !/^\/[^/]+\/editor$/.test(rule))
  routes = { version: 1, include, exclude: withoutEditorIndexes }
  if (ruleCount(routes) > CLOUDFLARE_ROUTES_LIMIT) {
    throw new Error(
      `Cloudflare Pages _routes.json would have ${ruleCount(routes)} rules (limit ${CLOUDFLARE_ROUTES_LIMIT}). ` +
      'Truncating per-file excludes is what 404s localized pages.'
    )
  }
  return routes
}

export function cloudflareRuleCount(routes: CloudflarePagesRoutes) {
  return ruleCount(routes)
}

function ruleCount(routes: CloudflarePagesRoutes) {
  return routes.include.length + routes.exclude.length
}

/** Cloudflare `*` matches any number of path segments, including slashes. */
export function cloudflarePatternMatches(pattern: string, path: string) {
  const body = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${body}$`).test(path)
}

export function cloudflareWorkerHandles(routes: CloudflarePagesRoutes, path: string) {
  const included = routes.include.some(pattern => cloudflarePatternMatches(pattern, path))
  if (!included) {
    return false
  }
  return !routes.exclude.some(pattern => cloudflarePatternMatches(pattern, path))
}

/**
 * Same overlap rule as wrangler, which checks include and exclude separately:
 * a splat route `/api/*` conflicts with any other rule in that list that
 * starts with `/api/`. Duplicate copies of one rule do not.
 */
export function cloudflareRoutesOverlap(rules: string[]) {
  const endingSplatRoutes = rules.filter(route => route.endsWith('/*'))
  for (const route of endingSplatRoutes) {
    const prefix = route.slice(0, -1)
    if (rules.some(other => other !== route && other.startsWith(prefix))) {
      return true
    }
  }
  return false
}
