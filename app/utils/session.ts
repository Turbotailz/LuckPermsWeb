export function sessionIdFromRoute(route: { params: Record<string, unknown>, query: Record<string, unknown>, hash: string }) {
  const id = route.params.id
  if (typeof id === 'string' && id) {
    return id
  }
  if (Array.isArray(id) && id[0]) {
    return id[0]
  }

  const queryKeys = Object.keys(route.query)
  if (queryKeys.length > 0) {
    return `?${queryKeys[0]}`
  }

  if (route.hash) {
    return route.hash
  }

  return null
}

export function isLegacySessionId(sessionId: string) {
  return sessionId.startsWith('?') || sessionId.startsWith('#')
}

export function withTrailingSlash(url: string) {
  return url.endsWith('/') ? url : `${url}/`
}
