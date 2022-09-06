import { Box, Code, Title } from "@mantine/core"
import { EbmlToJson } from "ebml-to-json"
import { useRef, useState } from "react"
import { MODE, CODECS } from "../constants"
import { base64ToUint8Array } from "../utils"
// eslint-disable-next-line import/no-unresolved
import Worker from "../worker?worker"
import { Form } from "./Form"

export const Watch: React.FC<{
  setIsModeLocked: React.Dispatch<React.SetStateAction<boolean>>
}> = ({ setIsModeLocked }) => {
  const [isStreamStarted, setIsStreamStarted] = useState(false)
  const [watchUrl, setWatchUrl] = useState("")
  const [resp, setResp] = useState("")
  const abortRef = useRef<AbortController | null>(null)

  return (
    <>
      <Form
        mode={MODE.Watch}
        isActionStarted={isStreamStarted}
        onSubmitHandle={async ({ url, key, nonce }) => {
          if (isStreamStarted) {
            abortRef.current?.abort()
            return
          }
          const keyInArr = key ? base64ToUint8Array(key) : undefined
          const nonceInArr = nonce ? base64ToUint8Array(nonce) : undefined
          setResp("")

          if (!keyInArr && !nonceInArr) {
            setWatchUrl(url)
            return
          } else {
            setWatchUrl("")
          }

          setIsModeLocked(true)
          setIsStreamStarted(true)

          try {
            const abort = new AbortController()
            abortRef.current = abort
            const result = await fetch(url, { signal: abort.signal })

            if (!result.body) {
              return
            }

            const decodeStream = new TransformStream<Uint8Array, Uint8Array>()

            const worker = new Worker()

            worker.postMessage(
              {
                key: keyInArr,
                nonce: nonceInArr,
                readable: result.body,
                writable: decodeStream.writable,
              },
              // @ts-expect-error type broken
              [result.body, decodeStream.writable]
            )

            const reader = decodeStream.readable.getReader()
            let firstBuffer = new Uint8Array()
            let codecs: string
            while (firstBuffer.length < 200) {
              const chunk = await reader.read()
              if (!chunk.value) {
                break
              }
              const joinedChunk = new Uint8Array(
                firstBuffer.length + chunk.value.length
              )
              joinedChunk.set(firstBuffer)
              joinedChunk.set(chunk.value, firstBuffer.length)
              firstBuffer = joinedChunk
              if (joinedChunk.length < 200) {
                continue
              }
              const metadata = new EbmlToJson(chunk.value)
              const track = metadata.Segment?.Tracks?.slice(0).shift()
              if (!track) {
                // 200bytesあってTrackないのはデコード失敗してそう
                setResp("EMBL not found(Wrong key or nonce?)")
                reader.cancel()
                return
              }
              codecs = track.TrackEntry.map(
                (entry) => CODECS[entry.CodecID.value as keyof typeof CODECS]
              )
                .filter((s) => !!s)
                .join(",")
              console.info("Found codecs:", codecs)
              if (
                !codecs ||
                !MediaSource.isTypeSupported(`video/webm; codecs="${codecs}"`)
              ) {
                setResp(
                  `Codec is not supported(video/webm; codecs="${codecs}")`
                )
                reader.cancel()
                return
              }
            }

            const mediaSource = new MediaSource()
            await new Promise<void>((resolve, reject) => {
              mediaSource.addEventListener("sourceopen", async () => {
                let isClosed = false
                let sourceBuffer: SourceBuffer
                try {
                  sourceBuffer = mediaSource.addSourceBuffer(
                    `video/webm; codecs="${codecs}"`
                  )
                  sourceBuffer.mode = "sequence"
                  sourceBuffer.addEventListener("updateend", () => {
                    if (mediaSource.readyState === "open" && isClosed) {
                      mediaSource.endOfStream()
                    }
                  })
                  await new Promise((resolve, reject) => {
                    sourceBuffer.addEventListener("updateend", resolve, {
                      once: true,
                    })
                    sourceBuffer.addEventListener("error", reject, {
                      once: true,
                    })
                    sourceBuffer.appendBuffer(firstBuffer)
                  })
                } catch (error) {
                  reject(error)
                  return
                }

                try {
                  let chunk = await reader.read()
                  while (!chunk.done) {
                    if (mediaSource.readyState === "open" && chunk.value) {
                      await new Promise((resolve, reject) => {
                        sourceBuffer.addEventListener("updateend", resolve, {
                          once: true,
                        })
                        sourceBuffer.addEventListener("error", reject, {
                          once: true,
                        })
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        sourceBuffer.appendBuffer(chunk.value!)
                      })
                    } else {
                      reader.cancel()
                      setResp(
                        "MediaSource was closed unexpectedly (Wrong key or nonce?/Codec not supported?)"
                      )
                      break
                    }
                    chunk = await reader.read()
                  }
                } catch (error) {
                  reject(error)
                } finally {
                  try {
                    isClosed = true
                    if (
                      mediaSource.readyState === "open" &&
                      !sourceBuffer.updating
                    ) {
                      mediaSource.endOfStream()
                    }
                  } catch (error) {
                    console.error(error)
                  }
                  resolve()
                }
              })
              const source = URL.createObjectURL(mediaSource)
              setWatchUrl(source)
            })
          } catch (error) {
            console.error(error)
            if (error instanceof Error) {
              setResp(error.toString())
            }
          } finally {
            setIsStreamStarted(false)
            setIsModeLocked(false)
          }
        }}
      />

      {watchUrl && (
        <Box mt="md">
          <video width="100%" src={watchUrl} controls autoPlay></video>
        </Box>
      )}

      {resp && (
        <Box mt="xs">
          <Title order={3} mb="xs">
            Log
          </Title>
          <Code block={true}>{resp}</Code>
        </Box>
      )}
    </>
  )
}
