#!/usr/bin/env node
/**
 * Fetch Crowdin web translations from metadata.luckperms.net at build time.
 * Writes locale JSON files + i18n/locales.meta.json for nuxt.config.
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const localesDir = join(root, 'i18n', 'locales')
const metaPath = join(root, 'i18n', 'locales.meta.json')

const API_URL = (process.env.NUXT_PUBLIC_API_URL || 'https://metadata.luckperms.net/').replace(/\/?$/, '/')
const USER_AGENT = 'LuckPermsWeb/3 (+https://luckperms.net)'

const RTL = new Set(['ar', 'fa', 'he', 'ur', 'yi', 'ckb', 'ps', 'dv'])

const ENGLISH = {
  code: 'en',
  language: 'en-GB',
  name: 'English',
  file: 'en.json',
  dir: 'ltr',
  flag: 'gb'
}

function localeDir(code) {
  const base = String(code).split(/[-_]/)[0]?.toLowerCase() || 'en'
  return RTL.has(base) ? 'rtl' : 'ltr'
}

function flagFor(code, localeTag) {
  if (code === 'en-PT' || localeTag === 'en_PT') {
    return 'pirate'
  }
  // Prefer region from Crowdin localeTag (e.g. fil_PH → ph, zh_CN → cn)
  const region = (localeTag.split('_')[1] || '').toLowerCase()
  if (region) {
    if (region === 'cs') {
      return 'rs' // Serbian (Latin) historical tag quirk from Vue 2
    }
    return region
  }
  return String(code).split(/[-_]/)[0]?.toLowerCase() || 'gb'
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT
    }
  })
  if (!response.ok) {
    throw new Error(`${url} → ${response.status} ${response.statusText}`)
  }
  return response.json()
}

async function main() {
  await mkdir(localesDir, { recursive: true })

  console.log(`[translations] Fetching language list from ${API_URL}data/translations`)
  const data = await fetchJson(`${API_URL}data/translations`)
  const languages = data.languages || {}

  const remote = Object.entries(languages)
    .filter(([, meta]) => meta?.progressWeb)
    .map(([code, meta]) => {
      const localeTag = meta.localeTag || code
      return {
        code,
        language: localeTag.replace(/_/g, '-'),
        name: meta.name || code,
        file: `${code}.json`,
        dir: localeDir(code),
        flag: flagFor(code, localeTag)
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const locales = [
    ENGLISH,
    ...remote.filter(locale => locale.code !== 'en')
  ]

  const results = await Promise.allSettled(
    remote.map(async (locale) => {
      const messages = await fetchJson(`${API_URL}translation/web/${locale.code}`)
      const path = join(localesDir, locale.file)
      await writeFile(path, `${JSON.stringify(messages, null, 2)}\n`, 'utf8')
      return locale.code
    })
  )

  const failed = []
  const ok = new Set(['en'])
  for (const [index, result] of results.entries()) {
    const code = remote[index].code
    if (result.status === 'fulfilled') {
      ok.add(code)
    } else {
      failed.push({ code, error: result.reason?.message || String(result.reason) })
    }
  }

  if (failed.length) {
    console.warn('[translations] Failed to fetch some locales:')
    for (const item of failed) {
      console.warn(`  - ${item.code}: ${item.error}`)
    }
  }

  // Keep previously downloaded files for failed locales if present
  const available = locales.filter((locale) => {
    if (ok.has(locale.code)) {
      return true
    }
    return existsSync(join(localesDir, locale.file))
  })

  if (!available.some(locale => locale.code === 'en')) {
    available.unshift(ENGLISH)
  }

  await writeFile(metaPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), locales: available }, null, 2)}\n`, 'utf8')
  console.log(`[translations] Wrote ${available.length} locales → ${metaPath}`)
}

main().catch(async (error) => {
  console.error('[translations] Fetch failed:', error.message || error)
  // Ensure meta exists so nuxt.config can still boot with English only
  if (!existsSync(metaPath)) {
    await mkdir(localesDir, { recursive: true })
    await writeFile(metaPath, `${JSON.stringify({ generatedAt: null, locales: [ENGLISH] }, null, 2)}\n`, 'utf8')
    console.warn('[translations] Wrote English-only fallback meta')
  } else {
    try {
      const existing = JSON.parse(await readFile(metaPath, 'utf8'))
      console.warn(`[translations] Keeping existing meta (${existing.locales?.length || 0} locales)`)
    } catch {
      // ignore
    }
  }
  // Non-zero only when nothing usable exists
  if (!existsSync(join(localesDir, 'en.json'))) {
    process.exit(1)
  }
})
