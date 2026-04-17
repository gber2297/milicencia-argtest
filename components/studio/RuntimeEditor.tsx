"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { validateRuntime } from "@/lib/studio/validation"
import type { VideoRuntime } from "@/types/studio"
import { cn } from "@/lib/utils"

interface RuntimeEditorProps {
  value: VideoRuntime
  onChange: (next: VideoRuntime) => void
  className?: string
}

export const RuntimeEditor = ({ value, onChange, className }: RuntimeEditorProps) => {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2))
  const [parseError, setParseError] = useState<string | null>(null)

  const syncFromProps = () => {
    setText(JSON.stringify(value, null, 2))
    setParseError(null)
  }

  const apply = () => {
    try {
      const parsed = JSON.parse(text) as unknown
      const v = validateRuntime(parsed)
      if (!v.ok) {
        setParseError(v.errors.join("\n"))
        return
      }
      setParseError(null)
      onChange(parsed as VideoRuntime)
    } catch {
      setParseError("JSON inválido")
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className="min-h-[220px] w-full rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 font-mono text-xs text-zinc-800"
      />
      {parseError && (
        <pre className="whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800">
          {parseError}
        </pre>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" className="h-9 text-sm" onClick={syncFromProps}>
          Recargar desde preview
        </Button>
        <Button type="button" className="h-9 text-sm" onClick={apply}>
          Aplicar JSON
        </Button>
      </div>
    </div>
  )
}
