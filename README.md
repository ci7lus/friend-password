# friend-password

\[PoC] Share screen with [nwtgck/piping-server](https://github.com/nwtgck/piping-server) + ReadableStream + fetch + Stream encrypt(chacha20).

[![Image from Gyazo](https://i.gyazo.com/1a301ef60cc4e2d08df136f817520a0a.png)](https://gyazo.com/1a301ef60cc4e2d08df136f817520a0a)

## Try

<https://friend-password.netlify.app>

## Decrypt in CLI

### streaming decrypt

Using [decrypt.py](./decrypt.py) to decrypt in a stream.

```bash
pip3 install requests pycryptodome
python3 decrypt.py -k 'your encryption key in base64' -n 'your nonce in base64' <your stream url> | mpv -
```

### decrypt after transferred

Using [decrypt_s.py](./decrypt_s.py) to decrypt in a stream.

```bash
pip3 install pycryptodome
python3 decrypt_s.py
```

## Original idea

<https://github.com/nwtgck/piping-server-streaming-upload-htmls>
