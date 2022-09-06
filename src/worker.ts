import Chacha20 from "chacha20-universal"

const encodeFunction =
  (chacha: Chacha20 | null) =>
  (data: Uint8Array, controller: TransformStreamDefaultController<unknown>) => {
    if (!chacha) {
      controller.enqueue(data)
      return
    }
    const result = new Uint8Array(data.byteLength)
    chacha.update(result, data)
    controller.enqueue(result)
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const worker: Worker = self as any

worker.onmessage = (event) => {
  const { readable, writable, key, nonce } = event.data as {
    key: Uint8Array | null
    nonce: Uint8Array | null
    readable: ReadableStream
    writable: WritableStream
  }
  const transformStream = new TransformStream({
    transform: encodeFunction(key && nonce ? new Chacha20(nonce, key) : null),
  })
  readable
    .pipeThrough(transformStream)
    .pipeTo(writable)
    .finally(() => self.close())
}

export {}
