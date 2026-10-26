import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export interface I18nLocaleMeta {
  code: string
  language: string
  name: string
  file: string
  dir: 'ltr' | 'rtl'
  flag: string
}

interface LocalesMetaFile {
  generatedAt: string | null
  locales: I18nLocaleMeta[]
}

const ENGLISH: I18nLocaleMeta = {
  code: 'en',
  language: 'en-GB',
  name: 'English',
  file: 'en.json',
  dir: 'ltr',
  flag: 'gb'
}

export function loadLocalesMeta(rootDir = process.cwd()): I18nLocaleMeta[] {
  const metaPath = resolve(rootDir, 'i18n/locales.meta.json')
  if (!existsSync(metaPath)) {
    return [ENGLISH]
  }

  try {
    const data = JSON.parse(readFileSync(metaPath, 'utf8')) as LocalesMetaFile
    const locales = Array.isArray(data.locales) ? data.locales : []
    const withEnglish = locales.some(locale => locale.code === 'en')
      ? locales
      : [ENGLISH, ...locales]

    return withEnglish.filter((locale) => {
      if (locale.code === 'en') {
        return true
      }
      return existsSync(resolve(rootDir, 'i18n/locales', locale.file))
    })
  } catch {
    return [ENGLISH]
  }
}

export function localizedPrerenderRoutes(
  locales: I18nLocaleMeta[],
  paths: string[],
  defaultLocale = 'en'
) {
  const routes = new Set<string>()
  for (const path of paths) {
    routes.add(path)
    for (const locale of locales) {
      if (locale.code === defaultLocale) {
        continue
      }
      routes.add(path === '/' ? `/${locale.code}` : `/${locale.code}${path}`)
    }
  }
  return [...routes]
}

/** Paths prerendered for every locale, including the editor landing page. */
export function sitePrerenderPaths(selfHosted: boolean) {
  return selfHosted
    ? ['/', '/editor']
    : ['/', '/download', '/sponsor', '/wiki', '/editor']
}

export function sitePrerenderRoutes(locales: I18nLocaleMeta[], selfHosted: boolean) {
  return [
    ...localizedPrerenderRoutes(locales, sitePrerenderPaths(selfHosted)),
    '/verbose',
    '/treeview'
  ]
}

/**
 * Locale-prefixed copies of route rules. `/editor/**` does not match `/de/editor/**`,
 * so each prefix needs its own rule or Cloudflare renders those URLs as 404s.
 */
export function localizedRouteRules(locales: I18nLocaleMeta[], selfHosted: boolean) {
  const rules: Record<string, { prerender?: boolean, ssr?: boolean }> = {}
  for (const locale of locales) {
    if (locale.code === 'en') {
      continue
    }
    const prefix = `/${locale.code}`
    rules[`${prefix}/editor`] = { prerender: true, ssr: true }
    rules[`${prefix}/editor/**`] = { ssr: false }
    rules[`${prefix}/verbose`] = { ssr: false }
    rules[`${prefix}/verbose/**`] = { ssr: false }
    rules[`${prefix}/treeview`] = { ssr: false }
    rules[`${prefix}/treeview/**`] = { ssr: false }
    if (!selfHosted) {
      rules[prefix] = { prerender: true }
      rules[`${prefix}/download`] = { prerender: true }
      rules[`${prefix}/sponsor`] = { prerender: true }
      rules[`${prefix}/wiki`] = { prerender: true }
      rules[`${prefix}/wiki/**`] = { prerender: true }
    }
  }
  return rules
}
