import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { pickAnswerFeedbackCopy, recordPracticeAnswer } from "@/lib/usage"
import { canAnswerPracticeQuestion } from "@/lib/usage"

const schema = z.object({
  questionId: z.string().uuid(),
  selectedOptionId: z.string().uuid(),
  categoryId: z.string().uuid().nullable().optional(),
  sessionId: z.string().uuid().nullable().optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = schema.safeParse(await request.json())
  if (!payload.success) return NextResponse.json({ error: "Payload invalido" }, { status: 400 })

  const { questionId, selectedOptionId, sessionId, categoryId } = payload.data

  const gate = await canAnswerPracticeQuestion(supabase, user.id)
  if (!gate.ok) {
    return NextResponse.json({ error: "Se requiere suscripción activa", code: gate.reason }, { status: 403 })
  }

  const { data: questionRow } = await supabase
    .from("questions")
    .select("difficulty")
    .eq("id", questionId)
    .maybeSingle()

  let effectiveSessionId = sessionId ?? null
  if (!effectiveSessionId) {
    const { data: created } = await supabase
      .from("practice_sessions")
      .insert({ user_id: user.id, category_id: categoryId ?? null })
      .select("id")
      .single()
    effectiveSessionId = created?.id ?? null
  }

  const { data: option } = await supabase
    .from("question_options")
    .select("is_correct")
    .eq("id", selectedOptionId)
    .eq("question_id", questionId)
    .single()
  if (!option) return NextResponse.json({ error: "Opcion invalida para la pregunta" }, { status: 400 })

  const isCorrect = Boolean(option?.is_correct)
  await supabase.from("user_answers").insert({
    user_id: user.id,
    question_id: questionId,
    selected_option_id: selectedOptionId,
    is_correct: isCorrect,
    mode: "practice",
    session_id: effectiveSessionId,
  })

  await recordPracticeAnswer(supabase, user.id)

  const difficulty = (questionRow?.difficulty as string) ?? "medium"
  const feedbackCopy = pickAnswerFeedbackCopy({ isCorrect, difficulty })

  return NextResponse.json({ isCorrect, sessionId: effectiveSessionId, feedbackCopy })
}
