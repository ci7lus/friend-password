import { Box, Code, Title } from "@mantine/core"
import { useRef, useState } from "react"
import { MODE } from "../constants"
import { base64ToUint8Array } from "../utils"
// eslint-disable-next-line import/no-unresolved
import Worker from "../worker?worker"
import { Form } from "./Form"

const worker = new Worker()

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
        onSubmitHandle={({ url, key, nonce }) => {
          if (isStreamStarted) {
            abortRef.current?.abort()
            return
          }
          const keyInArr = key ? base64ToUint8Array(key) : undefined
          const nonceInArr = nonce ? base64ToUint8Array(nonce) : undefined
          setResp("")
          setWatchUrl("")

          if (!keyInArr && !nonceInArr) {
            setWatchUrl(url)
            return
          }

          const abort = new AbortController()
          abortRef.current = abort
          fetch(url, { signal: abort.signal })
            .then((result) => {
              if (!result.body) {
                return
              }
              setIsModeLocked(true)
              setIsStreamStarted(true)

              const decodeStream = new TransformStream()

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
              mediaSource.addEventListener("sourceopen", async () => {
                const sourceBuffer = mediaSource.addSourceBuffer(
                  "video/webm; codecs=vp9"
                )
                const reader = decodeStream.readable.getReader()
                try {
                  let chunk = await reader.read()
                  while (!chunk.done) {
                    if (mediaSource.readyState === "open") {
                      sourceBuffer.appendBuffer(chunk.value)
                    } else {
                      reader.cancel()
                      setResp("MediaSource is closed (codec is not supported?)")
                      break
                    }
                    chunk = await reader.read()
                  }
                } catch (error) {
                  console.error(error)
                } finally {
                  mediaSource.endOfStream()
                  setIsStreamStarted(false)
                  setIsModeLocked(false)
                }
              })
              const source = URL.createObjectURL(mediaSource)
              setWatchUrl(source)
            })
            .catch((e) => {
              console.error(e)
              setResp(e.toString())
            })
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
