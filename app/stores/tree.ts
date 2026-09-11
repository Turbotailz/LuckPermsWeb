import { defineStore } from 'pinia'
import { fetchBytebinJson } from '~/composables/useLpConfig'
import { isLegacySessionId } from '~/utils/session'
import treeDemo from '~/assets/data/tree-demo.json'

export const useTreeStore = defineStore('tree', () => {
  const sessionId = ref<string | null>(null)
  const metadata = ref<Record<string, any> | null>(null)
  const data = ref<Record<string, any> | null>(null)
  const errors = reactive({ load: false, unsupported: false })
  const expandToken = ref(0)
  const collapseToken = ref(0)

  function reset() {
    sessionId.value = null
    metadata.value = null
    data.value = null
    errors.load = false
    errors.unsupported = false
  }

  async function load(id: string) {
    errors.load = false
    errors.unsupported = false
    if (!id) {
      errors.load = true
      throw new Error('Invalid session ID')
    }
    if (isLegacySessionId(id)) {
      errors.unsupported = true
      throw new Error('Unsupported version')
    }

    try {
      data.value = null
      metadata.value = null
      const payload = id === 'demo'
        ? treeDemo
        : await fetchBytebinJson<typeof treeDemo>(id)
      data.value = payload.data
      metadata.value = payload.metadata
      sessionId.value = id
    } catch (error) {
      console.error(error)
      errors.load = true
      data.value = null
      metadata.value = null
      throw new Error('Loading error')
    }
  }

  function expandAll() {
    expandToken.value += 1
  }

  function collapseAll() {
    collapseToken.value += 1
  }

  const tree = computed(() => {
    if (data.value?.tree) {
      return data.value.tree
    }
    return data.value
  })

  const checkResults = computed(() => data.value?.checkResults as Record<string, string> | undefined)

  return {
    sessionId,
    metadata,
    data,
    errors,
    tree,
    checkResults,
    expandToken,
    collapseToken,
    reset,
    load,
    expandAll,
    collapseAll
  }
})
