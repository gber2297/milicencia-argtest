import { ListVideo } from "lucide-react"

import { buildSceneTimeline, calculateCompositionDuration } from "@/remotion/voice-timeline"
import { framesToSeconds } from "@/lib/studio/timing"
import type { VideoRuntime } from "@/types/studio"
import { cn } from "@/lib/utils"

interface SceneListProps {
  runtime: VideoRuntime
  currentFrame?: number
  className?: string
}

export const SceneList = ({ runtime, currentFrame = 0, className }: SceneListProps) => {
  const timeline = buildSceneTimeline(runtime)
  const total = calculateCompositionDuration(runtime)

  return (
    <div className={cn("rounded-xl border border-zinc-200 bg-white p-3", className)}>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <ListVideo className="size-3.5" aria-hidden />
        Escenas
      </div>
      <ul className="max-h-52 space-y-1 overflow-auto text-sm">
        {timeline.map(({ scene, from, durationInFrames }) => {
          const end = from + durationInFrames
          const active = currentFrame >= from && currentFrame < end
          const sec = framesToSeconds(durationInFrames, runtime.fps)
          return (
            <li
              key={scene.id}
              className={cn(
                "flex items-center justify-between rounded-lg px-2 py-1.5",
                active ? "bg-blue-50 text-blue-900" : "text-zinc-700",
              )}
            >
              <span className="truncate font-medium">
                <span className="text-zinc-400">{scene.type}</span> · {scene.id}
              </span>
              <span className="shrink-0 tabular-nums text-xs text-zinc-500">
                {durationInFrames}f · {sec.toFixed(1)}s
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 border-t border-zinc-100 pt-2 text-xs text-zinc-600">
        <span className="font-semibold text-zinc-800">{(total / runtime.fps).toFixed(1)}s</span> total · {total}{" "}
        frames · {runtime.fps} fps
        {(total / runtime.fps) >= 15 && (total / runtime.fps) <= 45 ? (
          <span className="ml-2 rounded-md bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800">lectura</span>
        ) : null}
      </p>
    </div>
  )
}
