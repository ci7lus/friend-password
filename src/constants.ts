export const MODE = {
  Stream: "stream",
  Watch: "watch",
} as const

export type MODE_TYPE = typeof MODE.Stream | typeof MODE.Watch

export const MODE_DISPLAY: Record<MODE_TYPE, string> = {
  [MODE.Stream]: "Stream",
  [MODE.Watch]: "Watch",
}

export const DEFAULT_CODEC = `video/webm; codecs="vp9,opus"`

export const CODECS = {
  V_VP9: "vp9",
  V_VP8: "vp8",
  A_OPUS: "opus",
}
