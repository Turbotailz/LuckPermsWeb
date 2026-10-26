import { defineStore } from 'pinia'
import { localeDir } from '~/utils/rtl'
import { toLocaleSelectItem, type LocaleSelectItem } from '~/utils/locale'
import { isToolRoute, splitLocalePrefix, toolHasSession } from '~/utils/tool-routes'

const STORAGE_KEY = 'lp-lang'

export const useLanguageStore = defineStore('language', () => {
  const { locale, locales, setLocale, loadLocaleMessages, getLocaleCookie, setLocaleCookie, t } = useI18n()
  const route = useRoute()

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

  function isSupported(code: string) {
    return supportedLanguages.value.some(language => language.code === code)
  }

  function readStoredLocale() {
    // Tool routes are unprefixed, and i18n overwrites lp-lang with the route
    // locale before we can read it. The saved preference is the source of truth.
    if (import.meta.client) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return stored
      }
    }
    return getLocaleCookie() || null
  }

  if (import.meta.client) {
    watch(locale, (code) => {
      if (!isToolRoute(route.path)) {
        localStorage.setItem(STORAGE_KEY, String(code))
      }
    })
  }

  function syncDocument() {
    if (!import.meta.client) {
      return
    }
    document.documentElement.lang = userLocale.value
    document.documentElement.dir = htmlDir.value
  }

  /**
   * An open editor session stays on its current URL. setLocale() would remount
   * the page and drop unsaved edits. Locale-prefixed URLs are real routes, so
   * the switcher can navigate when there is no session yet.
   */
  async function applyLocaleInPlace(code: string) {
    await loadLocaleMessages(code)
    locale.value = code
    setLocaleCookie(code)
    syncDocument()
  }

  async function setUserLocale(code: string) {
    if (!isSupported(code)) {
      return
    }
    if (isToolRoute(route.path) && toolHasSession(route.path)) {
      await applyLocaleInPlace(code)
    } else {
      await setLocale(code)
    }
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, code)
      syncDocument()
    }
  }

  async function applyStoredLocale() {
    if (!isToolRoute(route.path)) {
      return
    }
    if (splitLocalePrefix(route.path).locale) {
      syncDocument()
      return
    }
    const stored = readStoredLocale()
    if (!stored || !isSupported(stored)) {
      syncDocument()
      return
    }
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, stored)
    }
    if (stored !== locale.value) {
      await applyLocaleInPlace(stored)
      return
    }
    syncDocument()
  }

  /** Migrate a legacy localStorage preference when the i18n cookie is absent. */
  async function hydrateFromStorage() {
    if (!import.meta.client) {
      return
    }
    const cookie = getLocaleCookie()
    if (cookie) {
      localStorage.setItem(STORAGE_KEY, cookie)
    } else {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && isSupported(stored)) {
        setLocaleCookie(stored)
      }
    }
    await applyStoredLocale()
  }

  return {
    userLocale,
    supportedLanguages,
    currentLanguage,
    htmlDir,
    t,
    setUserLocale,
    applyStoredLocale,
    hydrateFromStorage
  }
})
