import { splitLocalePrefix, withLocalePrefix } from '~/utils/tool-routes'

export type EditorSection = 'home' | 'groups' | 'users' | 'tracks'

let readRouteLocale: () => string | null = () => null

/** Keep in-editor links under the URL's locale prefix (`/de/editor/...`). */
export function setEditorRouteLocale(reader: () => string | null) {
  readRouteLocale = reader
}

function localize(path: string) {
  try {
    return withLocalePrefix(path, readRouteLocale())
  } catch {
    return path
  }
}

export function localizeToolPath(path: string) {
  return localize(path)
}

export function editorHomePath(code: string) {
  return localize(`/editor/${code}`)
}

export function editorSectionPath(code: string, section: EditorSection) {
  if (section === 'home') {
    return editorHomePath(code)
  }
  return localize(`/editor/${code}/${section}`)
}

export function editorGroupPath(code: string, groupId: string) {
  return localize(`/editor/${code}/groups/${encodeURIComponent(groupId)}`)
}

export function editorUserPath(code: string, userId: string) {
  return localize(`/editor/${code}/users/${encodeURIComponent(userId)}`)
}

export function editorTrackPath(code: string, trackId: string) {
  return localize(`/editor/${code}/tracks/${encodeURIComponent(trackId)}`)
}

export function editorHolderPath(code: string, type: 'group' | 'user', id: string) {
  return type === 'group' ? editorGroupPath(code, id) : editorUserPath(code, id)
}

export function editorSectionFromPath(path: string): EditorSection {
  const bare = splitLocalePrefix(path).path
  const match = bare.match(/^\/editor\/[^/]+\/(groups|users|tracks)(?:\/|$)/)
  return (match?.[1] as EditorSection) || 'home'
}

export function editorPathSuffix(path: string) {
  const bare = splitLocalePrefix(path).path
  const suffix = bare.replace(/^\/editor\/[^/]+/, '')
  return suffix && suffix !== '/' ? suffix : ''
}
