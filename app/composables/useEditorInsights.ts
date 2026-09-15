import { flattenContexts, parseNodeType, permissionCovers, permissionNamespace } from '~/utils/editor'
import { editorGroupPath, editorTrackPath } from '~/utils/editor-routes'
import { comparePluginVersions, pluginDownloadForAlias } from '~/utils/plugin-version'

export interface InsightCount {
  key: string
  label: string
  count: number
}

export interface InsightHolder {
  id: string
  name: string
  count: number
  weight: string
  to: string
}

export interface InsightTrack {
  id: string
  groups: string[]
  to: string
}

export interface InsightNamespace {
  key: string
  usedUnique: number
  usedNodes: number
  known: number
  usedKnown: number
}

const NODE_TYPE_ORDER = ['permission', 'inheritance', 'weight', 'prefix', 'suffix', 'meta', 'displayname'] as const
const NAMESPACE_TOP = 8

function platformFromAlias(alias?: string) {
  switch (alias) {
    case 'lpv':
      return 'Velocity'
    case 'lpb':
      return 'BungeeCord'
    case 'lp':
      return 'Bukkit'
    default:
      return alias || ''
  }
}

export function useEditorInsights() {
  const editor = useEditorStore()
  const app = useAppStore()
  const { code } = useEditorNavigation()

  const groups = computed(() => editor.sessions.filter(session => session.type === 'group'))
  const users = computed(() => editor.sessions.filter(session => session.type === 'user'))

  const nodesBySession = computed(() => {
    const map = new Map<string, number>()
    for (const [sessionId, nodes] of editor.nodesBySessionId) {
      map.set(sessionId, nodes.length)
    }
    return map
  })

  const nodeTypes = computed(() => {
    const counts = new Map<string, number>()
    for (const node of editor.document.nodes) {
      const type = parseNodeType(node.key).type
      counts.set(type, (counts.get(type) || 0) + 1)
    }
    const total = editor.document.nodes.length || 1
    return NODE_TYPE_ORDER
      .filter(type => counts.has(type))
      .map(type => ({
        key: type,
        count: counts.get(type) || 0,
        percent: Math.round(((counts.get(type) || 0) / total) * 100)
      }))
  })

  const uniquePermissions = computed(() => {
    const keys = new Set<string>()
    for (const node of editor.document.nodes) {
      if (parseNodeType(node.key).type === 'permission') {
        keys.add(node.key)
      }
    }
    return keys.size
  })

  const unknownUniqueCount = computed(() => {
    const known = new Set(editor.document.knownPermissions)
    let count = 0
    const seen = new Set<string>()
    for (const node of editor.document.nodes) {
      if (parseNodeType(node.key).type !== 'permission') {
        continue
      }
      if (seen.has(node.key)) {
        continue
      }
      seen.add(node.key)
      if (!known.has(node.key)) {
        count += 1
      }
    }
    return count
  })

  const permissionNamespaces = computed<InsightNamespace[]>(() => {
    const usedUnique = new Map<string, Set<string>>()
    const usedNodes = new Map<string, number>()
    for (const node of editor.document.nodes) {
      if (parseNodeType(node.key).type !== 'permission') {
        continue
      }
      const namespace = permissionNamespace(node.key)
      if (!namespace) {
        continue
      }
      usedNodes.set(namespace, (usedNodes.get(namespace) || 0) + 1)
      const keys = usedUnique.get(namespace) || new Set<string>()
      keys.add(node.key)
      usedUnique.set(namespace, keys)
    }

    const knownByNamespace = new Map<string, string[]>()
    for (const key of editor.document.knownPermissions) {
      const namespace = permissionNamespace(key)
      if (!namespace) {
        continue
      }
      const list = knownByNamespace.get(namespace) || []
      list.push(key)
      knownByNamespace.set(namespace, list)
    }

    const names = new Set([...usedUnique.keys(), ...knownByNamespace.keys()])
    const rows: InsightNamespace[] = []
    for (const key of names) {
      const usedSet = usedUnique.get(key) || new Set<string>()
      const knownList = knownByNamespace.get(key) || []
      let usedKnown = 0
      for (const knownKey of knownList) {
        let covered = usedSet.has(knownKey)
        if (!covered) {
          for (const usedKey of usedSet) {
            if (permissionCovers(usedKey, knownKey)) {
              covered = true
              break
            }
          }
        }
        if (covered) {
          usedKnown += 1
        }
      }
      rows.push({
        key,
        usedUnique: usedSet.size,
        usedNodes: usedNodes.get(key) || 0,
        known: knownList.length,
        usedKnown
      })
    }
    return rows
  })

  const usedNamespaceBreakdown = computed<InsightCount[]>(() => {
    const rows = permissionNamespaces.value
      .filter(row => row.usedUnique > 0)
      .sort((a, b) => b.usedUnique - a.usedUnique || a.key.localeCompare(b.key))
    const top = rows.slice(0, NAMESPACE_TOP)
    const other = rows.slice(NAMESPACE_TOP).reduce((sum, row) => sum + row.usedUnique, 0)
    const items = top.map(row => ({
      key: row.key,
      label: row.key,
      count: row.usedUnique
    }))
    if (other > 0) {
      items.push({ key: 'other', label: 'other', count: other })
    }
    return items
  })

  const knownCoverage = computed(() =>
    permissionNamespaces.value
      .filter(row => row.known > 0)
      .sort((a, b) =>
        b.known - a.known
        || (b.known - b.usedKnown) - (a.known - a.usedKnown)
        || a.key.localeCompare(b.key)
      )
      .slice(0, NAMESPACE_TOP)
  )

  const negated = computed(() => editor.document.nodes.filter(node => node.value === false).length)
  const withExpiry = computed(() => editor.document.nodes.filter(node => Boolean(node.expiry)).length)
  const withContext = computed(() => editor.document.nodes.filter(node => flattenContexts(node.context).length > 0).length)

  const contextUsage = computed<InsightCount[]>(() => {
    const counts = new Map<string, number>()
    for (const node of editor.document.nodes) {
      for (const entry of flattenContexts(node.context)) {
        const label = `${entry.key}=${entry.value}`
        counts.set(label, (counts.get(label) || 0) + 1)
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([label, count]) => ({ key: label, label, count }))
  })

  const heaviestGroups = computed<InsightHolder[]>(() => {
    return [...groups.value]
      .map((group) => {
        const weightNode = editor.weightNodes.find(node => node.sessionId === group.id)
        return {
          id: group.id,
          name: group.displayName,
          count: nodesBySession.value.get(group.id) || 0,
          weight: weightNode ? weightNode.key.slice('weight.'.length) : '',
          to: editorGroupPath(code.value, group.id)
        }
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 8)
  })

  const emptyGroups = computed(() =>
    groups.value.filter(group => (nodesBySession.value.get(group.id) || 0) === 0)
  )

  const userParents = computed<InsightCount[]>(() => {
    const userIds = new Set(users.value.map(user => user.id))
    const counts = new Map<string, number>()
    for (const node of editor.document.nodes) {
      if (!userIds.has(node.sessionId) || node.value === false) {
        continue
      }
      const parsed = parseNodeType(node.key)
      if (parsed.type !== 'inheritance' || !parsed.groupName) {
        continue
      }
      counts.set(parsed.groupName, (counts.get(parsed.groupName) || 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([label, count]) => ({
        key: label,
        label,
        count
      }))
  })

  const tracks = computed<InsightTrack[]>(() =>
    [...editor.tracks]
      .map(track => ({
        id: track.id,
        groups: track.groups,
        to: editorTrackPath(code.value, track.id)
      }))
      .sort((a, b) => a.id.localeCompare(b.id))
  )

  const uploadedAt = computed(() => {
    const time = Number(editor.metaData.time)
    if (!Number.isFinite(time) || time <= 0) {
      return ''
    }
    return new Date(time).toLocaleString()
  })

  const uploader = computed(() => {
    const raw = editor.metaData.uploader
    if (raw && typeof raw === 'object' && 'name' in raw) {
      return String((raw as { name?: string }).name || '')
    }
    return ''
  })

  const alias = computed(() => String(editor.metaData.commandAlias || 'lp'))
  const pluginVersion = computed(() => String(editor.metaData.pluginVersion || ''))
  const pluginUpdate = computed(() => {
    const compared = comparePluginVersions(pluginVersion.value, app.version)
    const download = pluginDownloadForAlias(alias.value, app.downloads)
    return {
      ...compared,
      ...download
    }
  })

  return reactive({
    groups,
    users,
    groupCount: computed(() => groups.value.length),
    userCount: computed(() => users.value.length),
    trackCount: computed(() => editor.tracks.length),
    nodeCount: computed(() => editor.document.nodes.length),
    uniquePermissions,
    unknownUniqueCount,
    knownPermissions: computed(() => editor.document.knownPermissions.length),
    usedNamespaceBreakdown,
    knownCoverage,
    potentialContexts: computed(() => editor.document.potentialContexts),
    nodeTypes,
    negated,
    withExpiry,
    withContext,
    contextUsage,
    heaviestGroups,
    emptyGroups,
    userParents,
    tracks,
    pluginVersion,
    pluginUpdate,
    alias,
    platform: computed(() => platformFromAlias(alias.value)),
    uploader,
    uploadedAt,
    sessionId: computed(() => editor.sessionId || '')
  })
}
