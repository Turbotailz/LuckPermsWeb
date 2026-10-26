import { describe, expect, it } from 'vitest'
import { canDeletePluginUsers } from '../app/utils/plugin-version'

describe('user deletion version gate', () => {
  it('allows deletes only at plugin 5.1.105 and newer', () => {
    expect(canDeletePluginUsers('5.1.104')).toBe(false)
    expect(canDeletePluginUsers('5.1.105')).toBe(true)
    expect(canDeletePluginUsers('5.2.0')).toBe(true)
    expect(canDeletePluginUsers(undefined)).toBe(false)
    expect(canDeletePluginUsers('')).toBe(false)
    expect(canDeletePluginUsers('not-a-version')).toBe(false)
  })
})
