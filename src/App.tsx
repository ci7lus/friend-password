import { useEffect, useState } from "react"
import { isStreamUploadSupported, mediaStreamToReadableStream } from "./stream"

function App() {
  const [url, setUrl] = useState("")
  const [isDisabled, setIsDisabled] = useState(false)
  const [isStreamUploadDisabled, setIsStreamUploadDisabled] = useState(false)
  useEffect(() => {
    isStreamUploadSupported().then((detected) =>
      setIsStreamUploadDisabled(!detected)
    )
    const last = localStorage.getItem("last")
    if (last !== null) {
      setUrl(last)
    }
  }, [])

  return (
    <div>
      <h1>Tomitake</h1>
      {isStreamUploadDisabled && (
        <div className="warn">
          <h3>必要な機能が利用できない可能性があります</h3>
          <div>
            <p>
              Tomitakeを利用するには、<code>ReadableStream</code>が
              <code>fetch</code>で送信できる必要があります。
            </p>
            <h4>Chrome/Chromium Edgeの場合</h4>
            <p>
              <code>chrome://flags</code>から
              <code>Experimental Web Platfrom features</code>を有効化します。
            </p>
            <img
              src="https://i.gyazo.com/d89af071fe52c9fa0275edfe9f3e5431.png"
              alt="Image from Gyazo"
              width="731"
            />
          </div>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setIsDisabled(true)
          try {
            localStorage.setItem("last", url)
          } catch {}
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
              const readableStream = mediaStreamToReadableStream(
                mediaStream,
                100
              )

              const abort = new AbortController()

              fetch(url, {
                method: "PUT",
                body: readableStream,
                signal: abort.signal,
              })
                .then(() => {
                  setIsDisabled(false)
                  mediaStream.getTracks().forEach((track) => track.stop())
                })
                .catch((e) => {
                  console.error(e)
                  setIsDisabled(false)
                  mediaStream.getTracks().forEach((track) => track.stop())
                })
              mediaStream.getTracks().forEach((track) =>
                track.addEventListener("ended", () => {
                  abort.abort()
                  setIsDisabled(false)
                })
              )
            })
            .catch(() => setIsDisabled(false))
        }}
      >
        <label htmlFor="url">Piping URL</label>
        <input
          type="text"
          name="url"
          id="url"
          placeholder="https://ppng.io/my-screen-share"
          value={url}
          onChange={(e) => {
            setUrl(e.currentTarget.value)
          }}
        />
        <p>
          <a href="https://github.com/nwtgck/piping-server">
            nwtgck/piping-server
          </a>
          が動いているホストと配信を行いたいパスを指定してください。
          <a href="https://replit.com/@nwtgck/piping">replitでフォークする</a>
          と簡単にセルフホストできます。
        </p>
        <input type="submit" value="開始" disabled={isDisabled} />
      </form>
    </div>
  )
}

export default App
