import { gzip } from 'pako'

export const BYTEBIN_POST_HEADERS = {
  'Content-Type': 'application/json',
  'Content-Encoding': 'gzip'
} as const

function withTrailingSlash(url: string) {
  return url.endsWith('/') ? url : `${url}/`
}

export function bytebinGetUrl(base: string, id: string) {
  return new URL(id, withTrailingSlash(base)).toString()
}

export function bytebinPostUrl(base: string) {
  return new URL('post', withTrailingSlash(base)).toString()
}

export function encodeBytebinBody(payload: unknown) {
  return gzip(JSON.stringify(payload))
}
