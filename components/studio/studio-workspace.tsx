"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Clapperboard, Sparkles, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RuntimeEditor } from "@/components/studio/RuntimeEditor"
import { SceneList } from "@/components/studio/SceneList"
import { StudioForm } from "@/components/studio/StudioForm"
import { StudioPreview } from "@/components/studio/StudioPreview"
import {
  applyVoiceTimingToScenes,
  clampRuntimeToMaxSeconds,
  cloneRuntime,
  defaultBranding,
  normalizeSceneDurations,
} from "@/lib/studio/runtime"
import { generateFromContentType, generateSampleRuntime, generateSampleRuntimeForType } from "@/lib/studio/generators"
import { calculateTotalFrames, validateRuntime } from "@/lib/studio/validation"
import type { GenerationMode, StudioChannel, VideoType } from "@/types/studio"
import { FINAL_CARD_TYPES } from "@/types/studio"
import type { VideoRuntime } from "@/types/studio"

const STORAGE_KEY = "studio-runtime-draft"
const HISTORY_KEY = "studio-history"

const QUICK_PRESETS: { label: string; type: VideoType; hint: string }[] = [
  { label: "Quiz rotonda", type: "quiz", hint: "Hook fuerte + pausa + reveal" },
  { label: "Error PARE", type: "error", hint: "Mito vs realidad" },
  { label: "Motivación", type: "motivacion", hint: "Emoción + acción" },
  { label: "App promo", type: "app", hint: "Screenshot + CTA" },
  { label: "Marketing IA", type: "marketing", hint: "5 escenas + OpenAI + stock (ver bloque abajo)" },
]

function loadDraft(): VideoRuntime | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as VideoRuntime
    const v = validateRuntime(parsed)
    if (!v.ok) return null
    return { ...parsed, branding: { ...defaultBranding(), ...parsed.branding } }
  } catch {
    return null
  }
}

function saveDraft(runtime: VideoRuntime) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runtime))
  } catch {
    /* ignore */
  }
}

