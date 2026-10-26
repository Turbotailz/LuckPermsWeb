import { BYTEBIN_POST_HEADERS, bytebinGetUrl, bytebinPostUrl, encodeBytebinBody } from '~/utils/bytebin'

export function useLpConfig() {
  const config = useRuntimeConfig().public

  function slash(url: string) {
    return url.endsWith('/') ? url : `${url}/`
  }

  const apiUrl = slash(String(config.apiUrl || 'https://metadata.luckperms.net/'))
  const bytebinUrl = slash(String(config.bytebinUrl || 'https://usercontent.luckperms.net/'))
  const bytesocksHost = String(config.bytesocksHost || 'usersockets.luckperms.net')
  const bytesocksUrl = String(config.bytesocksUrl || `wss://${bytesocksHost}/`)
  const siteUrl = String(config.siteUrl || 'https://luckperms.net').replace(/\/$/, '')
  const selfHosted = Boolean(config.selfHosted)
  const gitHash = String(config.gitHash || 'dev')

  return {
    apiUrl,
    bytebinUrl,
    bytesocksHost,
    bytesocksUrl,
    siteUrl,
    selfHosted,
    gitHash
  }
}

export function bytebinUrlFor(id: string) {
  const { bytebinUrl } = useLpConfig()
  return bytebinGetUrl(bytebinUrl, id)
}

export async function fetchBytebinJson<T>(id: string): Promise<T> {
  const url = bytebinUrlFor(id)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Bytebin ${response.status}`)
  }
  return await response.json() as T
}

export async function postBytebinGzip(payload: unknown): Promise<{ key: string }> {
  const { bytebinUrl } = useLpConfig()
  const url = bytebinPostUrl(bytebinUrl)
  const body = encodeBytebinBody(payload)
  const response = await fetch(url, {
    method: 'POST',
    headers: BYTEBIN_POST_HEADERS,
    body
  })
  if (!response.ok) {
    throw new Error(`Bytebin post ${response.status}`)
  }
  return await response.json() as { key: string }
}

export function trackPlausible(event: string, props?: Record<string, string>) {
  if (!import.meta.client) {
    return
  }
  const plausible = (window as Window & { plausible?: (name: string, opts?: { props?: Record<string, string> }) => void }).plausible
  plausible?.(event, props ? { props } : undefined)
}
