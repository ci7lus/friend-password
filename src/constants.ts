export const MODE = {
  Stream: "stream",
  Watch: "watch",
} as const

export type MODE_TYPE = typeof MODE.Stream | typeof MODE.Watch

export const MODE_DISPLAY: Record<MODE_TYPE, string> = {
  [MODE.Stream]: "Stream",
  [MODE.Watch]: "Watch",
}

export const CODEC = `video/webm; codecs="vp9,opus"`
