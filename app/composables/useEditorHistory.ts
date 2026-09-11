import { produceWithPatches, applyPatches, enablePatches, type Patch } from 'immer'
import type { HistoryEntry } from '~/types/editor'

enablePatches()

const HISTORY_CAP = 100

export function useHistoryStack<T extends object>(document: Ref<T>) {
  const past = ref<HistoryEntry[]>([])
  const future = ref<HistoryEntry[]>([])

  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  function commit(label: string, recipe: (draft: T) => void) {
    const [next, patches, inverse] = produceWithPatches(document.value, recipe)
    if (!patches.length) {
      return
    }
    document.value = next
    past.value = [...past.value, { label, patches, inverse }].slice(-HISTORY_CAP)
    future.value = []
  }

  function replace(next: T) {
    document.value = next
    past.value = []
    future.value = []
  }

  function undo() {
    const entry = past.value.at(-1)
    if (!entry) {
      return null
    }
    document.value = applyPatches(document.value, entry.inverse as Patch[])
    past.value = past.value.slice(0, -1)
    future.value = [...future.value, entry]
    return entry.label
  }

  function redo() {
    const entry = future.value.at(-1)
    if (!entry) {
      return null
    }
    document.value = applyPatches(document.value, entry.patches as Patch[])
    future.value = future.value.slice(0, -1)
    past.value = [...past.value, entry]
    return entry.label
  }

  function clear() {
    past.value = []
    future.value = []
  }

  return {
    past,
    future,
    canUndo,
    canRedo,
    commit,
    replace,
    undo,
    redo,
    clear
  }
}
