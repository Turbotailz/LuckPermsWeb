export interface EditorNode {
  id: string
  sessionId: string
  key: string
  value: boolean
  expiry: number | null
  context: Record<string, string | string[]>
  isNew?: boolean
  modified?: boolean
}

export interface EditorSession {
  id: string
  type: 'group' | 'user'
  displayName: string
  new?: boolean
  modified?: boolean
}

export interface EditorTrack {
  id: string
  type?: 'track'
  groups: string[]
  new?: boolean
}

export interface PotentialContext {
  key: string
  values: string[]
}

export interface EditorDocument {
  sessions: Record<string, EditorSession>
  sessionList: string[]
  nodes: EditorNode[]
  tracks: EditorTrack[]
  deletedTracks: string[]
  deletedGroups: string[]
  deletedUsers: string[]
  knownPermissions: string[]
  potentialContexts: PotentialContext[]
}

export interface EditorMetaData {
  commandAlias?: string
  pluginVersion?: string
  platform?: string
  [key: string]: unknown
}

export interface EditorSocketInfo {
  channelId: string
  protocolVersion: number
  publicKey: string
}

export interface EditorPayload {
  metadata?: EditorMetaData
  permissionHolders?: Array<{
    id: string
    type: 'group' | 'user'
    displayName?: string
    nodes?: Array<{
      key: string
      value: boolean
      expiry?: number
      context?: Record<string, string | string[]>
    }>
  }>
  knownPermissions?: string[]
  potentialContexts?: Record<string, string | string[]>
  tracks?: EditorTrack[]
  socket?: EditorSocketInfo
}

export interface ContextEntry {
  key: string
  value: string
}

export type EditorModalType =
  | 'createGroup'
  | 'createTrack'
  | 'deleteGroup'
  | 'deleteUser'
  | 'deleteNodes'
  | 'copyNodes'
  | 'moveNodes'
  | 'savedChanges'
  | 'trustPrompt'
  | 'reusedSessionWarning'
  | null

export interface EditorModal {
  type: EditorModalType
  object?: unknown
}

export interface HistoryEntry {
  label: string
  inverse: import('immer').Patch[]
  patches: import('immer').Patch[]
}

export interface SavePayload {
  sessionId: string
  changes: Array<Record<string, unknown>>
  groupDeletions: string[]
  trackDeletions: string[]
  userDeletions: string[]
}
