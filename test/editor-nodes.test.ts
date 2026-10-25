import { describe, expect, it } from 'vitest'
import { buildNodeKey, nodeDisplayValue, parseNodeType } from '../app/utils/editor'

describe('node parsing', () => {
  it('treats group.* as inheritance and round-trips the key', () => {
    expect(parseNodeType('group.admin')).toEqual({ type: 'inheritance', groupName: 'admin' })
    expect(buildNodeKey('inheritance', { groupName: 'admin' })).toBe('group.admin')
    expect(buildNodeKey('group', { groupName: 'admin' })).toBe('')
  })

  it('escapes dots in meta keys and displays key = value', () => {
    const key = buildNodeKey('meta', { key: 'foo.bar', value: 'baz.qux' })
    expect(key).toBe('meta.foo\\.bar.baz\\.qux')
    expect(parseNodeType(key)).toEqual({ type: 'meta', key: 'foo.bar', value: 'baz.qux' })
    expect(nodeDisplayValue(key)).toBe('foo.bar = baz.qux')
  })

  it('unescapes prefix and suffix values', () => {
    const key = buildNodeKey('prefix', { weight: '10', prefix: 'Hello.world' })
    expect(key).toBe('prefix.10.Hello\\.world')
    expect(parseNodeType(key)).toEqual({ type: 'prefix', weight: '10', prefix: 'Hello.world' })
    expect(nodeDisplayValue(key)).toBe('Hello.world (10)')
  })
})
