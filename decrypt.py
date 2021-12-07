from Crypto.Cipher import ChaCha20
from base64 import b64decode
import requests
import argparse
import sys

parser = argparse.ArgumentParser()
parser.add_argument("url", help="piping url to decrypt")
parser.add_argument("-k", "--key", help="encryption key in base64")
parser.add_argument("-n", "--nonce", help="nonce in base64")


def main():
    args = parser.parse_args()
    key = b64decode(args.key)
    nonce = b64decode(args.nonce)
    cipher = ChaCha20.new(key=key, nonce=nonce)
    with requests.get(args.url, stream=True) as r:
        for chunk in r.iter_content(chunk_size=4096):
            sys.stdout.buffer.write(cipher.decrypt(chunk))


if __name__ == "__main__":
    main()
