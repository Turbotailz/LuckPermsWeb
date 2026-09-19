import type { Locale } from '@nuxt/ui'
import type { Messages } from '@nuxt/ui'
import * as uiLocales from '@nuxt/ui/locale'
import { localeDir } from '~/utils/rtl'

/** Map LuckPerms / Crowdin locale codes onto @nuxt/ui locale exports. */
const UI_LOCALE_ALIASES: Record<string, keyof typeof uiLocales> = {
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

export function resolveUiLocale(code: string): Locale<Messages> {
  const alias = UI_LOCALE_ALIASES[code]
  if (alias && uiLocales[alias]) {
    return uiLocales[alias] as Locale<Messages>
  }

  const normalized = code.toLowerCase().replace(/-/g, '_')
  if (normalized in uiLocales) {
    return uiLocales[normalized as keyof typeof uiLocales] as Locale<Messages>
  }

  const base = code.split(/[-_]/)[0]?.toLowerCase() || 'en'
  if (base in uiLocales) {
    return uiLocales[base as keyof typeof uiLocales] as Locale<Messages>
  }

  return uiLocales.en_gb as Locale<Messages>
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
