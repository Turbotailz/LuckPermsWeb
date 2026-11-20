import createDOMPurify from 'dompurify'
import type { DOMPurify as DOMPurifyInstance } from 'dompurify'
import { TRUSTED_HTML_OPTIONS } from './trusted-html-options'

/**
 * Crowdin strings rendered with v-html. Same allowlist as LuckPermsWeb #488
 * (b, br, code, em, i, span, strong) with every attribute removed.
 * Interpolation (group names and similar) is sanitized here, after vue-i18n runs.
 *
 * Anchor tags are not allowed. Their text is kept.
 * The server branch stays behind `import.meta.client` so the browser bundle
 * does not import jsdom. Prerender and Vitest use jsdom via Node's module loader.
 */
let browserPurify: DOMPurifyInstance | undefined
let serverPurify: DOMPurifyInstance | undefined

function purifyInBrowser() {
  browserPurify ??= createDOMPurify(window)
  return browserPurify
}

function purifyOnServer() {
  if (!serverPurify) {
    const nodeModule = process.getBuiltinModule('module') as typeof import('node:module')
    const require = nodeModule.createRequire(import.meta.url)
    const { JSDOM } = require('jsdom') as typeof import('jsdom')
    const { window: domWindow } = new JSDOM('<!DOCTYPE html><html><body></body></html>')
    serverPurify = createDOMPurify(domWindow)
  }
  return serverPurify
}

export function sanitizeTrustedHtml(html: string) {
  const purify = import.meta.client ? purifyInBrowser() : purifyOnServer()
  return purify.sanitize(String(html ?? ''), TRUSTED_HTML_OPTIONS)
}
