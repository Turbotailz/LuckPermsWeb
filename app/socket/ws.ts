import { decode, encode } from 'base64-arraybuffer'
import { proxy, wrap, type Remote } from 'comlink'

export interface SocketCallbacks {
  connect: (socket: Remote<SocketApi>) => void
  trust: (nonce: string) => void
  trusted: () => void
  reused: () => void
  close: () => void
}

export interface SocketApi {
  socketConnect: (
    channelId: string,
    sessionId: string,
    signVerifyAlgorithm: AlgorithmIdentifier | EcdsaParams,
    keys: CryptoKeyPairPayload,
    pluginKey: CryptoKey,
    userAgent: string,
    href: string,
    bytesocksUrl: string,
    callbacks: {
      connect: () => void
      trust: (nonce: string) => void
      trusted: () => void
      reused: () => void
      close: () => void
    }
  ) => Promise<void>
  sendChangesViaSocket: (bytebinCode: string) => Promise<string>
}

export interface CryptoKeyPairPayload {
  publicKey: CryptoKey
  privateKey: CryptoKey
  encodedPublicKey: string
  encodedPrivateKey: string
}

export async function socketConnect(
  protocolVersion: number,
  channelId: string,
  sessionId: string,
  pluginPublicKey: string,
  bytesocksUrl: string,
  callbacks: SocketCallbacks
) {
  const cryptoHelper = new CryptoHelper(protocolVersion)
  const keys = await cryptoHelper.loadKeys() || await cryptoHelper.generateKeys()
  const pluginKey = await cryptoHelper.importKey('spki', pluginPublicKey, ['verify'])

  const worker = new Worker(new URL('../workers/socket.worker.ts', import.meta.url), { type: 'module' })
  const socket = wrap<SocketApi>(worker)
  await socket.socketConnect(
    channelId,
    sessionId,
    cryptoHelper.signVerifyAlgorithm,
    keys,
    pluginKey,
    window.navigator.userAgent,
    window.location.href,
    bytesocksUrl,
    proxy({
      connect: proxy(() => {
        callbacks.connect(socket)
      }),
      trust: proxy((nonce: string) => {
        callbacks.trust(nonce)
      }),
      trusted: proxy(() => {
        callbacks.trusted()
      }),
      reused: proxy(() => {
        callbacks.reused()
      }),
      close: proxy(() => {
        callbacks.close()
      })
    })
  )
  return socket
}

class CryptoHelper {
  publicKeyVariable: string
  privateKeyVariable: string
  importAlgorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams
  generateAlgorithm: RsaHashedKeyGenParams | EcKeyGenParams
  signVerifyAlgorithm: AlgorithmIdentifier | EcdsaParams

  constructor(protocolVersion: number) {
    if (protocolVersion === 1) {
      this.publicKeyVariable = 'editor-public-key'
      this.privateKeyVariable = 'editor-private-key'
      this.importAlgorithm = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }
      this.generateAlgorithm = {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1])
      }
      this.signVerifyAlgorithm = { name: 'RSASSA-PKCS1-v1_5' }
    } else if (protocolVersion === 2) {
      this.publicKeyVariable = 'editor-public-key-v2'
      this.privateKeyVariable = 'editor-private-key-v2'
      this.importAlgorithm = { name: 'ECDSA', namedCurve: 'P-256' }
      this.generateAlgorithm = { name: 'ECDSA', namedCurve: 'P-256' }
      this.signVerifyAlgorithm = { name: 'ECDSA', hash: 'SHA-256' }
    } else {
      throw new Error(`Unsupported protocol version: ${protocolVersion}`)
    }
  }

  async loadKeys(): Promise<CryptoKeyPairPayload | null> {
    const encodedPublicKey = localStorage.getItem(this.publicKeyVariable)
    const encodedPrivateKey = localStorage.getItem(this.privateKeyVariable)
    if (!encodedPublicKey || !encodedPrivateKey) {
      return null
    }
    const publicKey = await this.importKey('spki', encodedPublicKey, [])
    const privateKey = await this.importKey('pkcs8', encodedPrivateKey, ['sign'])
    return { publicKey, privateKey, encodedPublicKey, encodedPrivateKey }
  }

  importKey(format: Exclude<KeyFormat, 'jwk'>, encoded: string, keyUsages: KeyUsage[]) {
    return crypto.subtle.importKey(format, decode(encoded), this.importAlgorithm, false, keyUsages)
  }

  async exportKey(format: Exclude<KeyFormat, 'jwk'>, key: CryptoKey, storageKey: string) {
    const exported = await crypto.subtle.exportKey(format, key)
    const encoded = encode(exported)
    localStorage.setItem(storageKey, encoded)
    return encoded
  }

  async generateKeys(): Promise<CryptoKeyPairPayload> {
    const { publicKey, privateKey } = await crypto.subtle.generateKey(this.generateAlgorithm, true, ['sign']) as CryptoKeyPair
    const encodedPublicKey = await this.exportKey('spki', publicKey, this.publicKeyVariable)
    const encodedPrivateKey = await this.exportKey('pkcs8', privateKey, this.privateKeyVariable)
    return { publicKey, privateKey, encodedPublicKey, encodedPrivateKey }
  }
}
