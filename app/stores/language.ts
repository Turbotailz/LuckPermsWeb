import { defineStore } from 'pinia'
import Locale from 'locale-codes'
import { localeDir } from '~/utils/rtl'

export interface SupportedLanguage {
  code: string
  name: string
  countryCode: string
}

const STORAGE_KEY = 'lp-lang'

export const useLanguageStore = defineStore('language', () => {
  const { locale, setLocale, mergeLocaleMessage, t } = useI18n()
  const userLocale = ref<string>(String(locale.value || 'en'))
  const supportedLanguages = ref<SupportedLanguage[]>([
    { code: 'en', name: 'English', countryCode: 'gb' }
  ])
  const loadedLanguages = ref<string[]>(['en'])

  const currentLanguage = computed(() =>
    supportedLanguages.value.find(language => language.code === userLocale.value)
    || supportedLanguages.value[0]
  )

  const htmlDir = computed(() => localeDir(userLocale.value))

  async function fetchLanguages() {
    const { apiUrl } = useLpConfig()
    try {
      const data = await $fetch<{ languages: Record<string, { code?: string, name: string, localeTag: string, progressWeb?: number }> }>(`${apiUrl}data/translations`)
      const languages: Record<string, { code?: string, name: string, localeTag: string, progressWeb?: number }> = {
        ...data.languages,
        en: { code: 'en', name: 'English', localeTag: 'en_GB', progressWeb: 100 }
      }

      supportedLanguages.value = Object.keys(languages)
        .filter(code => languages[code]?.progressWeb)
        .map((code) => {
          const { name, localeTag } = languages[code]
          let countryCode = (localeTag.split('_')[1] || code).toLowerCase()
          if (countryCode === 'cs') {
            countryCode = 'rs'
          }
          return { code, name, countryCode }
        })
        .sort((a, b) => a.name.localeCompare(b.name))

      await applyInitialLocale()
    } catch (error) {
      console.error('Failed to load translation list', error)
    }
  }

  async function applyInitialLocale() {
    const stored = import.meta.client ? localStorage.getItem(STORAGE_KEY) : null
    if (stored && supportedLanguages.value.some(language => language.code === stored)) {
      await setUserLocale(stored)
      return
    }

    if (!import.meta.client) {
      return
    }

    const supported = supportedLanguages.value.map(language => language.code)
    const navigatorLanguages = [navigator.language, ...(navigator.languages || [])]
    const match = navigatorLanguages.find((tag) => {
      if (supported.includes(tag)) {
        return true
      }
      try {
        const iso = Locale.getByTag(tag)?.['iso639-1']
        return iso ? supported.includes(iso) : false
      } catch {
        return false
      }
    })

    let language = 'en'
    if (match) {
      language = supported.includes(match)
        ? match
        : (Locale.getByTag(match)?.['iso639-1'] || 'en')
    }
    await setUserLocale(language)
  }

  async function fetchLanguage(code: string) {
    if (code === 'en' || loadedLanguages.value.includes(code)) {
      return
    }
    const { apiUrl } = useLpConfig()
    const messages = await $fetch<Record<string, unknown>>(`${apiUrl}translation/web/${code}`)
    mergeLocaleMessage(code as 'en', messages as never)
    loadedLanguages.value.push(code)
  }

  async function setUserLocale(code: string) {
    await fetchLanguage(code)
    userLocale.value = code
    try {
      await (setLocale as unknown as (code: string) => Promise<void>)(code)
    } catch {
      locale.value = code as typeof locale.value
    }
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, code)
      document.documentElement.lang = code
      document.documentElement.dir = localeDir(code)
    }
  }

  return {
    userLocale,
    supportedLanguages,
    currentLanguage,
    htmlDir,
    t,
    fetchLanguages,
    setUserLocale
  }
})
