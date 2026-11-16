import { splitLocalePrefix } from './tool-routes'

/** Bytebin keys are URL-safe tokens. Anything else stays out of the HTML. */
const SESSION_ID = /^[A-Za-z0-9_-]{1,128}$/

export function editorSessionPreloadId(pathname: string) {
  const raw = pathname.split('?')[0]?.split('#')[0] || '/'
  let path = raw
  try {
    path = decodeURI(raw)
  } catch {
    return null
  }

  const bare = splitLocalePrefix(path).path
  const match = bare.match(/^\/editor\/([^/]+)/)
  const id = match?.[1]
  if (!id || id === 'demo' || !SESSION_ID.test(id)) {
    return null
  }
  return id
}

export function escapeHtmlAttr(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function withTrailingSlash(url: string) {
  return url.endsWith('/') ? url : `${url}/`
}

export function metadataPreloadHref(apiUrl: string) {
  return `${withTrailingSlash(apiUrl)}data/all`
}

export function bytebinPreloadHref(bytebinUrl: string, id: string) {
  return new URL(id, withTrailingSlash(bytebinUrl)).toString()
}
