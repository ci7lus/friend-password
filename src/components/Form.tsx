import {
  TextInput,
  Button,
  Group,
  Box,
  Text,
  Anchor,
  ActionIcon,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { IconRotateClockwise, IconX } from "@tabler/icons"
import { useEffect } from "react"
import { v4 as uuid } from "uuid"
import { MODE, MODE_TYPE } from "../constants"
import { useLocalLocalStorage } from "../use-local-local-storage"
import { base64ToUint8Array, uint8ArrayToBase64 } from "../utils"

export const Form: React.FC<{
  mode: MODE_TYPE
  isActionStarted: boolean
  onSubmitHandle: (_: { url: string; key: string; nonce: string }) => unknown
}> = ({ mode, isActionStarted, onSubmitHandle }) => {
  const [url, setUrl] = useLocalLocalStorage<string>({
    key: "last",
    defaultValue: `https://ppng.io/${uuid()}`,
  })
  const [key, setKey] = useLocalLocalStorage<string>({
    key: "key",
    defaultValue: "",
  })
  const [nonce, setNonce] = useLocalLocalStorage<string>({
    key: "nonce",
    defaultValue: "",
  })
  const form = useForm({
    initialValues: {
      url,
      key,
      nonce,
    },

    validate: {
      url: (value) => {
        try {
          new URL(value)
          return null
        } catch (error) {
          return "Invalid URL"
        }
      },
      key: (value) => {
        if (!value) {
          return null
        }
        try {
          const key = base64ToUint8Array(value)
          return key.length === 32 ? null : "Invalid key length (!=32)"
        } catch {
          return "Invalid Key"
        }
      },
      nonce: (value) => {
        if (!value) {
          return null
        }
        try {
          const nonce = base64ToUint8Array(value)
          return nonce.length === 12 ? null : "Invalid nonce length (!=12)"
        } catch {
          return "Invalid Nonce"
        }
      },
    },
  })
  useEffect(() => {
    form.setValues({ url, key, nonce })
  }, [url, key, nonce])

  return (
    <Box>
      <form
        onSubmit={form.onSubmit((values) => {
          setUrl(values.url)
          setKey(values.key)
          setNonce(values.nonce)
          onSubmitHandle(values)
        })}
      >
        <TextInput
          type="text"
          name="url"
          id="url"
          placeholder="https://ppng.io/my-screen-share"
          value={url}
          required
          withAsterisk
          label="Piping URL"
          size="md"
          rightSection={
            mode === MODE.Stream ? (
              <ActionIcon
                disabled={isActionStarted}
                onClick={() => {
                  const u = new URL(url)
                  u.pathname = uuid()
                  form.setFieldValue("url", u.href)
                }}
                mr="xs"
              >
                <IconRotateClockwise fontSize="sm" />
              </ActionIcon>
            ) : undefined
          }
          {...form.getInputProps("url")}
        />
        <Text size="sm">
          Specify the host where{" "}
          <Anchor href="https://github.com/nwtgck/piping-server">
            nwtgck/piping-server
          </Anchor>{" "}
          is running and the path where you want to serve it. It is easy to
          self-host by{" "}
          <Anchor href="https://replit.com/@nwtgck/piping">
            forking with replit
          </Anchor>
          .
        </Text>
        <TextInput
          type="text"
          name="key"
          placeholder="Encryption key in Base64"
          required={0 < form.values.nonce.length}
          label="Encryption key (32 bytes)"
          rightSection={
            <Group spacing="xs" mr="xs">
              {mode === MODE.Stream ? (
                <ActionIcon
                  disabled={isActionStarted}
                  onClick={() => {
                    const n = new Uint8Array(32)
                    crypto.getRandomValues(n)
                    form.setFieldValue("key", uint8ArrayToBase64(n))
                  }}
                >
                  <IconRotateClockwise fontSize="sm" />
                </ActionIcon>
              ) : (
                <></>
              )}
              <ActionIcon
                disabled={isActionStarted}
                onClick={() => form.setFieldValue("key", "")}
              >
                <IconX fontSize="sm" />
              </ActionIcon>
            </Group>
          }
          rightSectionWidth="md"
          size="md"
          autoComplete="hidden"
          {...form.getInputProps("key")}
        />
        <TextInput
          type="text"
          name="nonce"
          placeholder="Nonce in Base64"
          required={0 < form.values.key.length}
          label="Nonce (12 bytes)"
          rightSection={
            <Group spacing="xs" mr="xs">
              {mode === MODE.Stream ? (
                <ActionIcon
                  disabled={isActionStarted}
                  onClick={() => {
                    const n = new Uint8Array(12)
                    crypto.getRandomValues(n)
                    form.setFieldValue("nonce", uint8ArrayToBase64(n))
                  }}
                >
                  <IconRotateClockwise fontSize="sm" />
                </ActionIcon>
              ) : (
                <></>
              )}
              <ActionIcon
                disabled={isActionStarted}
                onClick={() => form.setFieldValue("nonce", "")}
              >
                <IconX fontSize="sm" />
              </ActionIcon>
            </Group>
          }
          rightSectionWidth="md"
          size="md"
          autoComplete="hidden"
          {...form.getInputProps("nonce")}
        />
        {mode === MODE.Stream && (
          <Text size="sm">
            You can encrypt the stream with Chacha20. If left blank, the stream
            will be sent unencrypted.
          </Text>
        )}

        <Group position="right" mt="md">
          <Button
            type="submit"
            size="md"
            color={isActionStarted ? "red" : "primary"}
          >
            {isActionStarted
              ? "Stop"
              : mode === MODE.Stream
              ? "Start"
              : "Watch"}{" "}
            stream
          </Button>
        </Group>
      </form>
    </Box>
  )
}
