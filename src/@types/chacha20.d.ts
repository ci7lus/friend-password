declare module "chacha20-universal" {
  export default class Chacha20 {
    constructor(nonce: Uint8Array, key: Uint8Array)
    update(output: Uint8Array, input: Uint8Array): void
    final(): void
  }
}
