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
