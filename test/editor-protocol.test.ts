import { describe, expect, it } from 'vitest'
import { applyEditsCommand, editorSocketProtocol, trustEditorCommand } from '../app/utils/editor-protocol'

describe('editor socket protocol', () => {
  it('uses RSA-4096 for protocol 1 and ECDSA P-256 for protocol 2', () => {
    const v1 = editorSocketProtocol(1)
    expect(v1.publicKeyVariable).toBe('editor-public-key')
    expect(v1.privateKeyVariable).toBe('editor-private-key')
    expect(v1.importAlgorithm).toEqual({ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' })
    expect(v1.generateAlgorithm).toMatchObject({
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 4096
    })
    expect(Array.from(v1.generateAlgorithm.publicExponent)).toEqual([1, 0, 1])

    const v2 = editorSocketProtocol(2)
    expect(v2.publicKeyVariable).toBe('editor-public-key-v2')
    expect(v2.privateKeyVariable).toBe('editor-private-key-v2')
    expect(v2.importAlgorithm).toEqual({ name: 'ECDSA', namedCurve: 'P-256' })
    expect(v2.generateAlgorithm).toEqual({ name: 'ECDSA', namedCurve: 'P-256' })
    expect(v2.signVerifyAlgorithm).toEqual({ name: 'ECDSA', hash: 'SHA-256' })
  })

  it('rejects an unknown protocol version', () => {
    expect(() => editorSocketProtocol(3)).toThrow(/Unsupported protocol version: 3/)
  })

  it('builds the applyedits and trusteditor commands', () => {
    expect(applyEditsCommand('lp', 'abc')).toBe('/lp applyedits abc')
    expect(trustEditorCommand('lp', 'nonce')).toBe('/lp trusteditor nonce')
  })
})
