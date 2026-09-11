import { defineStore } from 'pinia'
import { v4 as uuid } from 'uuid'
import { fetchBytebinJson } from '~/composables/useLpConfig'
import { isLegacySessionId } from '~/utils/session'
import verboseDemo from '~/assets/data/verbose-demo.json'

export interface VerboseNode {
  id: string
  who?: { uuid?: string, identifier: string }
  permission?: string
  key?: string
  result: string
  context?: Array<{ key: string, value: string }>
  origin?: string
  resultInfo?: {
    processorClass?: string
    node?: unknown
    cause?: unknown
  }
  thread?: string
  trace?: string[]
  timestamp?: number
}

export const useVerboseStore = defineStore('verbose', () => {
  const status = ref(0)
  const sessionId = ref<string | null>(null)
  const metadata = ref<Record<string, any> | null>(null)
  const data = ref<VerboseNode[] | null>(null)
  const errors = reactive({ load: false, unsupported: false })

  function reset() {
    status.value = 0
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
      status.value = 3
      throw new Error('Unsupported version')
    }

    try {
      status.value = 1
      data.value = null
      metadata.value = null
      const payload = id === 'demo'
        ? verboseDemo
        : await fetchBytebinJson<typeof verboseDemo>(id)
      if (!payload?.data) {
        throw new Error('Invalid verbose data')
      }
      data.value = (payload.data as Omit<VerboseNode, 'id'>[]).map(node => ({
        ...node,
        id: uuid()
      }))
      metadata.value = payload.metadata
      sessionId.value = id
      status.value = 2
    } catch (error) {
      console.error(error)
      errors.load = true
      status.value = 3
      data.value = null
      metadata.value = null
      throw new Error('Loading error')
    }
  }

  return {
    status,
    sessionId,
    metadata,
    data,
    errors,
    reset,
    load
  }
})
