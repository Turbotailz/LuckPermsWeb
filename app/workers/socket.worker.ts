import { decode, encode } from 'base64-arraybuffer'
import Bowser from 'bowser'
import { expose } from 'comlink'

const KEEP_LISTENING = true
const STOP_LISTENING = false

let globalSocket: SocketInterface | null = null

class SocketInterface {
  socket: WebSocket
  signVerifyAlgorithm: AlgorithmIdentifier | EcdsaParams
  keys: { privateKey: CryptoKey, encodedPublicKey: string }
  pluginKey: CryptoKey
  listeners: Array<(msg: Record<string, unknown>) => boolean> = []
  lastPing = 0
  lastPong = 0
  keepaliveTask: ReturnType<typeof setInterval> | null = null

  constructor(
    socket: WebSocket,
    signVerifyAlgorithm: AlgorithmIdentifier | EcdsaParams,
    keys: { privateKey: CryptoKey, encodedPublicKey: string },
    pluginKey: CryptoKey
  ) {
    this.socket = socket
    this.signVerifyAlgorithm = signVerifyAlgorithm
    this.keys = keys
    this.pluginKey = pluginKey
  }

  async send(msg: Record<string, unknown>) {
    const encoded = JSON.stringify(msg)
    const signature = await crypto.subtle.sign(
      this.signVerifyAlgorithm,
      this.keys.privateKey,
      new TextEncoder().encode(encoded)
    )
    this.socket.send(JSON.stringify({
      msg: encoded,
      signature: encode(signature)
    }))
  }

  registerListener(listener: (msg: Record<string, unknown>) => boolean) {
    this.listeners.push(listener)
  }

  async onReceive(frame: { msg?: string, signature?: string }) {
    const { msg: encodedMessage, signature } = frame
    if (!encodedMessage || !signature) {
      return
    }

    const verified = await crypto.subtle.verify(
      this.signVerifyAlgorithm,
      this.pluginKey,
      decode(signature),
      new TextEncoder().encode(encodedMessage)
    )
    if (!verified) {
      return
    }

    const msg = JSON.parse(encodedMessage) as Record<string, unknown>
    const toRemove: number[] = []
    this.listeners.forEach((listener, i) => {
      if (listener(msg) === STOP_LISTENING) {
        toRemove.unshift(i)
      }
    })
    toRemove.forEach(i => this.listeners.splice(i, 1))
  }
}

function resolveBytesocksUrl(bytesocksUrl: string, windowHref: string) {
  const url = new URL(bytesocksUrl, windowHref)
  if (url.protocol === 'https:') {
    url.protocol = 'wss:'
  } else if (url.protocol === 'http:') {
    url.protocol = 'ws:'
  }
  return url
}

function socketConnect(
  channelId: string,
  sessionId: string,
  signVerifyAlgorithm: AlgorithmIdentifier | EcdsaParams,
  keys: { privateKey: CryptoKey, encodedPublicKey: string },
  pluginKey: CryptoKey,
  userAgent: string,
  windowHref: string,
  bytesocksUrl: string,
  callbacks: {
    connect: () => void
    trust: (nonce: string) => void
    trusted: () => void
    reused: () => void
    close: () => void
  }
) {
  const url = resolveBytesocksUrl(bytesocksUrl, windowHref)
  const socket = new WebSocket(`${url}${channelId}`)
  const socketInterface = new SocketInterface(socket, signVerifyAlgorithm, keys, pluginKey)

  socket.onmessage = (event) => {
    socketInterface.onReceive(JSON.parse(event.data))
  }
  socket.onopen = () => {
    initConnection(socketInterface, sessionId, keys.encodedPublicKey, userAgent, callbacks)
  }
  socket.onclose = () => {
    callbacks.close()
  }
  globalSocket = socketInterface
}

function initConnection(
  socket: SocketInterface,
  sessionId: string,
  encodedPublicKey: string,
  userAgent: string,
  callbacks: {
    connect: () => void
    trust: (nonce: string) => void
    trusted: () => void
    reused: () => void
    close: () => void
  }
) {
  const nonce = `${randomString(4)}-${randomString(4)}`

  function onMessage(msg: Record<string, unknown>) {
    if (msg.type === 'hello-reply' && msg.nonce === nonce) {
      if (msg.state === 'accepted' || msg.state === 'trusted') {
        if (msg.state === 'trusted') {
          socket.send({ type: 'connected' })
          callbacks.trusted()
        }
        startKeepalive(socket)
        callbacks.connect()
        return STOP_LISTENING
      }
      if (msg.state === 'untrusted') {
        callbacks.trust(nonce)
        return KEEP_LISTENING
      }
      if (msg.state === 'invalid') {
        callbacks.reused()
        socket.socket.close()
        return STOP_LISTENING
      }
      if (msg.state === 'rejected') {
        socket.socket.close()
        return STOP_LISTENING
      }
      throw new Error(`unknown state: ${msg.state}`)
    }
    return KEEP_LISTENING
  }

  socket.registerListener(onMessage)
  const { browser, os } = Bowser.parse(userAgent)
  socket.send({
    type: 'hello',
    nonce,
    sessionId,
    browser: `${browser.name} on ${os.name}`,
    publicKey: encodedPublicKey
  })
}

function sendChangesViaSocket(bytebinCode: string) {
  const socket = globalSocket
  return new Promise<string>((resolve, reject) => {
    if (!socket || socket.socket.readyState !== 1) {
      reject(new Error('Socket closed'))
      return
    }

    let timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for plugin to ack change'))
    }, 2000)

    function onMessage(msg: Record<string, unknown>) {
      if (msg.type === 'change-response') {
        if (msg.state === 'accepted') {
          clearTimeout(timeout)
          timeout = setTimeout(() => {
            reject(new Error('Timeout waiting for plugin to reply with new code'))
          }, 10_000)
          return KEEP_LISTENING
        }
        if (msg.state === 'applied') {
          clearTimeout(timeout)
          resolve(String(msg.newSessionCode))
          return STOP_LISTENING
        }
      }
      return KEEP_LISTENING
    }

    socket.registerListener(onMessage)
    socket.send({
      type: 'change-request',
      code: bytebinCode
    })
  })
}

function startKeepalive(socket: SocketInterface) {
  socket.registerListener((msg) => {
    if (msg.type === 'pong') {
      if (!msg.ok) {
        socket.socket.close()
        return STOP_LISTENING
      }
      socket.lastPong = Date.now()
    }
    return KEEP_LISTENING
  })

  socket.keepaliveTask = setInterval(() => {
    if (socket.socket.readyState !== 1) {
      if (socket.keepaliveTask) {
        clearInterval(socket.keepaliveTask)
      }
      return
    }
    if (socket.lastPing !== 0 && Date.now() - socket.lastPong > 11_000) {
      socket.socket.close()
      return
    }
    socket.lastPing = Date.now()
    socket.send({ type: 'ping' })
  }, 10_000)
}

function randomString(len: number) {
  const arr = new Uint8Array((len || 40) / 2)
  crypto.getRandomValues(arr)
  return Array.from(arr, dec => dec.toString(16).padStart(2, '0')).join('')
}

expose({ socketConnect, sendChangesViaSocket })
