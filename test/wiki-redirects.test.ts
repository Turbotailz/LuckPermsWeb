import { describe, expect, it } from 'vitest'
import { redirectForWikiPath, wikiCaseOnlyRedirects, wikiRedirects, wikiRouteRules } from '../config/wiki-redirects'

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
})
