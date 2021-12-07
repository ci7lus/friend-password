# Tomitake

[Experimental] Share screen with nwtgck/piping-server + ReadableStream + fetch + Stream encrypt(chacha20).

## Try

<https://tomitake.netlify.app>

## Chacha20 decrypt

Using [decrypt.py](./decrypt.py) to decrypt in a stream.

```bash
pip3 install requests pycryptodome
python3 decrypt.py -k 'your encryption key in base64' -n 'your nonce in base64' <your stream url> | mpv -
```

## Original idea

<https://github.com/nwtgck/piping-server-streaming-upload-htmls>

```

```