function pushHistory(runtime: VideoRuntime) {
  try {
    const prev = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as VideoRuntime[]
    const next = [runtime, ...prev].slice(0, 20)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

const DEFAULT_BRIEF = "Rotonda: ¿quién tiene prioridad al entrar?"

export const StudioWorkspace = () => {
  const seed = useMemo(() => normalizeSceneDurations(generateSampleRuntime()), [])
  const [runtime, setRuntime] = useState<VideoRuntime>(seed)
  const [runtimeVersion, setRuntimeVersion] = useState(0)
  const [brief, setBrief] = useState(seed.meta?.brief ?? DEFAULT_BRIEF)
  const [contentType, setContentType] = useState<VideoType>(seed.videoType)
  const [channel, setChannel] = useState<StudioChannel>(seed.channel)
  const [generationMode, setGenerationMode] = useState<GenerationMode>(seed.meta?.generationMode ?? "parser")
  const [ctaManual, setCtaManual] = useState(seed.cta.text)
  const [voiceSpeed, setVoiceSpeed] = useState(seed.voiceSpeed)
  const [finalCardType, setFinalCardType] = useState<(typeof FINAL_CARD_TYPES)[number]>(seed.finalCard.type)
  const [closingTemplateUrl, setClosingTemplateUrl] = useState(seed.finalCard.backgroundUrl)
  const [backgroundMusicUrl, setBackgroundMusicUrl] = useState(seed.music.url)
  const [screenshotUrl, setScreenshotUrl] = useState("")
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  /** Caption para TikTok / Blotato (editable; se rellena con IA). */
  const [postCaption, setPostCaption] = useState("")
  const [marketingTemplates, setMarketingTemplates] = useState<{ id: string; name: string }[]>([])
  const [marketingTemplateId, setMarketingTemplateId] = useState("five_beat")

  useEffect(() => {
    fetch("/api/studio/marketing-templates")
      .then((res) => res.json())
      .then((d: { templates?: { id: string; name: string }[] }) => setMarketingTemplates(d.templates ?? []))
      .catch(() => setMarketingTemplates([]))
  }, [])

  useEffect(() => {
    const draft = loadDraft()
    if (!draft) return
    const normalized = normalizeSceneDurations({
      ...draft,
      branding: { ...defaultBranding(), ...draft.branding },
    })
    setRuntime(normalized)
    setBrief(draft.meta?.brief ?? DEFAULT_BRIEF)
    setContentType(draft.videoType)
    setChannel(draft.channel)
    setGenerationMode(draft.meta?.generationMode ?? "parser")
    setCtaManual(draft.cta.text)
    setVoiceSpeed(draft.voiceSpeed)
    setFinalCardType(draft.finalCard.type)
    setClosingTemplateUrl(draft.finalCard.backgroundUrl)
    setBackgroundMusicUrl(draft.music.url)
    const shot = draft.scenes.find((s) => s.type === "screenshot_focus")
    setScreenshotUrl((shot?.screenshotUrl ?? shot?.backgroundUrl ?? "").trim())
    setRuntimeVersion((v) => v + 1)
  }, [])

  const validation = useMemo(() => validateRuntime(runtime), [runtime])
  const totalSeconds = useMemo(() => {
    const f = calculateTotalFrames(runtime.scenes)
    return f / runtime.fps
  }, [runtime])

  const bumpRuntime = useCallback((next: VideoRuntime) => {
    const normalized = normalizeSceneDurations(next)
    setRuntime(normalized)
    setRuntimeVersion((v) => v + 1)
    saveDraft(normalized)
  }, [])

  const mergeFormIntoRuntime = useCallback(
    (base: VideoRuntime, overrides?: { videoType?: VideoType }): VideoRuntime => {
      const r = cloneRuntime(base)
      r.branding = { ...defaultBranding(), ...r.branding }
      r.videoType = overrides?.videoType ?? contentType
      r.channel = channel
      r.voiceSpeed = voiceSpeed
      r.cta = { ...r.cta, text: ctaManual || r.cta.text }
      r.finalCard = {
        ...r.finalCard,
        type: finalCardType,
        backgroundUrl: closingTemplateUrl || r.finalCard.backgroundUrl,
      }
      r.music = {
        enabled: Boolean(backgroundMusicUrl.trim()),
        url: backgroundMusicUrl.trim(),
      }
      r.meta = { ...r.meta, brief, generationMode }
      const ct = overrides?.videoType ?? contentType
      if (ct === "app" && screenshotUrl.trim()) {
        r.scenes = r.scenes.map((s) =>
          s.type === "screenshot_focus"
            ? { ...s, screenshotUrl: screenshotUrl.trim(), backgroundUrl: screenshotUrl.trim() }
            : s,
        )
      }
      return r
    },
    [
      backgroundMusicUrl,
      brief,
      channel,
      closingTemplateUrl,
      contentType,
      ctaManual,
      finalCardType,
      generationMode,
      screenshotUrl,
      voiceSpeed,
    ],
  )

  const api = async (path: string, body: unknown) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    if (!res.ok) {
      let msg = text
      try {
        const j = JSON.parse(text) as {
          detail?: string
          error?: unknown
          code?: string
          log?: string
          steps?: unknown
        }
        const errStr =
          typeof j.error === "string"
            ? j.error
            : j.error !== undefined
              ? JSON.stringify(j.error).slice(0, 600)
              : ""
        const logStr = typeof j.log === "string" ? j.log.trim().slice(0, 1200) : ""
        const stepsStr = Array.isArray(j.steps) ? j.steps.map(String).join(" → ") : ""
        msg = [errStr || undefined, j.detail, logStr ? `Log: ${logStr}` : undefined, stepsStr ? `Pasos: ${stepsStr}` : undefined]
          .filter(Boolean)
          .join(" · ")
        if (!msg.trim()) msg = text
        if (!msg.trim()) msg = `HTTP ${res.status} ${path}`
        if (j.code) msg = `${msg} [${String(j.code)}]`
      } catch {
        if (!msg.trim()) msg = `HTTP ${res.status} ${path}`
      }
      throw new Error(msg)
    }
    return JSON.parse(text) as Record<string, unknown>
  }

  const onGenerateData = async () => {
    setBusy(true)
    setToast(null)
    try {
      const data = await api("/api/studio/generate-from-text", {
        brief,
        contentType,
        channel,
        generationMode,
        cta: ctaManual,
        finalCard: { type: finalCardType, backgroundUrl: closingTemplateUrl },
        voiceSpeed,
        screenshotUrl: contentType === "app" ? screenshotUrl : undefined,
      })
      const r = data.runtime as VideoRuntime
      bumpRuntime(mergeFormIntoRuntime(r))
      setToast("Runtime generado")
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  const onGenerateAudio = async () => {
    setBusy(true)
    setToast(null)
    try {
      const merged = mergeFormIntoRuntime(runtime)
      const data = await api("/api/studio/generate-audio", { runtime: merged })
      const r = data.runtime as VideoRuntime
      bumpRuntime(r)
      setToast("TTS + frames + música generados (Edge)")
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  const onRenderVideo = async () => {
    setBusy(true)
    setToast(null)
    try {
      const merged = mergeFormIntoRuntime(runtime)
      const data = await api("/api/studio/render-video", { runtime: merged })
      const note = String(data.note ?? "")
      if (data.publicPath) setToast(`Job: ${String(data.publicPath)} — ${note}`)
      else setToast(note || "Render encolado")
      pushHistory(merged)
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  const onGenerateAll = async () => {
    setBusy(true)
    setToast(null)
    try {
      const data = await api("/api/studio/generate-all", {
        brief,
        contentType,
        channel,
        generationMode,
        cta: ctaManual,
        finalCard: { type: finalCardType, backgroundUrl: closingTemplateUrl },
        voiceSpeed,
        screenshotUrl: contentType === "app" ? screenshotUrl : undefined,
      })
      const r = data.runtime as VideoRuntime
      bumpRuntime(mergeFormIntoRuntime(r))
      const render = data.render as {
        note?: string
        publicPath?: string
        mp4OutRelative?: string
      } | undefined
      const note = render?.note ? String(render.note) : ""
      const path = render?.mp4OutRelative
        ? String(render.mp4OutRelative)
        : render?.publicPath
          ? String(render.publicPath)
          : ""
      setToast(path ? `Listo — ${path}${note ? ` · ${note}` : ""}` : `Escenas + TTS + render: ${note || "ok"}`)
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  const onSuggestIdea = async () => {
    setBusy(true)
    setSuggestion(null)
    try {
      const data = await api("/api/studio/suggest-idea", { theme: "examen_conducir_argentina", channel })
      setSuggestion(String(data.idea ?? ""))
    } catch {
      setSuggestion("No se pudo sugerir.")
    } finally {
      setBusy(false)
    }
  }

  const onSuggestCopy = async () => {
    setBusy(true)
    setSuggestion(null)
    try {
      const data = await api("/api/studio/suggest-post-copy", {
        runtime: mergeFormIntoRuntime(runtime),
        channel,
        summary: brief,
      })
      const copy = String(data.copy ?? "")
      setSuggestion(copy)
      setPostCaption(copy)
      setToast(data.warning ? String(data.warning) : "Copy de post listo")
    } catch (e) {
      setSuggestion("No se pudo sugerir copy.")
      setToast(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  const onGenerateTiktokCopy = async () => {
    setBusy(true)
    setToast(null)
    try {
      const data = await api("/api/studio/suggest-post-copy", {
        runtime: mergeFormIntoRuntime(runtime),
        channel: "tiktok",
        summary: brief,
      })
      const copy = String(data.copy ?? "")
      setPostCaption(copy)
      setSuggestion(copy)
      setToast(data.warning ? String(data.warning) : "Copy TikTok optimizado (IA)")
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Error al generar copy")
    } finally {
      setBusy(false)
    }
  }

  const onUploadBlotato = async () => {
    setBusy(true)
    setToast(null)
    try {
      const videoType = contentType === "marketing" ? "marketing" : "studio"
      const data = await api("/api/studio/upload-blotato", {
        prepare: true,
        runtime: mergeFormIntoRuntime(runtime),
        brief,
        caption: postCaption.trim() || undefined,
        platform: "tiktok",
        videoType,
      })
      const cap = data.caption != null ? String(data.caption) : ""
      if (cap) {
        setPostCaption(cap)
        setSuggestion(cap)
      }
      const url = data.publicUrl != null ? String(data.publicUrl) : ""
      const postId = data.postId != null ? String(data.postId) : ""
      const steps = Array.isArray(data.steps) ? data.steps.map(String).join(" → ") : ""
      setToast(
        [
          url ? `Blotato: ${url}${postId ? ` · post ${postId}` : ""}` : "Subida enviada a Blotato",
          steps ? `(${steps})` : "",
        ]
          .filter(Boolean)
          .join(" "),
      )
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Error al subir")
    } finally {
      setBusy(false)
    }
  }

  const onLoadSample = () => {
    const s = generateSampleRuntime()
    setBrief(s.meta?.brief ?? brief)
    bumpRuntime(mergeFormIntoRuntime(s))
    setToast("Ejemplo cargado")
  }

  const onGenerateMarketing = async () => {
    setBusy(true)
    setToast(null)
    try {
      const data = await api("/api/studio/generate-marketing", {
        templateId: marketingTemplateId,
        brief,
        channel,
      })
      const r = data.runtime as VideoRuntime
      setContentType("marketing")
      bumpRuntime(mergeFormIntoRuntime(r, { videoType: "marketing" }))
      setToast("Marketing: guion IA + imágenes stock → `src/data/runtime-marketing.json`")
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  const onGenerateMarketingAll = async () => {
    setBusy(true)
    setToast(null)
    try {
      const data = await api("/api/studio/generate-marketing-all", {
        templateId: marketingTemplateId,
        brief,
        channel,
      })
      const r = data.runtime as VideoRuntime
      setContentType("marketing")
      bumpRuntime(mergeFormIntoRuntime(r, { videoType: "marketing" }))
      const render = data.render as {
        note?: string
        publicPath?: string
        mp4OutRelative?: string
      } | undefined
      const note = render?.note ? String(render.note) : ""
      const path = render?.mp4OutRelative
        ? String(render.mp4OutRelative)
        : render?.publicPath
          ? String(render.publicPath)
          : ""
      setToast(path ? `Marketing listo — ${path}${note ? ` · ${note}` : ""}` : `Marketing + TTS: ${note || "ok"}`)
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  const applyPreset = (type: VideoType) => {
    const s = generateSampleRuntimeForType(type)
    setContentType(type)
    setBrief(s.meta?.brief ?? brief)
    bumpRuntime(mergeFormIntoRuntime(s, { videoType: type }))
    setToast(`Plantilla ${type} lista`)
  }

  const applyTimingLocal = () => {
    const merged = mergeFormIntoRuntime(runtime)
    const timed = applyVoiceTimingToScenes(merged)
    bumpRuntime(clampRuntimeToMaxSeconds(timed, 40))
    setToast("Timing local (máx. 40s)")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900">
            <Clapperboard className="size-7 text-blue-600" aria-hidden />
            Video Studio
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Videos verticales con ritmo de lectura pausado (≈18–40s típico en quiz). El preview reproduce el audio del runtime (MP3 en{" "}
            <code className="font-mono text-[11px]">public/audio</code> tras generar TTS).
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/studio/history" className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50">
            Historial
          </Link>
          <Link href="/studio/templates" className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50">
            Plantillas
          </Link>
          <Link href="/studio/runtime" className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50">
            Runtime JSON
          </Link>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <Sparkles className="size-4 shrink-0" aria-hidden />
          {toast}
        </div>
      )}
      {suggestion && (
        <div className="rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-800 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Sugerencia</p>
          <p className="mt-1 whitespace-pre-wrap">{suggestion}</p>
        </div>
      )}

      <Card className="border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Inicio rápido</p>
            <p className="text-xs text-zinc-600">
              Duración actual:{" "}
              <span className="font-mono font-semibold text-zinc-800">{totalSeconds.toFixed(1)}s</span>
              {totalSeconds >= 15 && totalSeconds <= 45 ? (
                <span className="ml-2 text-emerald-700">· ritmo lectura</span>
              ) : null}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              «Generar todo» ejecuta escenas → TTS → Remotion y guarda el MP4 en{" "}
              <code className="font-mono text-[11px]">out/studio-YYYYMMDD-HHMMSS.mp4</code>. También podés usar solo{" "}
              <span className="font-medium text-zinc-700">Generar audio (TTS)</span> con el runtime actual.
            </p>
          </div>
          <Button
            type="button"
            className="h-10 shrink-0 px-5 text-sm font-semibold shadow-sm shadow-blue-600/20"
            disabled={busy}
            onClick={onGenerateAll}
          >
            Generar video listo (1 clic)
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="w-full text-xs font-medium text-zinc-500 sm:w-auto">Plantillas:</span>
          {QUICK_PRESETS.map((p) => (
            <button
              key={p.type}
              type="button"
              disabled={busy}
              title={p.hint}
              onClick={() => applyPreset(p.type)}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/80 disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="border-violet-200/80 bg-gradient-to-br from-violet-50/80 to-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Video marketing (plantilla + OpenAI + stock)</p>
            <p className="mt-1 text-xs text-zinc-600">
              5 escenas tipadas + CTA + cierre. La IA rellena textos, locución y búsquedas de imagen (inglés); Pexels/Unsplash
              resuelven fondos. Requiere <code className="font-mono text-[11px]">OPENAI_API_KEY</code>. Audio en{" "}
              <code className="font-mono text-[11px]">public/audio-marketing/</code>.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <label className="text-xs font-medium text-zinc-600">Plantilla</label>
            <select
              className="h-10 min-w-[200px] rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm"
              value={marketingTemplateId}
              onChange={(e) => setMarketingTemplateId(e.target.value)}
              disabled={busy}
            >
              {marketingTemplates.length
                ? marketingTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))
                : (
                    <option value="five_beat">five_beat</option>
                  )}
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" className="h-9 text-sm" disabled={busy} onClick={onGenerateMarketing}>
            Generar marketing (solo datos)
          </Button>
          <Button type="button" className="h-9 text-sm" disabled={busy} onClick={onGenerateMarketingAll}>
            Marketing + TTS + cola render
          </Button>
        </div>
      </Card>

      <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-white p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900">TikTok y Blotato</p>
            <p className="mt-1 text-xs text-zinc-600">
              <span className="font-medium text-zinc-800">Subir video a Blotato</span> revisa caption (si falta, lo genera con IA si hay{" "}
              <code className="font-mono text-[11px]">OPENAI_API_KEY</code>), TTS + Remotion si no existe el MP4 en{" "}
              <code className="font-mono text-[11px]">out/</code>, y sube el archivo. Puede tardar varios minutos. Requiere{" "}
              <code className="font-mono text-[11px]">BLOTATO_API_KEY</code> y <code className="font-mono text-[11px]">@remotion/cli</code> (render
              local).
            </p>
          </div>
        </div>
        <label htmlFor="studio-post-caption" className="mt-3 block text-xs font-medium text-zinc-600">
          Caption para el post
        </label>
        <textarea
          id="studio-post-caption"
          value={postCaption}
          onChange={(e) => setPostCaption(e.target.value)}
          rows={5}
          placeholder="Pulsa «Copy TikTok (IA)» o escribí / pegá el texto aquí…"
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            className="h-9 bg-zinc-900 text-sm text-white hover:bg-zinc-800"
            disabled={busy}
            onClick={onGenerateTiktokCopy}
          >
            Copy TikTok (IA)
          </Button>
          <Button type="button" variant="secondary" className="h-9 text-sm" disabled={busy} onClick={onUploadBlotato}>
            <Upload className="mr-1.5 size-4" aria-hidden />
            Subir video a Blotato
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <Card className="p-4 sm:p-6">
          <StudioForm
            brief={brief}
            onBriefChange={setBrief}
            contentType={contentType}
            onContentTypeChange={setContentType}
            channel={channel}
            onChannelChange={setChannel}
            generationMode={generationMode}
            onGenerationModeChange={setGenerationMode}
            ctaManual={ctaManual}
            onCtaManualChange={setCtaManual}
            voiceSpeed={voiceSpeed}
            onVoiceSpeedChange={setVoiceSpeed}
            finalCardType={finalCardType}
            onFinalCardTypeChange={setFinalCardType}
            closingTemplateUrl={closingTemplateUrl}
            onClosingTemplateUrlChange={setClosingTemplateUrl}
            backgroundMusicUrl={backgroundMusicUrl}
            onBackgroundMusicUrlChange={setBackgroundMusicUrl}
            screenshotUrl={screenshotUrl}
            onScreenshotUrlChange={setScreenshotUrl}
            busy={busy}
            onGenerateData={onGenerateData}
            onGenerateAudio={onGenerateAudio}
            onRenderVideo={onRenderVideo}
            onGenerateAll={onGenerateAll}
            onSuggestIdea={onSuggestIdea}
            onSuggestCopy={onSuggestCopy}
            onLoadSample={onLoadSample}
          />
          <p className="mt-4 text-xs text-zinc-500">
            “Generar datos” solo crea escenas (sin TTS). “Generar audio (timing)” ejecuta Edge TTS en el servidor y
            escribe MP3 + <code className="font-mono text-[11px]">voice-segment-frames.json</code>.{" "}
            <button type="button" className="font-medium text-blue-600 underline" onClick={applyTimingLocal}>
              Timing local (estimado, sin TTS)
            </button>
          </p>
        </Card>

        <div className="flex flex-col gap-4">
          <StudioPreview runtime={runtime} validationErrors={validation.ok ? [] : validation.errors} />
          <SceneList runtime={runtime} />
        </div>
      </div>

      <Card className="p-4 sm:p-6">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Editor de runtime JSON</h2>
        <RuntimeEditor key={runtimeVersion} value={runtime} onChange={bumpRuntime} />
      </Card>
    </div>
  )
}
