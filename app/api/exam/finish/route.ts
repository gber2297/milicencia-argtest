import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

const schema = z.object({
  sessionId: z.string().uuid(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = schema.safeParse(await request.json())
  if (!payload.success) return NextResponse.json({ error: "Payload invalido" }, { status: 400 })
  const { sessionId } = payload.data

  const { data: rows } = await supabase
    .from("exam_session_questions")
    .select("is_correct, question_id, questions(category_id)")
    .eq("exam_session_id", sessionId)

  const total = rows?.length ?? 0
  const correct = rows?.filter((row) => row.is_correct).length ?? 0
  const wrong = total - correct
  const score = total ? (correct / total) * 100 : 0

  await supabase
    .from("exam_sessions")
    .update({
      correct_answers: correct,
      wrong_answers: wrong,
      score_percentage: Number(score.toFixed(2)),
      ended_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", user.id)

  return NextResponse.json({ sessionId })
}
