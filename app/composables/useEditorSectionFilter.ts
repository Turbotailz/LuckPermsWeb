import type { InjectionKey, Ref } from 'vue'

export const editorSectionFilterKey: InjectionKey<Ref<string>> = Symbol('editorSectionFilter')

export function useEditorSectionFilter() {
  return inject(editorSectionFilterKey, ref(''))
}
