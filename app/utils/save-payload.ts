import type { SavePayload } from '~/types/editor'

export interface SaveNodeInput {
  key: string
  value: boolean
  expiry: number | null
  context?: Record<string, string | string[]>
}

export interface SaveHolderInput {
  type: 'group' | 'user'
  id: string
  nodes: SaveNodeInput[]
}

export interface SaveTrackInput {
  id: string
  groups: string[]
}

/** Bytebin stores expiry in seconds. The editor keeps milliseconds. */
export function expiryFromWire(seconds?: number | null) {
  return seconds ? seconds * 1000 : null
}

export function isProtectedGroup(id: string) {
  return id === 'default'
}

export function buildSavePayload(input: {
  sessionId: string
  modifiedHolders: SaveHolderInput[]
  tracks: SaveTrackInput[]
  groupDeletions: string[]
  trackDeletions: string[]
  userDeletions: string[]
}): SavePayload {
  const changes: SavePayload['changes'] = []

  for (const holder of input.modifiedHolders) {
    changes.push({
      type: holder.type,
      id: holder.id,
      nodes: holder.nodes.map(node => ({
        key: node.key,
        value: node.value,
        ...(node.expiry ? { expiry: Math.floor(node.expiry / 1000) } : {}),
        ...(Object.entries(node.context || {}).length ? { context: node.context } : {})
      }))
    })
  }

  for (const track of input.tracks) {
    changes.push({
      type: 'track',
      id: track.id,
      groups: track.groups
    })
  }

  return {
    sessionId: input.sessionId,
    changes,
    groupDeletions: input.groupDeletions.filter(id => !isProtectedGroup(id)),
    trackDeletions: input.trackDeletions,
    userDeletions: input.userDeletions
  }
}
