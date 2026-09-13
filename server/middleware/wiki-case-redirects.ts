import { wikiCaseOnlyRedirects } from '../../config/wiki-redirects'

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname.replace(/\/+$/, '') || '/'
  const to = wikiCaseOnlyRedirects[path]
  if (to) {
    return sendRedirect(event, to, 301)
  }
})
