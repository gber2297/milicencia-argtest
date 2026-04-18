export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

export interface QuestionOption {
  id: string
  option_text: string
  is_correct: boolean
}

export interface Question {
  id: string
  question_text: string
  /** URL https o ruta que empiece en / (archivo en public/) */
  image_url?: string | null
  explanation: string | null
  difficulty: "easy" | "medium" | "hard"
  category_id: string | null
  categories: Category | Category[] | null
  question_options: QuestionOption[]
}

export interface ProgressStats {
  totalAnswered: number
  totalCorrect: number
  totalWrong: number
  accuracy: number
  examsTaken: number
  lastExamScore: number | null
}

export interface CategoryPerformance {
  categoryId: string | null
  categoryName: string
  total: number
  correct: number
  wrong: number
  accuracy: number
}
