import type { EditorNode } from '~/types/editor'
import { flattenContexts, parseNodeType } from '~/utils/editor'

export function isBareNode(node: EditorNode) {
  return node.value !== false && !node.expiry && flattenContexts(node.context).length === 0
}

export function nodesOfType(nodes: EditorNode[], type: string) {
  return nodes.filter(node => parseNodeType(node.key).type === type)
}

function affixWeight(key: string) {
  const parsed = parseNodeType(key)
  return parsed.type === 'prefix' || parsed.type === 'suffix' || parsed.type === 'weight'
    ? Number(parsed.weight || 0)
    : 0
}

export function pickPrimaryNode(nodes: EditorNode[], type: string) {
  const matches = nodesOfType(nodes, type)
  const bare = matches.filter(isBareNode)
  const pool = bare.length ? bare : matches.filter(node => node.value !== false)
  if (type === 'prefix' || type === 'suffix') {
    return [...pool].sort((a, b) => affixWeight(b.key) - affixWeight(a.key))[0]
  }
  return pool[0]
}

/** Extra nodes not shown on the simple holder cards (contextual, negated, or additional affixes). */
export function extraNodeCount(nodes: EditorNode[], type: string) {
  if (type === 'meta' || type === 'inheritance') {
    return nodesOfType(nodes, type).filter(node => !isBareNode(node)).length
  }
  const primary = pickPrimaryNode(nodes, type)
  return Math.max(0, nodesOfType(nodes, type).length - (primary ? 1 : 0))
}

export function holderHasExtras(nodes: EditorNode[], holderType: 'group' | 'user' = 'group') {
  const types = holderType === 'user'
    ? (['prefix', 'suffix', 'meta', 'inheritance'] as const)
    : (['prefix', 'suffix', 'meta', 'weight', 'displayname', 'inheritance'] as const)
  return types.some(type => extraNodeCount(nodes, type) > 0)
}

export function isPermissionNode(node: EditorNode) {
  return parseNodeType(node.key).type === 'permission'
}
