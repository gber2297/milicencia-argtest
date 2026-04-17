import { interpolate, useCurrentFrame } from "remotion"

export function useSceneFade(durationInFrames: number, edge = 12) {
  const frame = useCurrentFrame()
  const fadeIn = interpolate(frame, [0, edge], [0, 1], { extrapolateRight: "clamp" })
  const fadeOut = interpolate(
    frame,
    [durationInFrames - edge, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" },
  )
  return Math.min(fadeIn, fadeOut)
}
