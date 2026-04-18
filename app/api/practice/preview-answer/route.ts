import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { pickAnswerFeedbackCopy } from "@/lib/usage"

const schema = z.object({
  questionId: z.string().uuid(),
  selectedOptionId: z.string().uuid(),
})

/** Valida respuesta sin usuario; no guarda en base (modo visitante). */
export async function POST(request: Request) {
  const supabase = await createClient()
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Payload inválido" }, { status: 400 })

  const { questionId, selectedOptionId } = parsed.data

  const { data: option } = await supabase
    .from("question_options")
    .select("is_correct")
    .eq("id", selectedOptionId)
    .eq("question_id", questionId)
    .maybeSingle()

  if (!option) return NextResponse.json({ error: "Opción inválida para la pregunta" }, { status: 400 })

  const { data: questionRow } = await supabase
    .from("questions")
    .select("difficulty")
    .eq("id", questionId)
    .maybeSingle()

  const isCorrect = Boolean(option.is_correct)
  const difficulty = (questionRow?.difficulty as string) ?? "medium"
  const feedbackCopy = pickAnswerFeedbackCopy({ isCorrect, difficulty })

  return NextResponse.json({ isCorrect, feedbackCopy })
}
