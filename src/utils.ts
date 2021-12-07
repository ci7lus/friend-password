// https://scrapbox.io/nwtgck/JavaScript%E3%81%A7Uint8Array_%E2%87%84_Base64%E6%96%87%E5%AD%97%E5%88%97%E3%81%AE%E7%9B%B8%E4%BA%92%E5%A4%89%E6%8F%9B

// (from: https://stackoverflow.com/a/11562550/2885946)
export function uint8ArrayToBase64(uint8Array: Uint8Array) {
  return btoa(String.fromCharCode(...uint8Array))
}

// https://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
export function base64ToUint8Array(base64Str: string) {
  return Uint8Array.from(atob(base64Str), (c) => c.charCodeAt(0))
}
