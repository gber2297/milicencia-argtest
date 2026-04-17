import { AbsoluteFill } from "remotion"

import type { StudioBranding, StudioScene } from "@/types/studio"

interface SceneBackgroundProps {
  scene: StudioScene
  branding: StudioBranding
}

export const SceneBackground = ({ scene, branding }: SceneBackgroundProps) => {
  const { primaryColor, secondaryColor } = branding

  if (scene.backgroundType === "image" && (scene.backgroundUrl || scene.screenshotUrl)) {
    const url = scene.backgroundUrl || scene.screenshotUrl || ""
    return (
      <AbsoluteFill style={{ backgroundColor: secondaryColor }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="h-full w-full object-cover opacity-90" />
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg, ${secondaryColor}cc 0%, transparent 35%, ${secondaryColor}ee 100%)`,
          }}
        />
      </AbsoluteFill>
    )
  }

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(165deg, ${secondaryColor} 0%, ${primaryColor}55 45%, ${secondaryColor} 100%)`,
      }}
    />
  )
}
