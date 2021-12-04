// https://github.com/nwtgck/piping-server-streaming-upload-htmls/blob/a107dd1fb1bbee9991a9278b10d9eaf88b52c395/screen_share.html
export const mediaStreamToReadableStream = (
  mediaStream: MediaStream,
  timeslice: number
) => {
  const recorder = new MediaRecorder(mediaStream)
  return new ReadableStream({
    start(ctrl) {
      recorder.ondataavailable = async (e) => {
        ctrl.enqueue(new Uint8Array(await e.data.arrayBuffer()))
      }
      recorder.start(timeslice)
    },
    cancel() {
      recorder.stop()
    },
  })
}

// https://github.com/whatwg/fetch/issues/1275
export const isStreamUploadSupported = async () => {
  const supportsStreamsInRequestObjects = !new Request("", {
    body: new ReadableStream(),
    method: "POST",
  }).headers.has("Content-Type")

  if (!supportsStreamsInRequestObjects) {
    return false
  }

  return await fetch("data:a/a;charset=utf-8,", {
    method: "POST",
    body: new ReadableStream(),
  }).then(
    () => true,
    () => false
  )
}
