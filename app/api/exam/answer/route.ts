import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

const schema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedOptionId: z.string().uuid(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = schema.safeParse(await request.json())
  if (!payload.success) return NextResponse.json({ error: "Payload invalido" }, { status: 400 })

  const { sessionId, questionId, selectedOptionId } = payload.data
  const { data: option } = await supabase
    .from("question_options")
    .select("is_correct")
    .eq("id", selectedOptionId)
    .eq("question_id", questionId)
    .single()
  if (!option) return NextResponse.json({ error: "Opcion invalida para la pregunta" }, { status: 400 })
  const isCorrect = Boolean(option?.is_correct)

  await supabase
    .from("exam_session_questions")
    .update({
      selected_option_id: selectedOptionId,
      is_correct: isCorrect,
    })
    .eq("exam_session_id", sessionId)
    .eq("question_id", questionId)

  await supabase.from("user_answers").insert({
    user_id: user.id,
    question_id: questionId,
    selected_option_id: selectedOptionId,
    is_correct: isCorrect,
    mode: "exam",
    session_id: sessionId,
  })

  return NextResponse.json({ ok: true })
}
