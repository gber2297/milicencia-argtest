"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import Link from "next/link"

import { QuestionFigure } from "@/components/app/question-figure"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Question } from "@/types/domain"

export function GuestPracticeSession() {
  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<null | { correct: boolean; hint?: string }>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setErrorMessage(null)
      try {
        const res = await fetch("/api/practice/preview-question")
        const data = await res.json()
        if (!res.ok) {
          if (!cancelled) setErrorMessage(data.error ?? "No se pudo cargar una pregunta")
          return
        }
        if (!cancelled) setQuestion(data.question ?? null)
      } catch {
        if (!cancelled) setErrorMessage("Error de conexión. Probá de nuevo.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function onAnswer(selectedOptionId: string) {
    if (!question) return
    setSubmitting(true)
    setErrorMessage(null)
    try {
      const response = await fetch("/api/practice/preview-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, selectedOptionId }),
      })
      const data = await response.json()
      if (!response.ok) {
        setErrorMessage(data.error ?? "No se pudo validar la respuesta")
        return
      }
      setFeedback({
        correct: data.isCorrect,
        hint: typeof data.feedbackCopy === "string" ? data.feedbackCopy : undefined,
      })
    } catch {
      setErrorMessage("Error de conexión al validar la respuesta")
    } finally {
      setSubmitting(false)
    }
  }

  const categoryName = Array.isArray(question?.categories)
    ? question?.categories[0]?.name
    : question?.categories?.name

  if (loading) {
    return (
      <Card className="flex min-h-[200px] flex-col items-center justify-center gap-3 p-8">
        <Loader2 className="size-8 animate-spin text-blue-600" aria-hidden />
        <p className="text-sm font-medium text-zinc-600">Cargando una pregunta de ejemplo…</p>
      </Card>
    )
  }

  if (!question) {
    return (
      <Card className="border-dashed border-zinc-300/90 bg-zinc-50/60 p-6 sm:p-8">
        <div className="mx-auto max-w-md text-center">
          <p className="text-sm font-medium text-zinc-800">{errorMessage ?? "No hay preguntas disponibles."}</p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-amber-200 bg-amber-50 font-medium text-amber-900">Modo visitante</Badge>
          <Badge>{categoryName ?? "General"}</Badge>
          <Badge className="border-zinc-200 bg-zinc-100/90 font-medium capitalize text-zinc-700">{question.difficulty}</Badge>
        </div>
        <p className="text-xs text-zinc-500">Sin cuenta: probá una pregunta. Para guardar progreso y seguir, creá tu cuenta.</p>
        {question.image_url ? <QuestionFigure src={question.image_url} alt={question.question_text} /> : null}
        <h2 className="text-lg font-semibold leading-snug tracking-tight text-zinc-900 sm:text-xl">{question.question_text}</h2>
        <div className="space-y-2.5">
          {question.question_options.map((option) => (
            <Button
              key={option.id}
              type="button"
              variant="answer"
              className="h-auto min-h-[3rem] w-full justify-start px-4 py-3.5 text-left text-sm leading-snug sm:text-[15px]"
              onClick={() => onAnswer(option.id)}
              disabled={Boolean(feedback) || submitting}
            >
              {option.option_text}
            </Button>
          ))}
        </div>

        {feedback && (
          <div
            role="status"
            className={`flex gap-3 rounded-2xl border p-4 text-sm leading-relaxed sm:p-5 ${
              feedback.correct
                ? "border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-teal-50/50 text-emerald-900"
                : "border-rose-200/90 bg-gradient-to-br from-rose-50 to-orange-50/40 text-rose-900"
            }`}
          >
            {feedback.correct ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <XCircle className="mt-0.5 size-5 shrink-0 text-rose-600" aria-hidden />
            )}
            <div>
              <p className="font-semibold">{feedback.correct ? "Respuesta correcta" : "Respuesta incorrecta"}</p>
              {feedback.hint && <p className="mt-2 font-medium text-zinc-800">{feedback.hint}</p>}
              {question.explanation && (
                <p className={cn("mt-2 font-normal", feedback.correct ? "text-emerald-950/90" : "text-rose-950/90")}>
                  {question.explanation}
                </p>
              )}
            </div>
          </div>
        )}

        {errorMessage && (
          <p className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">{errorMessage}</p>
        )}
      </Card>

      {feedback ? (
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-5 sm:p-6">
          <h3 className="text-base font-semibold text-zinc-900">¿Querés seguir practicando?</h3>
          <p className="mt-1 text-sm text-zinc-600">
            Con una cuenta guardás respuestas, medís avance y accedés al onboarding personalizado.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link href="/register" className="inline-flex w-full sm:w-auto">
              <Button className="w-full">Crear cuenta</Button>
            </Link>
            <Link href="/login" className="inline-flex w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
