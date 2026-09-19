import { defineStore } from 'pinia'
import { localeDir } from '~/utils/rtl'
import { toLocaleSelectItem, type LocaleSelectItem } from '~/utils/locale'

const STORAGE_KEY = 'lp-lang'

export const useLanguageStore = defineStore('language', () => {
  const { locale, locales, setLocale, t } = useI18n()
  const localeCookie = useCookie<string | null>(STORAGE_KEY, {
    sameSite: 'lax',
    default: () => null
  })

  const userLocale = computed(() => String(locale.value || 'en'))

  const supportedLanguages = computed<LocaleSelectItem[]>(() => {
    const list = (locales.value || []) as Array<{
      code: string
      name?: string
      dir?: string
      flag?: string
    }>
    return [...list]
      .map(toLocaleSelectItem)
      .sort((a, b) => a.name.localeCompare(b.name))
  })

  const currentLanguage = computed(() =>
    supportedLanguages.value.find(language => language.code === userLocale.value)
    || supportedLanguages.value[0]
  )

  const htmlDir = computed(() => localeDir(userLocale.value))

  async function setUserLocale(code: string) {
    if (!supportedLanguages.value.some(language => language.code === code)) {
      return
    }
    await setLocale(code as typeof locale.value)
    localeCookie.value = code
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, code)
      document.documentElement.lang = code
      document.documentElement.dir = localeDir(code)
    }
  }

  /** Migrate legacy localStorage preference when the i18n cookie is absent. */
  async function hydrateFromStorage() {
    if (!import.meta.client) {
      return
    }
    if (localeCookie.value) {
      localStorage.setItem(STORAGE_KEY, localeCookie.value)
      return
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && stored !== locale.value && supportedLanguages.value.some(language => language.code === stored)) {
      await setUserLocale(stored)
    }
  }

  return {
    userLocale,
    supportedLanguages,
    currentLanguage,
    htmlDir,
    t,
    setUserLocale,
    hydrateFromStorage
  }
})
