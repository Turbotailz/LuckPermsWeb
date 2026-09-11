export function contextsToArray(context: string | string[] | undefined): string[] {
  if (Array.isArray(context)) {
    return context
  }
  if (context) {
    return [context]
  }
  return []
}

export function flattenContexts(context: Record<string, string | string[]> | undefined): { key: string, value: string }[] {
  if (!context) {
    return []
  }
  const entries: { key: string, value: string }[] = []
  for (const [key, raw] of Object.entries(context)) {
    for (const value of contextsToArray(raw)) {
      entries.push({ key, value })
    }
  }
  return entries
}

export function parseNodeType(key: string) {
  if (key.startsWith('group.')) {
    return {
      type: 'inheritance' as const,
      groupName: key.substring(6)
    }
  }

  if (key.startsWith('prefix.')) {
    const parts = key.substring(7).match(/^(\d+)\.(.+)$/)
    if (parts) {
      return {
        type: 'prefix' as const,
        weight: parts[1],
        prefix: unescapeCharacters(parts[2] || '')
      }
    }
  }

  if (key.startsWith('suffix.')) {
    const parts = key.substring(7).match(/^(\d+)\.(.+)$/)
    if (parts) {
      return {
        type: 'suffix' as const,
        weight: parts[1],
        suffix: unescapeCharacters(parts[2] || '')
      }
    }
  }

  if (key.startsWith('meta.')) {
    const parts = splitByNodeSeparatorInTwo(key.substring(5))
    if (parts && parts.length === 2) {
      return {
        type: 'meta' as const,
        key: unescapeCharacters(parts[0] || ''),
        value: unescapeCharacters(parts[1] || '')
      }
    }
  }

  if (key.startsWith('weight.')) {
    return {
      type: 'weight' as const,
      weight: key.substring(7)
    }
  }

  if (key.startsWith('displayname.')) {
    return {
      type: 'displayname' as const,
      displayName: key.substring(12)
    }
  }

  return {
    type: 'permission' as const,
    permission: key
  }
}

export function buildNodeKey(type: string, parts: Record<string, string | undefined>) {
  switch (type) {
    case 'inheritance':
      return `group.${parts.groupName || ''}`
    case 'prefix':
      return `prefix.${parts.weight || '0'}.${escapeCharacters(parts.prefix || '')}`
    case 'suffix':
      return `suffix.${parts.weight || '0'}.${escapeCharacters(parts.suffix || '')}`
    case 'meta':
      return `meta.${escapeCharacters(parts.key || '')}.${escapeCharacters(parts.value || '')}`
    case 'weight':
      return `weight.${parts.weight || '0'}`
    case 'displayname':
      return `displayname.${parts.displayName || ''}`
    default:
      return parts.permission || ''
  }
}

function escapeCharacters(str: string) {
  return str.replace(/\./g, '\\.')
}

function unescapeCharacters(str: string) {
  return str.replace(/\\\./g, '.')
}

function splitByNodeSeparatorInTwo(str: string) {
  return str.split(/(?<!\\)\./, 2)
}

export function contextSortKey(context: Record<string, string | string[]> | undefined) {
  return flattenContexts(context)
    .map(entry => `${entry.key}:${entry.value}`)
    .sort()
    .join('|')
}
