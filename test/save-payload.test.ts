import { describe, expect, it } from 'vitest'
import { buildSavePayload, expiryFromWire } from '../app/utils/save-payload'

describe('editor save payload', () => {
  it('sends modified holders, every track, expiry in seconds, and always includes deletions', () => {
    const payload = buildSavePayload({
      sessionId: 'abc',
      modifiedHolders: [
        {
          type: 'group',
          id: 'mod',
          nodes: [
            { key: 'essentials.fly', value: true, expiry: 1500, context: { server: 'hub' } },
            { key: 'essentials.heal', value: false, expiry: null, context: {} }
          ]
        }
      ],
      tracks: [{ id: 'staff', groups: ['default', 'mod'] }],
      groupDeletions: ['retired', 'default'],
      trackDeletions: [],
      userDeletions: ['user-1']
    })

    expect(payload).toEqual({
      sessionId: 'abc',
      changes: [
        {
          type: 'group',
          id: 'mod',
          nodes: [
            { key: 'essentials.fly', value: true, expiry: 1, context: { server: 'hub' } },
            { key: 'essentials.heal', value: false }
          ]
        },
        { type: 'track', id: 'staff', groups: ['default', 'mod'] }
      ],
      groupDeletions: ['retired'],
      trackDeletions: [],
      userDeletions: ['user-1']
    })
  })

  it('converts wire expiry from seconds to milliseconds', () => {
    expect(expiryFromWire(30)).toBe(30000)
    expect(expiryFromWire(0)).toBeNull()
    expect(expiryFromWire(undefined)).toBeNull()
  })
})
