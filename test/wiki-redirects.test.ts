import { describe, expect, it } from 'vitest'
import { cloudflareRedirectLines, redirectForWikiPath, wikiAliasRedirects, wikiCaseOnlyRedirects, wikiRedirects, wikiRouteRules } from '../config/wiki-redirects'

describe('wiki redirects', () => {
  it('maps the old web editor page and keeps case-only redirects out of route rules', () => {
    expect(wikiRedirects['/wiki/Web-Editor']).toBe('/wiki/features/web-editor')
    expect(wikiCaseOnlyRedirects['/wiki/FAQ']).toBe('/wiki/faq')
    expect(wikiCaseOnlyRedirects['/wiki/Configuration']).toBe('/wiki/configuration')

    const rules = wikiRouteRules()
    expect(rules['/wiki/FAQ']).toBeUndefined()
    expect(rules['/wiki/Configuration']).toBeUndefined()
    expect(rules['/wiki/Web-Editor']).toEqual({
      redirect: { to: '/wiki/features/web-editor', statusCode: 301 }
    })
  })

  it('redirects localized old wiki URLs, including case-only paths', () => {
    expect(redirectForWikiPath('/zh-CN/wiki/General-Commands', ['zh-CN'])).toBe('/zh-CN/wiki/commands/general')
    expect(redirectForWikiPath('/zh-CN/wiki/FAQ', ['zh-CN'])).toBe('/zh-CN/wiki/faq')
    expect(redirectForWikiPath('/wiki/Web-Editor', ['zh-CN'])).toBe('/wiki/features/web-editor')
    expect(redirectForWikiPath('/zh-CN/wiki/commands/general', ['zh-CN'])).toBeNull()
  })

  it('redirects Terms and Privacy in any case, including locale prefixes', () => {
    expect(wikiRedirects['/wiki/Terms-of-Service']).toBe('/wiki/terms-of-service')
    expect(wikiRedirects['/wiki/Privacy-Policy']).toBe('/wiki/privacy-policy')
    expect(wikiRouteRules()['/wiki/Terms-of-Service']).toBeUndefined()
    expect(wikiRouteRules()['/wiki/Privacy-Policy']).toBeUndefined()

    expect(redirectForWikiPath('/wiki/Terms-of-Service')).toBe('/wiki/terms-of-service')
    expect(redirectForWikiPath('/wiki/TERMS-OF-SERVICE')).toBe('/wiki/terms-of-service')
    expect(redirectForWikiPath('/wiki/TeRmS-oF-sErViCe')).toBe('/wiki/terms-of-service')
    expect(redirectForWikiPath('/wiki/terms-of-service')).toBeNull()
    expect(redirectForWikiPath('/de/wiki/Privacy-Policy', ['de'])).toBe('/de/wiki/privacy-policy')
    expect(redirectForWikiPath('/de/wiki/pRiVaCy-PoLiCy', ['de'])).toBe('/de/wiki/privacy-policy')
    expect(redirectForWikiPath('/de/wiki/privacy-policy', ['de'])).toBeNull()

    const lines = cloudflareRedirectLines(['de', 'zh-CN'])
    expect(lines).toContain('/wiki/Terms-of-Service  /wiki/terms-of-service  301')
    expect(lines).toContain('/wiki/Privacy-Policy  /wiki/privacy-policy  301')
    expect(lines).toContain('/de/wiki/Terms-of-Service  /de/wiki/terms-of-service  301')
    expect(lines).toContain('/zh-CN/wiki/PRIVACY-POLICY  /zh-CN/wiki/privacy-policy  301')
  })

  it('aliases the lowercase form of old Title-Case wiki URLs', () => {
    const aliases = wikiAliasRedirects()
    expect(aliases['/wiki/credits']).toBe('/wiki/about/credits')
    expect(aliases['/wiki/usage']).toBe('/wiki/getting-started')
    expect(aliases['/wiki/web-editor']).toBe('/wiki/features/web-editor')
    expect(aliases['/wiki/faq']).toBeUndefined()
    expect(aliases['/wiki/getting-started']).toBeUndefined()
    expect(aliases['/wiki/terms-of-service']).toBeUndefined()

    expect(redirectForWikiPath('/wiki/credits')).toBe('/wiki/about/credits')
    expect(redirectForWikiPath('/de/wiki/usage', ['de'])).toBe('/de/wiki/getting-started')
    expect(wikiRouteRules()['/wiki/credits']).toEqual({
      redirect: { to: '/wiki/about/credits', statusCode: 301 }
    })
    expect(cloudflareRedirectLines(['de'])).toContain('/wiki/credits  /wiki/about/credits  301')
  })
})
