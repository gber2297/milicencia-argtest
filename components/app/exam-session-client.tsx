"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { PaywallModal } from "@/components/app/paywall-modal"
import { QuestionFigure } from "@/components/app/question-figure"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Question } from "@/types/domain"

export function ExamSessionClient() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [blockedByLimit, setBlockedByLimit] = useState(false)

  const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex])
  const categoryName = Array.isArray(currentQuestion?.categories)
    ? currentQuestion?.categories[0]?.name
    : currentQuestion?.categories?.name

  useEffect(() => {
    async function startExam() {
      setErrorMessage(null)
      try {
        const response = await fetch("/api/exam/start", { method: "POST" })
        const data = await response.json()
        if (response.status === 403 && (data.code === "SUBSCRIPTION_REQUIRED" || data.code === "LIMIT_EXAM")) {
          setBlockedByLimit(true)
          setPaywallOpen(true)
          setQuestions([])
          setSessionId(null)
          return
        }
        if (!response.ok) {
          setErrorMessage(data.error ?? "No se pudo iniciar el simulacro")
          setQuestions([])
          setSessionId(null)
          return
        }
        setQuestions(data.questions ?? [])
        setSessionId(data.sessionId ?? null)
      } catch {
        setErrorMessage("Error de conexion. Intenta nuevamente.")
      } finally {
        setLoading(false)
      }
    }
    startExam()
  }, [])

  async function answerAndContinue(optionId: string) {
    if (!currentQuestion || !sessionId) return
    setSubmitting(true)
    setErrorMessage(null)

    try {
      const saveResponse = await fetch("/api/exam/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          selectedOptionId: optionId,
        }),
      })
      if (!saveResponse.ok) {
        setErrorMessage("No se pudo guardar la respuesta")
        return
      }

      const isLast = currentIndex + 1 >= questions.length
      if (isLast) {
        const finishResponse = await fetch("/api/exam/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
        if (!finishResponse.ok) {
          setErrorMessage("No se pudo finalizar el examen")
          return
        }

        router.push(`/results/${sessionId}`)
        return
      }

      setCurrentIndex((value) => value + 1)
    } catch {
      setErrorMessage("Error de conexion al enviar respuesta")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="flex min-h-[220px] flex-col items-center justify-center gap-3 border-dashed border-indigo-200/50 bg-gradient-to-br from-violet-50/40 to-white p-8">
        <Loader2 className="size-8 animate-spin text-indigo-600" aria-hidden />
        <p className="text-sm font-medium text-zinc-600">Preparando simulacro…</p>
      </Card>
    )
  }

  if (!currentQuestion) {
    return (
      <>
        <Card className="border-dashed border-zinc-300/90 bg-zinc-50/60 p-6 text-center sm:p-8">
          {blockedByLimit ? (
            <p className="text-sm font-medium text-zinc-800">Necesitás una suscripción activa para hacer el simulacro.</p>
          ) : (
            <>
              <p className="text-sm font-medium text-zinc-800">{errorMessage ?? "No hay preguntas para este simulacro."}</p>
              {errorMessage ? (
                <Button className="mt-4" variant="secondary" onClick={() => router.push("/exam")}>
                  Volver
                </Button>
              ) : null}
            </>
          )}
        </Card>
        <PaywallModal open={paywallOpen} onOpenChange={setPaywallOpen} reason="exam" />
      </>
    )
  }

  const progressPercent = Math.round(((currentIndex + 1) / Math.max(questions.length, 1)) * 100)

  return (
    <Card className="landing-card-hover space-y-6 overflow-hidden border-indigo-100/60 bg-gradient-to-br from-white via-indigo-50/20 to-violet-50/15 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge>
          Pregunta {currentIndex + 1} / {questions.length}
        </Badge>
        <Badge className="border-zinc-200 bg-zinc-100/90 font-medium text-zinc-700">{categoryName ?? "General"}</Badge>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
          <span>Progreso</span>
          <span className="tabular-nums text-zinc-700">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 transition-[width] duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
      {currentQuestion.image_url ? (
        <QuestionFigure src={currentQuestion.image_url} alt={currentQuestion.question_text} />
      ) : null}
      <h2 className="text-lg font-semibold leading-snug tracking-tight text-zinc-900 sm:text-xl">{currentQuestion.question_text}</h2>
      <div className="space-y-2.5">
        {currentQuestion.question_options.map((option) => (
          <Button
            key={option.id}
            type="button"
            variant="answer"
            className="h-auto min-h-[3rem] w-full justify-start px-4 py-3.5 text-left text-sm leading-snug sm:text-[15px]"
            onClick={() => answerAndContinue(option.id)}
            disabled={submitting}
          >
            {option.option_text}
          </Button>
        ))}
      </div>
      {errorMessage && <p className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">{errorMessage}</p>}
    </Card>
  )
}
