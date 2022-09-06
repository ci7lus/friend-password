// https://github.com/whatwg/fetch/issues/1275
export const isStreamUploadSupported = async () => {
  const supportsStreamsInRequestObjects = !new Request("", {
    body: new ReadableStream(),
    method: "POST",
    // @ts-expect-error duplex
    duplex: "half",
  }).headers.has("Content-Type")

  if (!supportsStreamsInRequestObjects) {
    return false
  }

  return await fetch("data:a/a;charset=utf-8,", {
    method: "POST",
    body: new ReadableStream(),
    // @ts-expect-error duplex
    duplex: "half",
  }).then(
    () => true,
    () => false
  )
}
