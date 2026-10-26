import { isToolRoute } from '~/utils/tool-routes'

const STORAGE_KEY = 'lp-lang'

function readLangCookie() {
  const match = document.cookie.match(/(?:^|; )lp-lang=([^;]*)/)
  return match?.[1] ? decodeURIComponent(match[1]) : ''
}

export default defineNuxtPlugin({
  name: 'lp-tool-locale',
  enforce: 'pre',
  setup(nuxtApp) {
    // Capture the language cookie before route detection replaces it with `en`
    // on unprefixed editor, verbose, and tree URLs.
    if (!localStorage.getItem(STORAGE_KEY)) {
      const cookie = readLangCookie()
      if (cookie) {
        localStorage.setItem(STORAGE_KEY, cookie)
      }
    }

    nuxtApp.hook('page:finish', () => {
      const route = useRoute()
      if (!isToolRoute(route.path)) {
        return
      }
      void useLanguageStore().applyStoredLocale()
    })
  }
})
