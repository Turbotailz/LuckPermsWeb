const PRODUCTION_HOST = 'luckperms.net'

export const DEFAULT_WEB_REPO = 'https://github.com/Turbotailz/LuckPermsWeb'
export const DEFAULT_PLAUSIBLE_DOMAIN = 'luckperms.net'

export function parseBooleanFlag(value: string | undefined) {
  if (value == null) {
    return undefined
  }
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false
  }
  return undefined
}

export function siteHostname(siteUrl: string) {
  try {
    return new URL(siteUrl).hostname.toLowerCase()
  } catch {
    return ''
  }
}

/** Indexable only for luckperms.net, unless NUXT_PUBLIC_SITE_INDEXABLE / NUXT_SITE_INDEXABLE is set. */
export function resolveSiteIndexable(siteUrl: string, env: NodeJS.ProcessEnv = process.env) {
  const override = parseBooleanFlag(env.NUXT_PUBLIC_SITE_INDEXABLE ?? env.NUXT_SITE_INDEXABLE)
  if (override !== undefined) {
    return override
  }
  return siteHostname(siteUrl) === PRODUCTION_HOST
}

/**
 * Plausible site (`data-domain`). Production defaults to luckperms.net.
 * Other hosts omit the script unless NUXT_PUBLIC_PLAUSIBLE_DOMAIN is set
 * (beta should use its own site, e.g. beta.luckperms.net).
 */
export function resolvePlausibleDomain(siteUrl: string, env: NodeJS.ProcessEnv = process.env) {
  const configured = env.NUXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim()
  if (configured) {
    return configured
  }
  return siteHostname(siteUrl) === PRODUCTION_HOST ? DEFAULT_PLAUSIBLE_DOMAIN : ''
}

export function resolveWebRepo(env: NodeJS.ProcessEnv = process.env) {
  return (env.NUXT_PUBLIC_WEB_REPO || DEFAULT_WEB_REPO).replace(/\/+$/, '')
}

const SITE_NOINDEX = '/*\n  X-Robots-Tag: noindex, nofollow\n'

/**
 * Cloudflare Pages `_headers` block so static files carry noindex on non-production hosts.
 * A noindex tag on a narrower path (for example `/_nuxt/*`) does not cover HTML.
 */
export function withNoIndexHeader(existing: string) {
  if (/(^|\n)\/\*\r?\n[ \t]+X-Robots-Tag:\s*noindex/i.test(existing)) {
    return existing.endsWith('\n') ? existing : `${existing}\n`
  }
  const body = existing.replace(/\s+$/, '')
  return body ? `${body}\n\n${SITE_NOINDEX}` : SITE_NOINDEX
}
