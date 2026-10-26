import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { cloudflarePagesRoutes, cloudflareRoutesOverlap, cloudflareRuleCount, cloudflareWorkerHandles, CLOUDFLARE_ROUTES_LIMIT } from '../config/cloudflare-pages'
import { loadLocalesMeta, sitePrerenderRoutes } from '../config/i18n-locales'
import { cloudflareRedirectLines, CLOUDFLARE_REDIRECT_LIMIT, mergeRedirectFile } from '../config/wiki-redirects'
import { wikiCollectionsForLocale } from '../config/wiki-collections'
import { editorHomePath, editorPathSuffix, editorSectionFromPath, setEditorRouteLocale } from '../app/utils/editor-routes'
import { isEditorPath, isToolRoute, isWikiPath, splitLocalePrefix } from '../app/utils/tool-routes'

const meta = JSON.parse(readFileSync(new URL('../i18n/locales.meta.json', import.meta.url), 'utf8')) as {
  locales: { code: string }[]
}
const localeCodes = meta.locales.map(locale => locale.code)

describe('localized routes', () => {
  it('prerenders the editor landing page for every non-default locale', () => {
    const routes = sitePrerenderRoutes([
      { code: 'en', language: 'en-GB', name: 'English', file: 'en.json', dir: 'ltr', flag: 'gb' },
      { code: 'de', language: 'de-DE', name: 'German', file: 'de.json', dir: 'ltr', flag: 'de' },
      { code: 'zh-CN', language: 'zh-CN', name: 'Chinese', file: 'zh-CN.json', dir: 'ltr', flag: 'cn' },
      { code: 'fil', language: 'fil-PH', name: 'Filipino', file: 'fil.json', dir: 'ltr', flag: 'ph' }
    ], false)

    expect(routes).toContain('/editor')
    expect(routes).toContain('/de/editor')
    expect(routes).toContain('/zh-CN/editor')
    expect(routes).toContain('/fil/editor')
    expect(routes).toContain('/de/wiki')
    expect(routes).not.toContain('/en/editor')
  })

  it('serves prerendered locale pages as static files and tool sessions from the worker', () => {
    const routes = cloudflarePagesRoutes(localeCodes)
    // nuxt-og-image pushes this same exclude while configuring the Cloudflare preset.
    const published = {
      ...routes,
      exclude: [...routes.exclude, '/_og/s/*']
    }
    expect(cloudflareRuleCount(published)).toBeLessThanOrEqual(CLOUDFLARE_ROUTES_LIMIT)
    expect(cloudflareRoutesOverlap(published.include)).toBe(false)
    expect(cloudflareRoutesOverlap(published.exclude)).toBe(false)
    expect(routes.exclude).toContain('/_og/s/*')
    expect(routes.exclude).not.toContain('/_og/*')
    expect(routes.exclude).toContain('/de/editor')
    expect(routes.exclude).toContain('/zh-CN')

    expect(cloudflareWorkerHandles(routes, '/de/wiki')).toBe(false)
    expect(cloudflareWorkerHandles(routes, '/de/wiki/install')).toBe(false)
    expect(cloudflareWorkerHandles(routes, '/zh-CN/wiki')).toBe(false)
    expect(cloudflareWorkerHandles(routes, '/fil/wiki/install')).toBe(false)
    expect(cloudflareWorkerHandles(routes, '/ar/download')).toBe(false)
    expect(cloudflareWorkerHandles(routes, '/de/editor')).toBe(false)
    expect(cloudflareWorkerHandles(routes, '/wiki/faq')).toBe(false)
    expect(cloudflareWorkerHandles(routes, '/wiki/not-a-real-page')).toBe(false)

    expect(cloudflareWorkerHandles(routes, '/de/editor/abc123')).toBe(true)
    expect(cloudflareWorkerHandles(routes, '/de/editor/abc123/groups')).toBe(true)
    expect(cloudflareWorkerHandles(routes, '/fr/verbose')).toBe(true)
    expect(cloudflareWorkerHandles(routes, '/fil/verbose/demo')).toBe(true)
    expect(cloudflareWorkerHandles(routes, '/zh-CN/treeview/abc')).toBe(true)
    expect(cloudflareWorkerHandles(routes, '/editor/abc123')).toBe(true)
    expect(cloudflareWorkerHandles(routes, '/ar/editor/session')).toBe(true)
  })

  it('ships a static 404 page so missing excluded files are not the homepage', () => {
    const html = readFileSync(new URL('../public/404.html', import.meta.url), 'utf8')
    expect(html).toContain('Page not found')
  })

  it('keeps localized old wiki URLs in the Pages redirect file', () => {
    const lines = cloudflareRedirectLines(localeCodes)
    expect(lines).toContain('/wiki/FAQ  /wiki/faq  301')
    expect(lines).toContain('/de/wiki/FAQ  /de/wiki/faq  301')
    expect(lines).toContain('/zh-CN/wiki/Web-Editor  /zh-CN/wiki/features/web-editor  301')
    expect(lines.some(line => line.startsWith('/wiki/Web-Editor'))).toBe(false)

    const merged = mergeRedirectFile('/wiki/Web-Editor  /wiki/features/web-editor  301\n/*  /404.html  404\n', lines)
    expect(merged).toContain('/wiki/Web-Editor  /wiki/features/web-editor  301')
    expect(merged).not.toContain('/404.html')
    expect(merged.trim().split('\n').length).toBeLessThanOrEqual(CLOUDFLARE_REDIRECT_LIMIT)
  })

  it('falls back to the English wiki collection when a locale has no articles', () => {
    expect(wikiCollectionsForLocale('en')).toEqual(['wiki_en'])
    expect(wikiCollectionsForLocale('de')).toEqual(['wiki_en'])
    expect(wikiCollectionsForLocale('zh-CN')).toEqual(['wiki_en'])
    expect(wikiCollectionsForLocale('de', ['wiki_en', 'wiki_de'])).toEqual(['wiki_de', 'wiki_en'])
    expect(wikiCollectionsForLocale('zh-CN', ['wiki_en', 'wiki_zh_CN'])).toEqual(['wiki_zh_CN', 'wiki_en'])
  })

  it('recognizes locale-prefixed tool and wiki paths, including fil and zh-CN', () => {
    expect(splitLocalePrefix('/de/editor/abc')).toEqual({ locale: 'de', path: '/editor/abc' })
    expect(splitLocalePrefix('/zh-CN/wiki/install')).toEqual({ locale: 'zh-CN', path: '/wiki/install' })
    expect(splitLocalePrefix('/fil/verbose/demo')).toEqual({ locale: 'fil', path: '/verbose/demo' })
    expect(splitLocalePrefix('/editor/abc')).toEqual({ locale: null, path: '/editor/abc' })
    expect(isToolRoute('/ar/treeview')).toBe(true)
    expect(isEditorPath('/de/editor/abc/groups')).toBe(true)
    expect(isWikiPath('/fr/wiki')).toBe(true)
    expect(isWikiPath('/download')).toBe(false)
    expect(editorSectionFromPath('/de/editor/abc/groups/default')).toBe('groups')
    expect(editorPathSuffix('/zh-CN/editor/abc/users/notch')).toBe('/users/notch')

    setEditorRouteLocale(() => 'de')
    expect(editorHomePath('abc123')).toBe('/de/editor/abc123')
    setEditorRouteLocale(() => null)
    expect(editorHomePath('abc123')).toBe('/editor/abc123')
  })

  it('loads locale metadata that includes the locales used on the public site', () => {
    const codes = loadLocalesMeta().map(locale => locale.code)
    expect(codes).toContain('en')
  })
})
