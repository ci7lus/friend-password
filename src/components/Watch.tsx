import { Box, Code, Title } from "@mantine/core"
import { useRef, useState } from "react"
import { CODEC_WITH_SOUND, CODEC_WITHOUT_SOUND, MODE } from "../constants"
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

            const mediaSource = new MediaSource()
            await new Promise<void>((resolve, reject) => {
              mediaSource.addEventListener("sourceopen", async () => {
                let isFirst = true
                let sourceBuffer: SourceBuffer | null = null
                const reader = decodeStream.readable.getReader()
                let isClosed = false
                try {
                  let chunk = await reader.read()
                  while (!chunk.done) {
                    if (mediaSource.readyState === "open") {
                      if (isFirst) {
                        const codec = new TextDecoder()
                          .decode(chunk.value.slice(0, 130))
                          .toLowerCase()
                          .includes("opus")
                          ? CODEC_WITH_SOUND
                          : CODEC_WITHOUT_SOUND
                        sourceBuffer = mediaSource.addSourceBuffer(codec)
                        sourceBuffer.addEventListener("updateend", () => {
                          if (mediaSource.readyState === "open" && isClosed) {
                            setTimeout(() => mediaSource.endOfStream(), 5000)
                            mediaSource.endOfStream()
                          }
                        })
                        isFirst = false
                      }
                      sourceBuffer?.appendBuffer(chunk.value)
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
                      !sourceBuffer?.updating
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
