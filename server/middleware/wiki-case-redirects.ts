// Old wiki URLs (and case-only pairs Vue Router cannot redirect) for the default
// locale and for /:locale/wiki/... links crawled from localized pages.
import { loadLocalesMeta } from '../../config/i18n-locales'
import { redirectForWikiPath } from '../../config/wiki-redirects'

const localeCodes = loadLocalesMeta().map(locale => locale.code)

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const to = redirectForWikiPath(url.pathname, localeCodes)
  if (to) {
    return sendRedirect(event, `${to}${url.search}`, 301)
  }
})
