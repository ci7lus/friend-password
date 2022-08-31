import {
  Anchor,
  Center,
  Container,
  Divider,
  SegmentedControl,
  Title,
} from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"
import { Stream } from "./components/Stream"
import { Watch } from "./components/Watch"
import { MODE, MODE_TYPE } from "./constants"

function App() {
  const [mode, setMode] = useLocalStorage<MODE_TYPE>({
    key: "mode",
    defaultValue: MODE.Stream,
  })

  return (
    <Container>
      <Title order={1} mt="xl" mb="xs">
        Tomitake
      </Title>

      <Center mb="md">
        <SegmentedControl
          value={mode}
          onChange={(s) => setMode(s as keyof typeof MODE)}
          data={[
            {
              label: MODE.Stream,
              value: MODE.Stream,
            },
            {
              label: MODE.Watch,
              value: MODE.Watch,
            },
          ]}
        />
      </Center>

      {mode === MODE.Stream ? <Stream /> : <Watch />}

      <Divider my="md" />
      <Anchor href="https://github.com/ci7lus/tomitake">Source code</Anchor>
    </Container>
  )
}

export default App
