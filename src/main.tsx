import { MantineProvider } from "@mantine/core"
import React from "react"
import { createRoot } from "react-dom/client"
import App from "./App"

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{ colorScheme: "dark", lineHeight: 2 }}
    >
      <App />
    </MantineProvider>
  </React.StrictMode>
)
