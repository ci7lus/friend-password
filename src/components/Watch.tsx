import { Box, Code, Title } from "@mantine/core"
import { useRef, useState } from "react"
import { MODE } from "../constants"
import { base64ToUint8Array } from "../utils"
import { Form } from "./Form"

export const Watch: React.FC<{
  setIsModeLocked: React.Dispatch<React.SetStateAction<boolean>>
}> = () => {
  const [isStreamStarted] = useState(false)
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
