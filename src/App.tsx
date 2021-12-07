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
    const nonce = localStorage.getItem("nonce")
    if (nonce !== null) {
      setNonce(nonce)
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
          setResp("")
          const keyInArr = base64ToUint8Array(encryptKey)
          if (keyInArr.byteLength !== 32) {
            throw new Error("key is not 32 bytes")
          }
          const nonceInArr = base64ToUint8Array(nonce)
          if (nonceInArr.byteLength !== 12) {
            throw new Error("nonce is not 12 bytes")
          }
          try {
            localStorage.setItem("last", url)
            if (encryptKey) {
              localStorage.setItem("key", encryptKey)
            }
            if (nonce) {
              localStorage.setItem("nonce", nonce)
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
          <a href="https://github.com/nwtgck/piping-server">
            nwtgck/piping-server
          </a>
          が動いているホストと配信を行いたいパスを指定してください。
          <a href="https://replit.com/@nwtgck/piping">replitでフォークする</a>
          と簡単にセルフホストできます。
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
          ストリームをChacha20で暗号化することができます。空欄にすると暗号化せずに送信します。
        </p>
        <div className="buttons">
          <input type="submit" value="開始" disabled={isDisabled} />
          <input
            type="button"
            value="パス生成"
            disabled={isDisabled}
            onClick={() => {
              const u = new URL(url)
              u.pathname = uuid()
              setUrl(u.href)
            }}
          />
          <input
            type="button"
            value="EncryptKey生成"
            disabled={isDisabled}
            onClick={() => {
              const n = new Uint8Array(32)
              crypto.getRandomValues(n)
              setEncryptKey(uint8ArrayToBase64(n))
            }}
          />
          <input
            type="button"
            value="Nonce生成"
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
          <h3>応答</h3>
          <pre>
            <code>{resp}</code>
          </pre>
        </div>
      )}
      <div>
        <h2>視聴方法</h2>
        <p>
          暗号化を行っていない場合は、直接mpv
          (IINA)で視聴したり、ffmpegで保存することができます。
        </p>
        <h3>ffmpegで保存する</h3>
        <code>ffmpeg -i "配信URL" -c copy output.mkv</code>
      </div>
      <hr />
      <a href="https://github.com/ci7lus/tomitake">ソースコード</a>
    </div>
  )
}

export default App
