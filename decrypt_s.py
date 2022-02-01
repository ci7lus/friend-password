from Crypto.Cipher import ChaCha20
from base64 import b64decode
from pathlib import Path

key = b64decode(input("key: ").encode())
cipher = ChaCha20.new(key=key, nonce=b64decode(input("nonce: ").encode()))

filepath = Path(input("filepath: "))
if not filepath.exists():
    raise FileNotFoundError(filepath)
dest = Path(str(filepath) + ".decrypted.mkv")
if dest.exists():
    if input("destination file exists. overwrite? [y/n]").lower() != "y":
        raise FileExistsError(dest)

with open(filepath, 'rb') as f:
    with open(dest, 'wb') as w:
        while True:
            data = f.read(2048 * 4)
            if not data:
                break
            w.write(cipher.decrypt(data))
