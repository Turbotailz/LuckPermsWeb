import {
  editorGroupPath,
  editorHolderPath,
  editorSectionFromPath,
  editorSectionPath,
  editorTrackPath,
  editorUserPath,
  type EditorSection
} from '~/utils/editor-routes'

export function useEditorNavigation() {
  const route = useRoute()
  const code = computed(() => String(route.params.id || ''))
  const section = computed(() => editorSectionFromPath(route.path))

  function toSection(next: EditorSection) {
    return navigateTo(editorSectionPath(code.value, next))
  }

  function toGroup(groupId: string) {
    return navigateTo(editorGroupPath(code.value, groupId))
  }

  function toUser(userId: string) {
    return navigateTo(editorUserPath(code.value, userId))
  }

  function toTrack(trackId: string) {
    return navigateTo(editorTrackPath(code.value, trackId))
  }

  function toHolder(type: 'group' | 'user', id: string) {
    return navigateTo(editorHolderPath(code.value, type, id))
  }

  return {
    code,
    section,
    toSection,
    toGroup,
    toUser,
    toTrack,
    toHolder
  }
}
