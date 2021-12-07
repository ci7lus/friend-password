import Chacha20 from "chacha20-universal"

const encodeFunction =
  (chacha: Chacha20 | null) =>
  (
    data: ArrayBuffer,
    controller: TransformStreamDefaultController<unknown>
  ) => {
    const dataInUint = new Uint8Array(data)
    if (!chacha) {
      controller.enqueue(dataInUint)
      return
    }
    const result = new Uint8Array(data.byteLength)
    chacha.update(result, dataInUint)
    controller.enqueue(result)
  }

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
  readable.pipeThrough(transformStream).pipeTo(writable)
}

export {}
