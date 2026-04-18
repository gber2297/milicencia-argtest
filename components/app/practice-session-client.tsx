"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"

import { PaywallModal, type PaywallReason } from "@/components/app/paywall-modal"
import { QuestionFigure } from "@/components/app/question-figure"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Question } from "@/types/domain"

interface UsagePayload {
  isPremium: boolean
  practice: { used: number; limit: number | null; remaining: number | null }
}

interface PracticeSessionClientProps {
  categoryId?: string
  initialQuestion: Question | null
  initialPracticeBlocked?: boolean
}

export function PracticeSessionClient({
  categoryId,
  initialQuestion,
  initialPracticeBlocked = false,
}: PracticeSessionClientProps) {
  const [question, setQuestion] = useState<Question | null>(initialQuestion)
  const [feedback, setFeedback] = useState<null | { correct: boolean; hint?: string }>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [usage, setUsage] = useState<UsagePayload | null>(null)
  const [paywallOpen, setPaywallOpen] = useState(initialPracticeBlocked)
  const [paywallReason, setPaywallReason] = useState<PaywallReason>("practice")

  const categoryName = Array.isArray(question?.categories)
    ? question?.categories[0]?.name
    : question?.categories?.name

  useEffect(() => {
    async function loadUsage() {
      const res = await fetch("/api/usage")
      if (!res.ok) return
      const data = await res.json()
      setUsage({
        isPremium: data.isPremium,
        practice: data.practice,
      })
    }
    loadUsage()
  }, [answeredCount])

  async function loadQuestion() {
    setLoading(true)
    setErrorMessage(null)
    const query = categoryId ? `?categoryId=${categoryId}` : ""

    try {
      const response = await fetch(`/api/practice/question${query}`)
      const data = await response.json()
      if (response.status === 403 && (data.code === "SUBSCRIPTION_REQUIRED" || data.code === "LIMIT_PRACTICE")) {
        setQuestion(null)
        setPaywallReason("practice")
        setPaywallOpen(true)
        if (data.usage) {
          setUsage({
            isPremium: data.usage.isPremium,
            practice: data.usage.practice,
          })
        }
        return
      }
      if (!response.ok) {
        setQuestion(null)
        setErrorMessage(data.error ?? "No se pudo cargar una pregunta")
        return
      }

      setQuestion(data.question ?? null)
      if (data.usage) {
        setUsage({
          isPremium: data.usage.isPremium,
          practice: data.usage.practice,
        })
      }
      setFeedback(null)
    } catch {
      setQuestion(null)
      setErrorMessage("Error de conexion. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  async function onAnswer(selectedOptionId: string) {
    if (!question) return
    setSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await fetch("/api/practice/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          selectedOptionId,
          categoryId: question.category_id,
          sessionId,
        }),
      })
      const data = await response.json()
      if (response.status === 403 && (data.code === "SUBSCRIPTION_REQUIRED" || data.code === "LIMIT_PRACTICE")) {
        setPaywallReason("practice")
        setPaywallOpen(true)
        return
      }
      if (!response.ok) {
        setErrorMessage(data.error ?? "No se pudo guardar la respuesta")
        return
      }

      setSessionId(data.sessionId ?? null)
      setFeedback({ correct: data.isCorrect, hint: typeof data.feedbackCopy === "string" ? data.feedbackCopy : undefined })
      setAnsweredCount((value) => value + 1)
    } catch {
      setErrorMessage("Error de conexion al guardar respuesta")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="flex min-h-[200px] flex-col items-center justify-center gap-3 border-dashed border-blue-200/50 bg-gradient-to-br from-blue-50/40 to-white p-8">
        <Loader2 className="size-8 animate-spin text-blue-600" aria-hidden />
        <p className="text-sm font-medium text-zinc-600">Cargando pregunta…</p>
      </Card>
    )
  }

  if (!question) {
    return (
      <>
        <Card className="border-dashed border-blue-200/60 bg-gradient-to-br from-sky-50/50 to-white p-6 sm:p-8">
          <div className="mx-auto max-w-md text-center">
            {initialPracticeBlocked ? (
              <>
                <p className="text-sm font-medium text-zinc-800">Necesitás una suscripción activa para practicar.</p>
                <p className="mt-2 text-sm text-zinc-500">Elegí un plan en Precios y completá el pago en Mercado Pago.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-zinc-800">{errorMessage ?? "No hay preguntas disponibles por ahora."}</p>
                <p className="mt-2 text-sm text-zinc-500">Revisa tu conexion o intenta de nuevo en un momento.</p>
                <Button className="mt-6" onClick={loadQuestion}>
                  Reintentar
                </Button>
              </>
            )}
          </div>
        </Card>
        <PaywallModal open={paywallOpen} onOpenChange={setPaywallOpen} reason={paywallReason} />
      </>
    )
  }

  return (
    <>
      <Card className="landing-card-hover space-y-6 overflow-hidden border-blue-100/60 bg-gradient-to-br from-white via-blue-50/20 to-violet-50/15 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge className="border-zinc-200 bg-zinc-100/90 font-medium text-zinc-700">Respondidas: {answeredCount}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{categoryName ?? "General"}</Badge>
          <Badge className="border-zinc-200 bg-zinc-100/90 font-medium capitalize text-zinc-700">{question.difficulty}</Badge>
        </div>
        {question.image_url ? (
          <QuestionFigure src={question.image_url} alt={question.question_text} />
        ) : null}
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
        <div className="border-t border-zinc-100 pt-2">
          <Button onClick={loadQuestion} disabled={loading || submitting} className="w-full sm:w-auto">
            Siguiente pregunta
          </Button>
        </div>
      </Card>
      <PaywallModal open={paywallOpen} onOpenChange={setPaywallOpen} reason={paywallReason} />
    </>
  )
}
