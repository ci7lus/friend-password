import {
  Alert,
  Box,
  Button,
  Code,
  CopyButton,
  Group,
  Image,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import { useEffect, useRef, useState } from "react"
import { MODE } from "../constants"
import { isStreamUploadSupported, mediaStreamToReadableStream } from "../stream"
import { base64ToUint8Array } from "../utils"
// eslint-disable-next-line import/no-unresolved
import Worker from "../worker?worker"
import { Form } from "./Form"

const worker = new Worker()

export const Stream = () => {
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
          title="Before you use it!"
          variant="light"
          mb="md"
        >
          <Text mb="xs">
            To use Tomitake, <Code>ReadableStream</Code> must be able to be sent
            by fetch.
          </Text>
          <Title order={4} mb="xs">
            For Chrome/Chromium Edge
          </Title>
          <Text mb="xs">
            Enable <Code>Experimental Web Platfrom features</Code> from{" "}
            <Code>chrome://flags</Code>.
          </Text>
          <Image
            src="https://i.gyazo.com/d89af071fe52c9fa0275edfe9f3e5431.png"
            alt="Image from Gyazo"
            width="731"
          />
        </Alert>
      )}

      <Form
        mode={MODE.Stream}
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
              const readableStream = mediaStreamToReadableStream(
                mediaStream,
                100
              )
              const transformStream = new TransformStream()

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

              const watchUrl = new URL(location.href)
              watchUrl.searchParams.set("mode", "watch")
              watchUrl.searchParams.set("url", url)
              if (key) {
                watchUrl.searchParams.set("key", key)
              }
              if (nonce) {
                watchUrl.searchParams.set("nonce", nonce)
              }
              setWatchUrl(watchUrl.href)

              const abort = new AbortController()
              abortRef.current = abort
              fetch(url, {
                method: "PUT",
                body: transformStream.readable,
                signal: abort.signal,
                // @ts-expect-error duplex
                duplex: "half",
              })
                .then((res) => {
                  mediaStream.getTracks().forEach((track) => track.stop())
                  res.text().then((text) => setResp(text))
                })
                .catch((e) => {
                  console.error(e)
                  setResp(e.toString())
                  mediaStream.getTracks().forEach((track) => track.stop())
                })
                .finally(() => {
                  setIsStreamStarted(false)
                })
              mediaStream.getTracks().forEach((track) =>
                track.addEventListener("ended", () => {
                  abort.abort()
                  setIsStreamStarted(false)
                })
              )
            })
            .catch((e) => {
              setIsStreamStarted(false)
              if (e instanceof Error) {
                setResp(e.message)
              }
            })
        }}
      />

      {false && ( // TODO: fix cond
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
