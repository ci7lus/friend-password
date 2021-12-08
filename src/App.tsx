import { useEffect, useState } from "react"
import { v4 as uuid } from "uuid"
import { isStreamUploadSupported } from "./stream"
import { base64ToUint8Array, uint8ArrayToBase64 } from "./utils"
import Worker from "./worker?worker"

const worker = new Worker()

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
    const key = localStorage.getItem("key")
    if (key !== null) {
      setEncryptKey(key)
    }
  }, [])
  const [resp, setResp] = useState("")
  const [encryptKey, setEncryptKey] = useState("")
  const [nonce, setNonce] = useState("")

  return (
    <div>
      <h1>Tomitake</h1>
      {isStreamUploadDisabled && (
        <div className="warn">
          <h3>Capture the flag!</h3>
          <div>
            <p>
              To use Tomitake, <code>ReadableStream</code> must be able to be
              sent by fetch.
            </p>
            <h4>For Chrome/Chromium Edge</h4>
            <p>
              Enable <code>Experimental Web Platfrom features</code> from{" "}
              <code>chrome://flags</code>.
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
          setResp("")
          try {
            const keyInArr = encryptKey ? base64ToUint8Array(encryptKey) : null
            if (keyInArr && keyInArr.byteLength !== 32) {
              throw new Error("key is not 32 bytes")
            }
            const nonceInArr = nonce ? base64ToUint8Array(nonce) : null
            if (nonceInArr && nonceInArr.byteLength !== 12) {
              throw new Error("nonce is not 12 bytes")
            }
            try {
              localStorage.setItem("last", url)
              if (encryptKey) {
                localStorage.setItem("key", encryptKey)
              }
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
                const recorder = new MediaRecorder(mediaStream)
                const readableStream = new ReadableStream({
                  start(ctrl) {
                    recorder.ondataavailable = async (e) => {
                      ctrl.enqueue(await e.data.arrayBuffer())
                    }
                    recorder.start(100)
                  },
                  cancel() {
                    recorder.stop()
                  },
                })
                const transformStream = new TransformStream()

                worker.postMessage(
                  {
                    key: keyInArr,
                    nonce: nonceInArr,
                    readable: readableStream,
                    writable: transformStream.writable,
                  },
                  [readableStream, transformStream.writable] as never[]
                )

                const abort = new AbortController()
                fetch(url, {
                  method: "PUT",
                  body: transformStream.readable,
                  signal: abort.signal,
                })
                  .then((res) => {
                    setIsDisabled(false)
                    mediaStream.getTracks().forEach((track) => track.stop())
                    res.text().then((text) => setResp(text))
                  })
                  .catch((e) => {
                    console.error(e)
                    setIsDisabled(false)
                    setResp(e.toString())
                    mediaStream.getTracks().forEach((track) => track.stop())
                  })
                mediaStream.getTracks().forEach((track) =>
                  track.addEventListener("ended", () => {
                    abort.abort()
                    setIsDisabled(false)
                  })
                )
              })
              .catch((e) => {
                setIsDisabled(false)
                if (e instanceof Error) {
                  setResp(e.message)
                }
              })
          } catch (e) {
            setIsDisabled(false)
            if (e instanceof Error) {
              setResp(e.message)
            }
          }
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
          required
        />
        <p>
          Specify the host where{" "}
          <a href="https://github.com/nwtgck/piping-server">
            nwtgck/piping-server
          </a>{" "}
          is running and the path where you want to serve it. It is easy to
          self-host by{" "}
          <a href="https://replit.com/@nwtgck/piping">forking with replit</a>.
        </p>
        <label htmlFor="encryptKey">Encryption key (32 bytes)</label>
        <input
          type="text"
          name="encryptKey"
          id="encryptKey"
          placeholder="Encryption key in Base64"
          value={encryptKey}
          onChange={(e) => {
            setEncryptKey(e.currentTarget.value)
          }}
          required={0 < nonce.length}
        />
        <label htmlFor="nonce">Nonce (12 bytes)</label>
        <input
          type="text"
          name="nonce"
          id="nonce"
          placeholder="Nonce in Base64"
          value={nonce}
          onChange={(e) => {
            setNonce(e.currentTarget.value)
          }}
          required={0 < encryptKey.length}
        />
        <p>
          You can encrypt the stream with Chacha20. If left blank, the stream
          will be sent unencrypted.
        </p>
        <div className="buttons">
          <input type="submit" value="Start" disabled={isDisabled} />
          <input
            type="button"
            value="Generate a path"
            disabled={isDisabled}
            onClick={() => {
              const u = new URL(url)
              u.pathname = uuid()
              setUrl(u.href)
            }}
          />
          <input
            type="button"
            value="Generate an encryption key"
            disabled={isDisabled}
            onClick={() => {
              const n = new Uint8Array(32)
              crypto.getRandomValues(n)
              setEncryptKey(uint8ArrayToBase64(n))
            }}
          />
          <input
            type="button"
            value="Generate a nonce"
            disabled={isDisabled}
            onClick={() => {
              const n = new Uint8Array(12)
              crypto.getRandomValues(n)
              setNonce(uint8ArrayToBase64(n))
            }}
          />
        </div>
      </form>
      {resp && (
        <div>
          <h3>Result</h3>
          <pre>
            <code>{resp}</code>
          </pre>
        </div>
      )}
      <div>
        <h2>How to watch</h2>
        <p>
          If you do not use encryption, you can directly watch mpv (IINA) or can
          be saved in ffmpeg.
        </p>
        <h3>Save with ffmpeg</h3>
        <code>ffmpeg -i "your stream url" -c copy output.mkv</code>
        <h3>Encryption</h3>
        <a href="https://github.com/ci7lus/tomitake#chacha20-decrypt">
          Watching an encrypted stream in mpv
        </a>
      </div>
      <hr />
      <a href="https://github.com/ci7lus/tomitake">Source code</a>
    </div>
  )
}

export default App
