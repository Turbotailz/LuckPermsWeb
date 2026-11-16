import { describe, expect, it } from 'vitest'
import {
  resolvePlausibleDomain,
  resolveSiteIndexable,
  resolveWebRepo,
  withNoIndexHeader
} from '../config/site-public'

describe('public site env', () => {
  it('indexes only luckperms.net unless the flag is set', () => {
    expect(resolveSiteIndexable('https://luckperms.net', {})).toBe(true)
    expect(resolveSiteIndexable('https://luckperms.net/', {})).toBe(true)
    expect(resolveSiteIndexable('https://beta.luckperms.net', {})).toBe(false)
    expect(resolveSiteIndexable('https://luckperms.tailz.dev', {})).toBe(false)
    expect(resolveSiteIndexable('https://abc.pages.dev', {})).toBe(false)
    expect(resolveSiteIndexable('https://beta.luckperms.net', { NUXT_PUBLIC_SITE_INDEXABLE: 'true' })).toBe(true)
    expect(resolveSiteIndexable('https://luckperms.net', { NUXT_SITE_INDEXABLE: 'false' })).toBe(false)
    expect(resolveSiteIndexable('https://beta.luckperms.net', { NUXT_PUBLIC_SITE_INDEXABLE: '0' })).toBe(false)
  })

  it('uses the production Plausible site only for luckperms.net', () => {
    expect(resolvePlausibleDomain('https://luckperms.net', {})).toBe('luckperms.net')
    expect(resolvePlausibleDomain('https://beta.luckperms.net', {})).toBe('')
    expect(resolvePlausibleDomain('https://preview.pages.dev', {})).toBe('')
    expect(resolvePlausibleDomain('https://beta.luckperms.net', { NUXT_PUBLIC_PLAUSIBLE_DOMAIN: 'beta.luckperms.net' })).toBe('beta.luckperms.net')
  })

  it('points commit links at the fork unless overridden', () => {
    expect(resolveWebRepo({})).toBe('https://github.com/Turbotailz/LuckPermsWeb')
    expect(resolveWebRepo({ NUXT_PUBLIC_WEB_REPO: 'https://github.com/LuckPerms/LuckPermsWeb/' })).toBe('https://github.com/LuckPerms/LuckPermsWeb')
  })

  it('adds a site-wide noindex header without duplicating one', () => {
    expect(withNoIndexHeader('')).toBe('/*\n  X-Robots-Tag: noindex, nofollow\n')
    expect(withNoIndexHeader('/assets/*\n  Cache-Control: public\n')).toContain('X-Robots-Tag: noindex, nofollow')
    const narrowed = '/_nuxt/*\n  X-Robots-Tag: noindex\n'
    const withCatchAll = withNoIndexHeader(narrowed)
    expect(withCatchAll).toContain(narrowed.trim())
    expect(withCatchAll).toContain('/*\n  X-Robots-Tag: noindex, nofollow\n')
    expect(withNoIndexHeader(withCatchAll)).toBe(withCatchAll)
  })
})
