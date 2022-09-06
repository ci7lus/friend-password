import {
  Alert,
  Box,
  Button,
  Code,
  CopyButton,
  Group,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import React, { useEffect, useRef, useState } from "react"
import { DEFAULT_CODEC, MODE } from "../constants"
import { isStreamUploadSupported } from "../stream"
import { base64ToUint8Array } from "../utils"
// eslint-disable-next-line import/no-unresolved
import Worker from "../worker?worker"
import { Form } from "./Form"

export const Stream: React.FC<{
  setIsModeLocked: React.Dispatch<React.SetStateAction<boolean>>
}> = ({ setIsModeLocked }) => {
  const [isStreamStarted, setIsStreamStarted] = useState(false)
  const [isStreamUploadDisabled, setIsStreamUploadDisabled] = useState(false)
  useEffect(() => {
    isStreamUploadSupported().then((detected) =>
      setIsStreamUploadDisabled(!detected)
    )
  }, [])
  const [watchUrl, setWatchUrl] = useState("")
  const [resp, setResp] = useState("")
  const abortRef = useRef<AbortController | null>(null)

  return (
    <>
      {isStreamUploadDisabled && (
        <Alert
          radius="md"
          color="yellow"
          title="Requirements"
          variant="light"
          mb="md"
        >
          <Text mb="xs">
            To use this, <Code>ReadableStream</Code> must be able to be sent by
            fetch.
          </Text>
          <Title order={5} mb="xs">
            For Chrome/Chromium Edge
          </Title>
          <Text>Please update browser version to 105 or higher.</Text>
        </Alert>
      )}

      <Form
        mode={MODE.Stream}
        isActionStarted={isStreamStarted}
        onSubmitHandle={({ url, key, nonce }) => {
          if (isStreamUploadDisabled) {
            if (
              !confirm(
                "Your browser may not support streaming uploads. Continue?"
              )
            ) {
              return
            }
          }
          if (isStreamStarted) {
            abortRef.current?.abort()
            return
          }
          const keyInArr = key ? base64ToUint8Array(key) : undefined
          const nonceInArr = nonce ? base64ToUint8Array(nonce) : undefined
          setResp("")
          setWatchUrl("")
          navigator.mediaDevices
            .getDisplayMedia({
              video: {
                frameRate: {
                  ideal: 30,
                },
              },
              audio: {
                sampleRate: { ideal: 48000 },
                channelCount: { ideal: 2 },
                echoCancellation: false,
                noiseSuppression: false,
              },
            })
            .then((mediaStream) => {
              setIsStreamStarted(true)
              setIsModeLocked(true)

              // https://github.com/nwtgck/piping-server-streaming-upload-htmls/blob/a107dd1fb1bbee9991a9278b10d9eaf88b52c395/screen_share.html
              const recorder = new MediaRecorder(mediaStream, {
                mimeType: DEFAULT_CODEC,
              })
              const readableStream = new ReadableStream<ArrayBuffer>({
                start(ctrl) {
                  recorder.ondataavailable = async (e) => {
                    ctrl.enqueue(new Uint8Array(await e.data.arrayBuffer()))
                  }
                  recorder.start(100)
                },
                cancel() {
                  if (recorder.state === "recording") {
                    recorder.stop()
                  }
                },
              })

              let body = readableStream

              if (keyInArr && nonceInArr) {
                const transformStream = new TransformStream<
                  Uint8Array,
                  Uint8Array
                >()

                const worker = new Worker()

                worker.postMessage(
                  {
                    key: keyInArr,
                    nonce: nonceInArr,
                    readable: readableStream,
                    writable: transformStream.writable,
                  },
                  // @ts-expect-error type broken
                  [readableStream, transformStream.writable]
                )
                body = transformStream.readable
              }

              const watchUrl = new URL(location.href)
              watchUrl.searchParams.set("mode", "watch")
              watchUrl.searchParams.set("url", url)
              if (key && nonce) {
                watchUrl.searchParams.set("key", key)
                watchUrl.searchParams.set("nonce", nonce)
              }
              setWatchUrl(watchUrl.href)

              const abort = new AbortController()
              abortRef.current = abort
              fetch(url, {
                method: "PUT",
                body,
                signal: abort.signal,
                // @ts-expect-error duplex
                duplex: "half",
              })
                .then((res) => {
                  res.text().then((text) => setResp(text))
                })
                .catch((e) => {
                  console.error(e)
                  setResp(e.toString())
                })
                .finally(() => {
                  mediaStream.getTracks().forEach((track) => track.stop())
                  setIsStreamStarted(false)
                  setIsModeLocked(false)
                })
              mediaStream.getTracks().forEach((track) =>
                track.addEventListener(
                  "ended",
                  () => {
                    abort.abort()
                  },
                  {
                    once: true,
                  }
                )
              )
            })
            .catch((e) => {
              if (e instanceof Error) {
                setResp(e.message)
              }
            })
        }}
      />

      {watchUrl && (
        <Box mt="xs">
          <Title order={3} mb="xs">
            Watch URL
          </Title>
          <TextInput value={watchUrl} readOnly size="md" />
          <Group position="right" mt="xs">
            <CopyButton value={watchUrl}>
              {({ copied, copy }) => (
                <Button
                  color={copied ? "teal" : "blue"}
                  onClick={copy}
                  size="md"
                >
                  {copied ? "Copied url" : "Copy url"}
                </Button>
              )}
            </CopyButton>
          </Group>
        </Box>
      )}

      {resp && (
        <Box mt="xs">
          <Title order={3} mb="xs">
            Result
          </Title>
          <Code block={true}>{resp}</Code>
        </Box>
      )}
    </>
  )
}
