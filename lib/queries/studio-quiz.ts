import { createClient } from "@/lib/supabase/server"
import type { Question, QuestionOption } from "@/types/domain"

/**
 * Una pregunta activa al azar para el Video Studio (quiz).
 * Usa la misma política RLS que práctica: lectura pública de `is_active = true`.
 */
export async function getRandomQuestionForStudio(): Promise<Question | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("questions")
    .select(
      "id, question_text, explanation, difficulty, category_id, categories(*), question_options(id, option_text, is_correct)",
    )
    .eq("is_active", true)
    .limit(300)

  if (error || !data?.length) return null

  const row = data[Math.floor(Math.random() * data.length)] as Question
  if (row.question_options?.length) {
    row.question_options = [...row.question_options].sort((a, b) => a.id.localeCompare(b.id))
  }
  return row
}

export function hasValidOptionsForStudio(opts: QuestionOption[] | undefined): boolean {
  return Boolean(opts && opts.length >= 2 && opts.some((o) => o.is_correct))
}
