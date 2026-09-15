import { defineStore } from 'pinia'
import { v4 as uuid } from 'uuid'
import { gte } from 'semver'
import type { Remote } from 'comlink'
import type {
  EditorDocument,
  EditorMetaData,
  EditorModal,
  EditorNode,
  EditorPayload,
  EditorSession,
  EditorTrack,
  SavePayload
} from '~/types/editor'
import { contextsToArray } from '~/utils/editor'
import { isLegacySessionId } from '~/utils/session'
import { editorPathSuffix } from '~/utils/editor-routes'
import { fetchBytebinJson, postBytebinGzip } from '~/composables/useLpConfig'
import { socketConnect, type SocketApi } from '~/socket/ws'
import editorDemo from '~/assets/data/editor-demo.json'
import { editorSample, isLocalEditorSession } from '~/assets/data/editor-samples'

function emptyDocument(): EditorDocument {
  return {
    sessions: {},
    sessionList: [],
    nodes: [],
    tracks: [],
    deletedTracks: [],
    deletedGroups: [],
    deletedUsers: [],
    knownPermissions: [],
    potentialContexts: []
  }
}

export const useEditorStore = defineStore('editor', () => {
  const sessionId = ref<string | null>(null)
  const document = ref<EditorDocument>(emptyDocument())
  const history = useHistoryStack(document)
  const currentSessionId = ref<string | null>(null)
  const selectedNodeIds = ref<string[]>([])
  const modal = ref<EditorModal>({ type: null })
  const errors = reactive({ load: false, unsupported: false })
  const saveStatus = ref<string | null>(null)
  const saveKey = ref<string | null>(null)
  const metaData = ref<EditorMetaData>({})
  const socket = shallowRef<Remote<SocketApi> | null>(null)
  const socketStatus = ref(false)
  const loaded = ref(false)

  const sessions = computed(() => document.value.sessionList.map(id => document.value.sessions[id]).filter(Boolean))
  const currentSession = computed(() => currentSessionId.value ? document.value.sessions[currentSessionId.value] : null)
  const allNodes = computed(() => document.value.nodes)
  const currentNodes = computed(() => document.value.nodes.filter(node => node.sessionId === currentSessionId.value))
  const tracks = computed(() => document.value.tracks)
  const selectedNodes = computed(() => selectedNodeIds.value
    .map(id => document.value.nodes.find(node => node.id === id))
    .filter((node): node is EditorNode => Boolean(node)))
  const potentialContexts = computed(() => document.value.potentialContexts)
  const knownPermissions = computed(() => document.value.knownPermissions)
  const modifiedSessions = computed(() => sessions.value.filter(session => session.new || session.modified).map(session => session.id))
  const weightNodes = computed(() => document.value.nodes.filter(node => node.key.startsWith('weight')))
  const dirty = computed(() =>
    history.canUndo.value
    || modifiedSessions.value.length > 0
    || document.value.deletedGroups.length > 0
    || document.value.deletedTracks.length > 0
    || document.value.deletedUsers.length > 0
  )
  const canDeleteUsers = computed(() => {
    const version = metaData.value.pluginVersion
    if (!version) {
      return false
    }
    try {
      return gte(version, '5.1.105')
    } catch {
      return false
    }
  })

  function reset() {
    sessionId.value = null
    history.replace(emptyDocument())
    currentSessionId.value = null
    selectedNodeIds.value = []
    modal.value = { type: null }
    errors.load = false
    errors.unsupported = false
    saveStatus.value = null
    saveKey.value = null
    metaData.value = {}
    socket.value = null
    socketStatus.value = false
    loaded.value = false
  }

  function setModal(type: EditorModal['type'], object?: unknown) {
    modal.value = { type, object }
  }

  function closeModal() {
    modal.value = { type: null }
  }

  function setCurrentSession(id: string | null) {
    currentSessionId.value = id
  }

  function toggleNodeSelect(nodeId: string) {
    const index = selectedNodeIds.value.indexOf(nodeId)
    if (index >= 0) {
      selectedNodeIds.value = selectedNodeIds.value.filter(id => id !== nodeId)
    } else {
      selectedNodeIds.value = [...selectedNodeIds.value, nodeId]
    }
  }

  function selectAllSessionNodes(nodes: EditorNode[]) {
    const ids = new Set(selectedNodeIds.value)
    nodes.forEach(node => ids.add(node.id))
    selectedNodeIds.value = [...ids]
  }

  function deselectAllSessionNodes(nodes: EditorNode[]) {
    const remove = new Set(nodes.map(node => node.id))
    selectedNodeIds.value = selectedNodeIds.value.filter(id => !remove.has(id))
  }

  function deselectAllSelectedNodes() {
    selectedNodeIds.value = []
  }

  function addNodesInternal(draft: EditorDocument, nodes: Array<Partial<EditorNode> & { sessionId: string, key: string, value: boolean }>, recordNew = true) {
    nodes.forEach((node) => {
      const adding: EditorNode = {
        id: node.id || uuid(),
        sessionId: node.sessionId,
        key: node.key,
        value: node.value,
        expiry: typeof node.expiry === 'number'
          ? node.expiry
          : (node.expiry && typeof node.expiry === 'object' && 'getTime' in node.expiry
            ? (node.expiry as Date).getTime()
            : (node.expiry ?? null)),
        context: node.context || {},
        isNew: recordNew ? Boolean(node.isNew) : node.isNew,
        modified: node.modified
      }
      draft.nodes.push(adding)
      if (adding.isNew && draft.sessions[adding.sessionId]) {
        draft.sessions[adding.sessionId].modified = true
      }
    })
  }

  function addNodes(nodes: Array<Partial<EditorNode> & { sessionId: string, key: string, value: boolean }>, label = 'Add nodes') {
    history.commit(label, (draft) => {
      addNodesInternal(draft, nodes)
    })
  }

  function deleteNode(nodeId: string) {
    history.commit('Delete node', (draft) => {
      const deleting = draft.nodes.find(node => node.id === nodeId)
      if (!deleting) {
        return
      }
      draft.nodes = draft.nodes.filter(node => node.id !== nodeId)
      if (draft.sessions[deleting.sessionId]) {
        draft.sessions[deleting.sessionId].modified = true
      }
    })
    selectedNodeIds.value = selectedNodeIds.value.filter(id => id !== nodeId)
  }

  function toggleNodeValue(nodeId: string) {
    history.commit('Toggle value', (draft) => {
      const node = draft.nodes.find(item => item.id === nodeId)
      if (!node) {
        return
      }
      node.value = !node.value
      node.modified = true
      if (draft.sessions[node.sessionId]) {
        draft.sessions[node.sessionId].modified = true
      }
    })
  }

  function updateNode(nodeId: string, type: 'key' | 'expiry' | 'sessionId' | 'value', value: unknown) {
    history.commit(`Update ${type}`, (draft) => {
      const node = draft.nodes.find(item => item.id === nodeId)
      if (!node) {
        return
      }
      if (type === 'expiry') {
        node.expiry = value instanceof Date ? value.getTime() : (value as number | null)
      } else if (type === 'key') {
        node.key = String(value)
      } else if (type === 'value') {
        node.value = Boolean(value)
      } else if (type === 'sessionId') {
        if (draft.sessions[node.sessionId]) {
          draft.sessions[node.sessionId].modified = true
        }
        node.sessionId = String(value)
      }
      node.modified = true
      if (draft.sessions[node.sessionId]) {
        draft.sessions[node.sessionId].modified = true
      }
    })
  }

  function replaceNodeKey(
    sessionId: string,
    nodeId: string | undefined,
    nextKey: string | null,
    options?: { sessionDisplayName?: string }
  ) {
    history.commit('Update node', (draft) => {
      const session = draft.sessions[sessionId]
      if (options?.sessionDisplayName !== undefined && session) {
        session.displayName = options.sessionDisplayName || session.id
        session.modified = true
      }
      if (!nextKey) {
        if (nodeId) {
          draft.nodes = draft.nodes.filter(node => node.id !== nodeId)
          if (session) {
            session.modified = true
          }
        }
        return
      }
      if (nodeId) {
        const node = draft.nodes.find(item => item.id === nodeId)
        if (node && node.key !== nextKey) {
          node.key = nextKey
          node.modified = true
          if (session) {
            session.modified = true
          }
        }
        return
      }
      addNodesInternal(draft, [{
        sessionId,
        key: nextKey,
        value: true,
        isNew: true
      }])
    })
  }

  function updateNodeContext(nodeId: string, context: Record<string, string | string[]>) {
    history.commit('Update contexts', (draft) => {
      const node = draft.nodes.find(item => item.id === nodeId)
      if (!node) {
        return
      }
      node.context = context
      node.modified = true
      if (draft.sessions[node.sessionId]) {
        draft.sessions[node.sessionId].modified = true
      }
    })
  }

  function bulkUpdateNode(payload: {
    value?: boolean | null
    expiry?: number | null
    replace?: boolean
    contexts?: Record<string, string | string[]>
  }) {
    history.commit('Bulk update', (draft) => {
      selectedNodeIds.value.forEach((id) => {
        const node = draft.nodes.find(item => item.id === id)
        if (!node) {
          return
        }
        if (payload.value === true || payload.value === false) {
          node.value = payload.value
        }
        if ('expiry' in payload) {
          node.expiry = payload.expiry ?? null
        }
        if (payload.contexts) {
          if (payload.replace) {
            node.context = payload.contexts
          } else {
            const contextList: Record<string, string[]> = {}
            const keys = new Set([...Object.keys(node.context || {}), ...Object.keys(payload.contexts || {})])
            keys.forEach((key) => {
              contextList[key] = [...new Set([
                ...contextsToArray(node.context?.[key]),
                ...contextsToArray(payload.contexts?.[key])
              ])]
            })
            node.context = contextList
          }
        }
        node.modified = true
        if (draft.sessions[node.sessionId]) {
          draft.sessions[node.sessionId].modified = true
        }
      })
    })
    closeModal()
  }

  function copyNodes(sessionIds: string[]) {
    history.commit('Copy nodes', (draft) => {
      const copies: Array<Partial<EditorNode> & { sessionId: string, key: string, value: boolean }> = []
      selectedNodeIds.value.forEach((id) => {
        const node = draft.nodes.find(item => item.id === id)
        if (!node) {
          return
        }
        sessionIds.forEach((target) => {
          copies.push({
            sessionId: target,
            key: node.key,
            value: node.value,
            expiry: node.expiry,
            context: { ...node.context },
            isNew: true
          })
        })
      })
      addNodesInternal(draft, copies)
    })
    closeModal()
    deselectAllSelectedNodes()
  }

  function moveNodes(targetSession: string) {
    history.commit('Move nodes', (draft) => {
      selectedNodeIds.value.forEach((id) => {
        const node = draft.nodes.find(item => item.id === id)
        if (!node) {
          return
        }
        if (draft.sessions[node.sessionId]) {
          draft.sessions[node.sessionId].modified = true
        }
        node.sessionId = targetSession
        node.modified = true
        if (draft.sessions[targetSession]) {
          draft.sessions[targetSession].modified = true
        }
      })
    })
    deselectAllSelectedNodes()
    closeModal()
  }

  function deleteSelectedNodes() {
    history.commit('Delete nodes', (draft) => {
      const ids = new Set(selectedNodeIds.value)
      const sessionsTouched = new Set<string>()
      draft.nodes.forEach((node) => {
        if (ids.has(node.id)) {
          sessionsTouched.add(node.sessionId)
        }
      })
      draft.nodes = draft.nodes.filter(node => !ids.has(node.id))
      sessionsTouched.forEach((id) => {
        if (draft.sessions[id]) {
          draft.sessions[id].modified = true
        }
      })
    })
    selectedNodeIds.value = []
    closeModal()
  }

  function addGroup(group: { name: string, displayName: string, parent: string | number, weight: number, prefix: string, suffix: string }) {
    history.commit('Create group', (draft) => {
      const session: EditorSession = {
        id: group.name,
        displayName: group.displayName || group.name,
        type: 'group',
        new: true,
        modified: true
      }
      draft.sessions[session.id] = session
      draft.sessionList.push(session.id)
      const deleted = draft.deletedGroups.indexOf(session.id)
      if (deleted >= 0) {
        draft.deletedGroups.splice(deleted, 1)
      }
      if (group.displayName) {
        addNodesInternal(draft, [{
          sessionId: session.id,
          key: `displayname.${group.displayName}`,
          value: true,
          isNew: true
        }])
      }
      if (group.parent && group.parent !== 0) {
        addNodesInternal(draft, [{
          sessionId: session.id,
          key: `group.${group.parent}`,
          value: true,
          isNew: true
        }])
      }
      if (group.weight) {
        addNodesInternal(draft, [{
          sessionId: session.id,
          key: `weight.${group.weight}`,
          value: true,
          isNew: true
        }])
      }
      if (group.prefix) {
        addNodesInternal(draft, [{
          sessionId: session.id,
          key: `prefix.${group.weight || 0}.${group.prefix}`,
          value: true,
          isNew: true
        }])
      }
      if (group.suffix) {
        addNodesInternal(draft, [{
          sessionId: session.id,
          key: `suffix.${group.weight || 0}.${group.suffix}`,
          value: true,
          isNew: true
        }])
      }
    })
    currentSessionId.value = group.name
    closeModal()
  }

  function addUser(user: { id: string, displayName: string }) {
    const id = user.id.trim()
    if (!id) {
      return
    }
    if (document.value.sessions[id]) {
      currentSessionId.value = id
      closeModal()
      return
    }
    history.commit('Create user', (draft) => {
      const session: EditorSession = {
        id,
        displayName: user.displayName.trim() || id,
        type: 'user',
        new: true,
        modified: true
      }
      draft.sessions[session.id] = session
      draft.sessionList.push(session.id)
      const deleted = draft.deletedUsers.indexOf(session.id)
      if (deleted >= 0) {
        draft.deletedUsers.splice(deleted, 1)
      }
    })
    currentSessionId.value = id
    closeModal()
  }

  function deleteSession(id: string) {
    history.commit('Delete holder', (draft) => {
      const session = draft.sessions[id]
      if (!session) {
        return
      }
      draft.sessionList = draft.sessionList.filter(item => item !== id)
      delete draft.sessions[id]
      if (session.type === 'group') {
        draft.deletedGroups.push(id)
        draft.tracks = draft.tracks.map(track => ({
          ...track,
          groups: track.groups.filter(group => group !== id)
        }))
      } else if (session.type === 'user') {
        draft.deletedUsers.push(id)
      }
      draft.nodes = draft.nodes.filter(node => node.sessionId !== id)
    })
    if (currentSessionId.value === id) {
      currentSessionId.value = null
    }
    closeModal()
  }

  function addTrack(track: EditorTrack) {
    history.commit('Create track', (draft) => {
      draft.tracks.push({ ...track, new: true })
    })
    closeModal()
  }

  function updateTrack(id: string, newTrack: EditorTrack) {
    history.commit('Update track', (draft) => {
      if (id === newTrack.id) {
        const existing = draft.tracks.find(track => track.id === id)
        if (existing) {
          existing.groups = newTrack.groups
        }
      } else {
        draft.tracks = draft.tracks.filter(track => track.id !== id)
        draft.deletedTracks.push(id)
        draft.tracks.push({ ...newTrack })
      }
    })
    closeModal()
  }

  function deleteTrack(trackId: string) {
    history.commit('Delete track', (draft) => {
      draft.tracks = draft.tracks.filter(track => track.id !== trackId)
      draft.deletedTracks.push(trackId)
    })
  }

  function addKnownPermission(permission: string) {
    if (!document.value.knownPermissions.includes(permission)) {
      document.value.knownPermissions.push(permission)
    }
  }

  function applyPayload(data: EditorPayload) {
    const next = emptyDocument()
    metaData.value = data.metadata || {}
    data.permissionHolders?.forEach((session) => {
      next.sessions[session.id] = {
        id: session.id,
        type: session.type,
        displayName: session.displayName || session.id
      }
      next.sessionList.push(session.id)
      session.nodes?.forEach((node) => {
        next.nodes.push({
          id: uuid(),
          sessionId: session.id,
          key: node.key,
          value: node.value,
          expiry: node.expiry ? node.expiry * 1000 : null,
          context: node.context || {}
        })
      })
    })
    next.knownPermissions = data.knownPermissions || []
    next.tracks = data.tracks || []
    const potential: EditorDocument['potentialContexts'] = []
    if (data.potentialContexts) {
      for (const [key, value] of Object.entries(data.potentialContexts)) {
        potential.push({ key, values: Array.isArray(value) ? value : [value] })
      }
    }
    next.potentialContexts = potential
    history.replace(next)
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

    const previousOpenSession = currentSessionId.value
    if (!sessionId.value) {
      sessionId.value = id
    }

    try {
      if (id === 'demo') {
        sessionId.value = id
        applyPayload(editorDemo as EditorPayload)
        loaded.value = true
        return
      }

      const sample = editorSample(id)
      if (sample) {
        sessionId.value = id
        applyPayload(sample)
        loaded.value = true
        return
      }

      const data = await fetchBytebinJson<EditorPayload>(id)

      if (data.socket?.channelId) {
        const { bytesocksUrl } = useLpConfig()
        socketConnect(
          data.socket.protocolVersion,
          data.socket.channelId,
          id,
          data.socket.publicKey,
          bytesocksUrl,
          {
            connect: (next) => {
              socket.value = next
              socketStatus.value = true
            },
            trust: (nonce) => {
              setModal('trustPrompt', { nonce })
            },
            trusted: () => {
              closeModal()
            },
            reused: () => {
              setModal('reusedSessionWarning')
            },
            close: () => {
              socketStatus.value = false
            }
          }
        ).catch(error => console.error(error))
      }

      sessionId.value = id
      applyPayload(data)
      if (previousOpenSession && document.value.sessionList.includes(previousOpenSession)) {
        currentSessionId.value = previousOpenSession
      }
      loaded.value = true
    } catch (error) {
      errors.load = true
      loaded.value = false
      console.error(error)
      throw new Error(`Error loading data from bytebin - session ID: ${id}`)
    }
  }

  async function saveData() {
    if (isLocalEditorSession(sessionId.value)) {
      setModal('savedChanges', { saveKey: sessionId.value || 'demo', demo: true })
      return
    }

    saveStatus.value = 'saving'
    const payload: SavePayload = {
      sessionId: sessionId.value || '',
      changes: [],
      groupDeletions: document.value.deletedGroups,
      trackDeletions: document.value.deletedTracks,
      userDeletions: document.value.deletedUsers
    }

    modifiedSessions.value.forEach((modifiedSession) => {
      const session = document.value.sessions[modifiedSession]
      const sessionNodes = document.value.nodes.filter(node => node.sessionId === session.id)
      payload.changes.push({
        type: session.type,
        id: session.id,
        nodes: sessionNodes.map(node => ({
          key: node.key,
          value: node.value,
          ...(node.expiry ? { expiry: Math.floor(node.expiry / 1000) } : {}),
          ...(Object.entries(node.context || {}).length ? { context: node.context } : {})
        }))
      })
    })

    document.value.tracks.forEach((track) => {
      payload.changes.push({
        type: 'track',
        id: track.id,
        groups: track.groups
      })
    })

    try {
      const { key } = await postBytebinGzip(payload)
      if (socket.value && socketStatus.value) {
        try {
          const newSessionId = await socket.value.sendChangesViaSocket(key)
          saveStatus.value = 'saved'
          history.clear()
          await load(newSessionId)
          if (import.meta.client) {
            const suffix = editorPathSuffix(useRoute().path)
            await navigateTo(`/editor/${newSessionId}${suffix}`, { replace: true })
          }
          return
        } catch (error) {
          console.error(error)
        }
      }
      saveKey.value = key
      saveStatus.value = 'saved'
      setModal('savedChanges', { saveKey: key })
    } catch (error) {
      console.error(error)
      saveStatus.value = null
    }
  }

  function undo() {
    return history.undo()
  }

  function redo() {
    return history.redo()
  }

  return {
    sessionId,
    document,
    currentSessionId,
    selectedNodeIds,
    modal,
    errors,
    saveStatus,
    saveKey,
    metaData,
    socketStatus,
    loaded,
    sessions,
    currentSession,
    allNodes,
    currentNodes,
    tracks,
    selectedNodes,
    potentialContexts,
    knownPermissions,
    modifiedSessions,
    weightNodes,
    dirty,
    canDeleteUsers,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    reset,
    setModal,
    closeModal,
    setCurrentSession,
    toggleNodeSelect,
    selectAllSessionNodes,
    deselectAllSessionNodes,
    deselectAllSelectedNodes,
    addNodes,
    replaceNodeKey,
    deleteNode,
    toggleNodeValue,
    updateNode,
    updateNodeContext,
    bulkUpdateNode,
    copyNodes,
    moveNodes,
    deleteSelectedNodes,
    addGroup,
    addUser,
    deleteSession,
    addTrack,
    updateTrack,
    deleteTrack,
    addKnownPermission,
    load,
    saveData,
    undo,
    redo
  }
})
