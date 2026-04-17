"use client"

import "@/remotion/remotion-fonts-root.css"

import { Player } from "@remotion/player"
import { AlertCircle } from "lucide-react"

import { VideoComposition } from "@/remotion/VideoComposition"
import { calculateCompositionDuration } from "@/remotion/voice-timeline"
import type { VideoRuntime } from "@/types/studio"
import { cn } from "@/lib/utils"

interface StudioPreviewProps {
  runtime: VideoRuntime
  validationErrors: string[]
  className?: string
}

export const StudioPreview = ({ runtime, validationErrors, className }: StudioPreviewProps) => {
  const durationInFrames = calculateCompositionDuration(runtime)
  const hasError = validationErrors.length > 0

  const canPlay = durationInFrames > 0 && !hasError

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {hasError && (
        <div
          className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <ul className="list-inside list-disc space-y-0.5">
            {validationErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div
        className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 shadow-xl"
        style={{ aspectRatio: "9 / 16" }}
      >
        {canPlay ? (
          <Player
            acknowledgeRemotionLicense
            component={VideoComposition}
            inputProps={{ runtime }}
            durationInFrames={durationInFrames}
            fps={runtime.fps}
            compositionWidth={runtime.width}
            compositionHeight={runtime.height}
            controls
            style={{ width: "100%", height: "100%" }}
            numberOfSharedAudioTags={12}
            initiallyMuted={false}
          />
        ) : (
          <div className="flex h-full min-h-[420px] items-center justify-center px-4 text-center text-sm text-zinc-400">
            {hasError ? "Corregí el runtime para previsualizar" : "Sin escenas para mostrar"}
          </div>
        )}
      </div>
    </div>
  )
}
