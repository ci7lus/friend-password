import {
  Anchor,
  Center,
  Container,
  Footer,
  SegmentedControl,
  Title,
} from "@mantine/core"
import { useEffect, useState } from "react"
import { Stream } from "./components/Stream"
import { Watch } from "./components/Watch"
import { MODE, MODE_DISPLAY, MODE_TYPE } from "./constants"
import { useLocalLocalStorage } from "./use-local-local-storage"

function App() {
  const [mode, setMode] = useLocalLocalStorage<MODE_TYPE>({
    key: "mode",
    defaultValue: MODE.Stream,
  })
  const [isModeLocked, setIsModeLocked] = useState(false)
  useEffect(() => {
    const url = new URL(location.href)
    const mode = url.searchParams.get("mode")
    if (mode) {
      const modeDetermined =
        mode?.toLowerCase() === MODE.Watch ? MODE.Watch : MODE.Stream
      setMode(modeDetermined)
    }
  }, [])
  useEffect(() => {
    if (!isModeLocked) {
      return
    }
    const handleEvent = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", handleEvent)
    return () => {
      window.removeEventListener("beforeunload", handleEvent)
    }
  }, [isModeLocked])

  return (
    <Container>
      <Title order={1} mt="xl">
        friend-password
      </Title>
      <Title order={2} size="lg" mb="lg">
        Share screen with{" "}
        <Anchor href="https://github.com/nwtgck/piping-server" target="_blank">
          nwtgck/piping-server
        </Anchor>{" "}
        + ReadableStream + fetch.
      </Title>

      <Center mb="md">
        <SegmentedControl
          value={mode}
          onChange={(s) => setMode(s as MODE_TYPE)}
          data={[
            {
              label: MODE_DISPLAY[MODE.Stream],
              value: MODE.Stream,
            },
            {
              label: MODE_DISPLAY[MODE.Watch],
              value: MODE.Watch,
            },
          ]}
          disabled={isModeLocked}
        />
      </Center>

      {mode === MODE.Stream ? (
        <Stream setIsModeLocked={setIsModeLocked} />
      ) : (
        <Watch setIsModeLocked={setIsModeLocked} />
      )}

      <Footer height="md" my="md" pt="sm">
        <Center>
          <Anchor href="https://friend-password.netlify.app/" target="_blank">
            friend-password
          </Anchor>
          ・
          <Anchor
            href="https://github.com/ci7lus/friend-password"
            target="_blank"
          >
            Source code
          </Anchor>
        </Center>
      </Footer>
    </Container>
  )
}

export default App
