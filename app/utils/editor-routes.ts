export type EditorSection = 'groups' | 'users' | 'tracks'

export function editorSectionPath(code: string, section: EditorSection) {
  return `/editor/${code}/${section}`
}

export function editorGroupPath(code: string, groupId: string) {
  return `/editor/${code}/groups/${encodeURIComponent(groupId)}`
}

export function editorUserPath(code: string, userId: string) {
  return `/editor/${code}/users/${encodeURIComponent(userId)}`
}

export function editorTrackPath(code: string, trackId: string) {
  return `/editor/${code}/tracks/${encodeURIComponent(trackId)}`
}

export function editorHolderPath(code: string, type: 'group' | 'user', id: string) {
  return type === 'group' ? editorGroupPath(code, id) : editorUserPath(code, id)
}

export function editorSectionFromPath(path: string): EditorSection {
  const match = path.match(/^\/editor\/[^/]+\/(groups|users|tracks)(?:\/|$)/)
  return (match?.[1] as EditorSection) || 'groups'
}

export function editorPathSuffix(path: string) {
  const suffix = path.replace(/^\/editor\/[^/]+/, '')
  return suffix && suffix !== '/' ? suffix : '/groups'
}
