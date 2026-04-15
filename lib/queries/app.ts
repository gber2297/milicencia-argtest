import { createClient } from "@/lib/supabase/server"
import type { CategoryPerformance, ProgressStats, Question } from "@/types/domain"

export async function getCategories() {
  const supabase = await createClient()
  const { data } = await supabase.from("categories").select("*").order("name")
  return data ?? []
}

export async function getRandomPracticeQuestion(categoryId?: string) {
  const supabase = await createClient()
  const query = supabase
    .from("questions")
    .select(
      "id, question_text, explanation, difficulty, category_id, categories(*), question_options(*)",
    )
    .eq("is_active", true)

  const scoped = categoryId ? query.eq("category_id", categoryId) : query
  const { data } = await scoped.limit(100)

  if (!data?.length) return null
  const random = data[Math.floor(Math.random() * data.length)]
  return random as Question
}

export async function getExamQuestions(total = 30) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("questions")
    .select(
      "id, question_text, explanation, difficulty, category_id, categories(*), question_options(*)",
    )
    .eq("is_active", true)
    .limit(300)

  if (!data?.length) return []

  const shuffled = [...data].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, total) as Question[]
}

export async function getProgressStats(userId: string): Promise<ProgressStats> {
  const supabase = await createClient()
  const { data: answers } = await supabase
    .from("user_answers")
    .select("is_correct")
    .eq("user_id", userId)

  const { data: exams } = await supabase
    .from("exam_sessions")
    .select("score_percentage, started_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })

  const totalAnswered = answers?.length ?? 0
  const totalCorrect = answers?.filter((a) => a.is_correct).length ?? 0
  const totalWrong = totalAnswered - totalCorrect
  const accuracy = totalAnswered ? (totalCorrect / totalAnswered) * 100 : 0

  return {
    totalAnswered,
    totalCorrect,
    totalWrong,
    accuracy,
    examsTaken: exams?.length ?? 0,
    lastExamScore: exams?.[0]?.score_percentage ?? null,
  }
}

export async function getCategoryPerformance(userId: string): Promise<CategoryPerformance[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("user_answers")
    .select("is_correct, questions(category_id, categories(name))")
    .eq("user_id", userId)

  if (!data?.length) return []

  const performanceMap = new Map<string, CategoryPerformance>()

  data.forEach((row) => {
    const questionJoin = row.questions as
      | { category_id?: string | null; categories?: { name?: string } | { name?: string }[] }
      | null
    const categoryObj = Array.isArray(questionJoin?.categories)
      ? questionJoin?.categories[0]
      : questionJoin?.categories
    const categoryId = questionJoin?.category_id ?? null
    const categoryName = categoryObj?.name ?? "Sin categoria"
    const key = categoryId ?? categoryName

    const current = performanceMap.get(key) ?? {
      categoryId,
      categoryName,
      total: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
    }

    current.total += 1
    if (row.is_correct) current.correct += 1
    if (!row.is_correct) current.wrong += 1
    current.accuracy = current.total ? (current.correct / current.total) * 100 : 0

    performanceMap.set(key, current)
  })

  return [...performanceMap.values()].sort((a, b) => b.total - a.total)
}
