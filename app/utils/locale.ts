import type { Locale, Messages } from '@nuxt/ui'
import enGb from '@nuxt/ui/runtime/locale/en_gb.js'
import { localeDir } from '~/utils/rtl'

/** Map LuckPerms / Crowdin locale codes onto @nuxt/ui locale files. */
const UI_LOCALE_ALIASES: Record<string, string> = {
  en: 'en_gb',
  'en-PT': 'en_gb',
  'es-ES': 'es',
  'pt-BR': 'pt_br',
  'zh-CN': 'zh_cn',
  'zh-TW': 'zh_tw',
  fa: 'fa_ir',
  no: 'nb_no',
  'sv-SE': 'sv',
  fil: 'en',
  'sr-CS': 'en'
}

const UI_LOCALE_FILES = new Set([
  'ar',
  'az',
  'be',
  'bg',
  'bn',
  'ca',
  'ckb',
  'cs',
  'da',
  'de',
  'de_at',
  'de_ch',
  'el',
  'en',
  'en_gb',
  'es',
  'et',
  'eu',
  'fa_ir',
  'fi',
  'fr',
  'gl',
  'he',
  'hi',
  'hr',
  'hu',
  'hy',
  'id',
  'is',
  'it',
  'ja',
  'ka',
  'kk',
  'km',
  'ko',
  'ky',
  'lb',
  'lo',
  'lt',
  'lv',
  'mn',
  'ms',
  'nb_no',
  'nl',
  'pl',
  'pt',
  'pt_br',
  'ro',
  'ru',
  'sk',
  'sl',
  'sq',
  'sv',
  'tg',
  'th',
  'tr',
  'ug_cn',
  'uk',
  'ur',
  'uz',
  'vi',
  'zh_cn',
  'zh_tw',
])

/**
 * Locale messages are loaded one language at a time. The `@nuxt/ui/locale`
 * barrel inlines every language into the shared entry chunk.
 */
