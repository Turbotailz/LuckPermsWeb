import { bytebinPreloadHref, editorSessionPreloadId, escapeHtmlAttr, metadataPreloadHref } from '../../app/utils/editor-preload'

/**
 * Editor session routes are `ssr: false`, so a Nuxt `useHead` plugin never
 * reaches their HTML shell. This hook runs for prerendered pages and for the
 * worker-rendered shells, and starts the metadata and bytebin fetches while
 * the JS bundle is still downloading.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const config = useRuntimeConfig()
    const apiUrl = String(config.public.apiUrl || 'https://metadata.luckperms.net/')
    const bytebinUrl = String(config.public.bytebinUrl || 'https://usercontent.luckperms.net/')
    const links = [
      `<link rel="preload" as="fetch" href="${escapeHtmlAttr(metadataPreloadHref(apiUrl))}" crossorigin="anonymous">`
    ]

    const sessionId = editorSessionPreloadId(event.path || '/')
    if (sessionId) {
      links.push(
        `<link rel="preload" as="fetch" href="${escapeHtmlAttr(bytebinPreloadHref(bytebinUrl, sessionId))}" crossorigin="anonymous">`
      )
    }

    html.head.push(links.join(''))
  })
})
