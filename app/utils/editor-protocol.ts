export function editorSocketProtocol(protocolVersion: number) {
  if (protocolVersion === 1) {
    return {
      publicKeyVariable: 'editor-public-key',
      privateKeyVariable: 'editor-private-key',
      importAlgorithm: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      generateAlgorithm: {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1])
      },
      signVerifyAlgorithm: { name: 'RSASSA-PKCS1-v1_5' }
    }
  }
  if (protocolVersion === 2) {
    return {
      publicKeyVariable: 'editor-public-key-v2',
      privateKeyVariable: 'editor-private-key-v2',
      importAlgorithm: { name: 'ECDSA', namedCurve: 'P-256' },
      generateAlgorithm: { name: 'ECDSA', namedCurve: 'P-256' },
      signVerifyAlgorithm: { name: 'ECDSA', hash: 'SHA-256' }
    }
  }
  throw new Error(`Unsupported protocol version: ${protocolVersion}`)
}

export function applyEditsCommand(alias: string, key: string) {
  return `/${alias} applyedits ${key}`
}

export function trustEditorCommand(alias: string, nonce: string) {
  return `/${alias} trusteditor ${nonce}`
}