const loaders: Record<string, () => Promise<{ default: Locale<Messages> }>> = {
  ar: () => import('@nuxt/ui/runtime/locale/ar.js'),
  az: () => import('@nuxt/ui/runtime/locale/az.js'),
  be: () => import('@nuxt/ui/runtime/locale/be.js'),
  bg: () => import('@nuxt/ui/runtime/locale/bg.js'),
  bn: () => import('@nuxt/ui/runtime/locale/bn.js'),
  ca: () => import('@nuxt/ui/runtime/locale/ca.js'),
  ckb: () => import('@nuxt/ui/runtime/locale/ckb.js'),
  cs: () => import('@nuxt/ui/runtime/locale/cs.js'),
  da: () => import('@nuxt/ui/runtime/locale/da.js'),
  de: () => import('@nuxt/ui/runtime/locale/de.js'),
  de_at: () => import('@nuxt/ui/runtime/locale/de_at.js'),
  de_ch: () => import('@nuxt/ui/runtime/locale/de_ch.js'),
  el: () => import('@nuxt/ui/runtime/locale/el.js'),
  en: () => import('@nuxt/ui/runtime/locale/en.js'),
  es: () => import('@nuxt/ui/runtime/locale/es.js'),
  et: () => import('@nuxt/ui/runtime/locale/et.js'),
  eu: () => import('@nuxt/ui/runtime/locale/eu.js'),
  fa_ir: () => import('@nuxt/ui/runtime/locale/fa_ir.js'),
  fi: () => import('@nuxt/ui/runtime/locale/fi.js'),
  fr: () => import('@nuxt/ui/runtime/locale/fr.js'),
  gl: () => import('@nuxt/ui/runtime/locale/gl.js'),
  he: () => import('@nuxt/ui/runtime/locale/he.js'),
  hi: () => import('@nuxt/ui/runtime/locale/hi.js'),
  hr: () => import('@nuxt/ui/runtime/locale/hr.js'),
  hu: () => import('@nuxt/ui/runtime/locale/hu.js'),
  hy: () => import('@nuxt/ui/runtime/locale/hy.js'),
  id: () => import('@nuxt/ui/runtime/locale/id.js'),
  is: () => import('@nuxt/ui/runtime/locale/is.js'),
  it: () => import('@nuxt/ui/runtime/locale/it.js'),
  ja: () => import('@nuxt/ui/runtime/locale/ja.js'),
  ka: () => import('@nuxt/ui/runtime/locale/ka.js'),
  kk: () => import('@nuxt/ui/runtime/locale/kk.js'),
  km: () => import('@nuxt/ui/runtime/locale/km.js'),
  ko: () => import('@nuxt/ui/runtime/locale/ko.js'),
  ky: () => import('@nuxt/ui/runtime/locale/ky.js'),
  lb: () => import('@nuxt/ui/runtime/locale/lb.js'),
  lo: () => import('@nuxt/ui/runtime/locale/lo.js'),
  lt: () => import('@nuxt/ui/runtime/locale/lt.js'),
  lv: () => import('@nuxt/ui/runtime/locale/lv.js'),
  mn: () => import('@nuxt/ui/runtime/locale/mn.js'),
  ms: () => import('@nuxt/ui/runtime/locale/ms.js'),
  nb_no: () => import('@nuxt/ui/runtime/locale/nb_no.js'),
  nl: () => import('@nuxt/ui/runtime/locale/nl.js'),
  pl: () => import('@nuxt/ui/runtime/locale/pl.js'),
  pt: () => import('@nuxt/ui/runtime/locale/pt.js'),
  pt_br: () => import('@nuxt/ui/runtime/locale/pt_br.js'),
  ro: () => import('@nuxt/ui/runtime/locale/ro.js'),
  ru: () => import('@nuxt/ui/runtime/locale/ru.js'),
  sk: () => import('@nuxt/ui/runtime/locale/sk.js'),
  sl: () => import('@nuxt/ui/runtime/locale/sl.js'),
  sq: () => import('@nuxt/ui/runtime/locale/sq.js'),
  sv: () => import('@nuxt/ui/runtime/locale/sv.js'),
  tg: () => import('@nuxt/ui/runtime/locale/tg.js'),
  th: () => import('@nuxt/ui/runtime/locale/th.js'),
  tr: () => import('@nuxt/ui/runtime/locale/tr.js'),
  ug_cn: () => import('@nuxt/ui/runtime/locale/ug_cn.js'),
  uk: () => import('@nuxt/ui/runtime/locale/uk.js'),
  ur: () => import('@nuxt/ui/runtime/locale/ur.js'),
  uz: () => import('@nuxt/ui/runtime/locale/uz.js'),
  vi: () => import('@nuxt/ui/runtime/locale/vi.js'),
  zh_cn: () => import('@nuxt/ui/runtime/locale/zh_cn.js'),
  zh_tw: () => import('@nuxt/ui/runtime/locale/zh_tw.js'),
}

export function uiLocaleKey(code: string) {
  const alias = UI_LOCALE_ALIASES[code]
  if (alias && UI_LOCALE_FILES.has(alias)) {
    return alias
  }

  const normalized = code.toLowerCase().replace(/-/g, '_')
  if (UI_LOCALE_FILES.has(normalized)) {
    return normalized
  }

  const base = code.split(/[-_]/)[0]?.toLowerCase() || 'en'
  if (UI_LOCALE_FILES.has(base)) {
    return base
  }

  return 'en_gb'
}

export async function loadUiLocale(code: string): Promise<Locale<Messages>> {
  const key = uiLocaleKey(code)
  if (key === 'en_gb') {
    return enGb
  }
  const load = loaders[key]
  if (!load) {
    return enGb
  }
  return (await load()).default
}

export interface LocaleSelectItem {
  code: string
  name: string
  dir: 'ltr' | 'rtl'
  flag: string
}

export function toLocaleSelectItem(locale: {
  code: string
  name?: string
  dir?: string
  flag?: string
}): LocaleSelectItem {
  return {
    code: locale.code,
    name: locale.name || locale.code,
    dir: (locale.dir as 'ltr' | 'rtl') || localeDir(locale.code),
    flag: locale.flag || locale.code
  }
}

export function emojiFlag(countryCode: string) {
  const code = countryCode.toLowerCase()
  if (code.length !== 2) {
    return ''
  }
  return code
    .toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('')
}
