export const MODE = {
  Stream: "Stream",
  Watch: "Watch",
} as const

export type MODE_TYPE = typeof MODE.Stream | typeof MODE.Watch
