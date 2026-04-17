"use client"

import type { GenerationMode, StudioChannel, VideoType } from "@/types/studio"
import { CHANNELS, FINAL_CARD_TYPES, GENERATION_MODES, VIDEO_TYPES } from "@/types/studio"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface StudioFormProps {
  brief: string
  onBriefChange: (v: string) => void
  contentType: VideoType
  onContentTypeChange: (v: VideoType) => void
  channel: StudioChannel
  onChannelChange: (v: StudioChannel) => void
  generationMode: GenerationMode
  onGenerationModeChange: (v: GenerationMode) => void
  ctaManual: string
  onCtaManualChange: (v: string) => void
  voiceSpeed: number
  onVoiceSpeedChange: (v: number) => void
  finalCardType: (typeof FINAL_CARD_TYPES)[number]
  onFinalCardTypeChange: (v: (typeof FINAL_CARD_TYPES)[number]) => void
  closingTemplateUrl: string
  onClosingTemplateUrlChange: (v: string) => void
  backgroundMusicUrl: string
  onBackgroundMusicUrlChange: (v: string) => void
  screenshotUrl: string
  onScreenshotUrlChange: (v: string) => void
  busy: boolean
  onGenerateData: () => void
  onGenerateAudio: () => void
  onRenderVideo: () => void
  onGenerateAll: () => void
  onSuggestIdea: () => void
  onSuggestCopy: () => void
  onLoadSample: () => void
  className?: string
}

const labelCls = "mb-1 block text-xs font-medium text-zinc-600"
const selectCls =
  "h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"

const NARRATIVE_TYPES_FOR_HINT = ["error", "motivacion", "datos_curiosos", "storytelling"] as const

export const StudioForm = ({
  brief,
  onBriefChange,
  contentType,
  onContentTypeChange,
  channel,
  onChannelChange,
  generationMode,
  onGenerationModeChange,
  ctaManual,
  onCtaManualChange,
  voiceSpeed,
  onVoiceSpeedChange,
  finalCardType,
  onFinalCardTypeChange,
  closingTemplateUrl,
  onClosingTemplateUrlChange,
  backgroundMusicUrl,
  onBackgroundMusicUrlChange,
  screenshotUrl,
  onScreenshotUrlChange,
  busy,
  onGenerateData,
  onGenerateAudio,
  onRenderVideo,
  onGenerateAll,
  onSuggestIdea,
  onSuggestCopy,
  onLoadSample,
  className,
}: StudioFormProps) => {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div>
        <label htmlFor="studio-brief" className={labelCls}>
          Brief / idea
        </label>
        <textarea
          id="studio-brief"
          value={brief}
          onChange={(e) => onBriefChange(e.target.value)}
          rows={4}
          placeholder="Ej: rotonda prioridad, señal PARE, nervios del examen..."
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Tipo de contenido</label>
          <select
            className={selectCls}
            value={contentType}
            onChange={(e) => onContentTypeChange(e.target.value as VideoType)}
          >
            {VIDEO_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Canal</label>
          <select
            className={selectCls}
            value={channel}
            onChange={(e) => onChannelChange(e.target.value as StudioChannel)}
          >
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Modo de generación</label>
          <select
            className={selectCls}
            value={generationMode}
            onChange={(e) => onGenerationModeChange(e.target.value as GenerationMode)}
          >
            {GENERATION_MODES.map((m) => (
              <option key={m} value={m}>
                {m === "parser" ? "parser (plantilla)" : "full_ai (copy más rico)"}
              </option>
            ))}
          </select>
          {generationMode === "full_ai" &&
          (NARRATIVE_TYPES_FOR_HINT as readonly string[]).includes(contentType) ? (
            <p className="mt-1.5 text-xs leading-snug text-violet-800">
              Con <span className="font-medium">full_ia</span> se genera HOOK → retención → contenido → CTA con OpenAI,
              sugerencias de imagen (inglés), stock Pexels/Unsplash, y TTS de 4 segmentos alineados a los frames.
            </p>
          ) : null}
        </div>
        <div>
          <label className={labelCls}>Velocidad de voz</label>
          <Input
            type="number"
            step={0.1}
            min={0.5}
            max={2}
            value={voiceSpeed}
            onChange={(e) => onVoiceSpeedChange(Number(e.target.value))}
            className="h-10 rounded-xl"
          />
        </div>
      </div>

      <div>
        <label htmlFor="studio-cta" className={labelCls}>
          CTA (texto manual)
        </label>
        <Input
          id="studio-cta"
          value={ctaManual}
          onChange={(e) => onCtaManualChange(e.target.value)}
          placeholder="Practicá gratis en la APP"
          className="h-10 rounded-xl"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Tipo de cierre (final card)</label>
          <select
            className={selectCls}
            value={finalCardType}
            onChange={(e) => onFinalCardTypeChange(e.target.value as (typeof FINAL_CARD_TYPES)[number])}
          >
            {FINAL_CARD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="studio-shot" className={labelCls}>
            URL captura app (opcional)
          </label>
          <Input
            id="studio-shot"
            value={screenshotUrl}
            onChange={(e) => onScreenshotUrlChange(e.target.value)}
            placeholder="https://..."
            className="h-10 rounded-xl"
          />
        </div>
      </div>

      <div>
        <label htmlFor="studio-close-url" className={labelCls}>
          URL plantilla de cierre (video/imagen)
        </label>
        <Input
          id="studio-close-url"
          value={closingTemplateUrl}
          onChange={(e) => onClosingTemplateUrlChange(e.target.value)}
          placeholder="Opcional — finalCard.backgroundUrl"
          className="h-10 rounded-xl"
        />
      </div>

      <div>
        <label htmlFor="studio-music" className={labelCls}>
          Música de fondo (URL, opcional)
        </label>
        <Input
          id="studio-music"
          value={backgroundMusicUrl}
          onChange={(e) => onBackgroundMusicUrlChange(e.target.value)}
          placeholder="https://..."
          className="h-10 rounded-xl"
        />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
        <Button type="button" className="h-9 text-sm" disabled={busy} onClick={onGenerateData}>
          Generar datos
        </Button>
        <Button type="button" variant="secondary" className="h-9 text-sm" disabled={busy} onClick={onGenerateAudio}>
          Generar audio (TTS)
        </Button>
        <Button type="button" variant="outline" className="h-9 text-sm" disabled={busy} onClick={onRenderVideo}>
          Render video
        </Button>
        <Button type="button" variant="secondary" className="h-9 text-sm" disabled={busy} onClick={onGenerateAll}>
          Generar todo
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="h-9 text-sm" disabled={busy} onClick={onSuggestIdea}>
          Sugerir idea
        </Button>
        <Button type="button" variant="outline" className="h-9 text-sm" disabled={busy} onClick={onSuggestCopy}>
          Sugerir copy de post
        </Button>
        <Button type="button" variant="secondary" className="h-9 text-sm" disabled={busy} onClick={onLoadSample}>
          Cargar ejemplo
        </Button>
      </div>
    </div>
  )
}
