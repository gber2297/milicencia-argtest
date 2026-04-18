import { redirect } from "next/navigation"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { requireAdmin } from "@/lib/auth"
import { parseQuestionImageUrl } from "@/lib/question-image-url"
import { createClient } from "@/lib/supabase/server"

interface EditQuestionPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}

const schema = z.object({
  question_text: z.string().min(10),
  explanation: z.string().min(5),
  category_id: z.string().uuid(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  is_active: z.boolean(),
  options: z.array(z.string().min(1)).length(4),
  correct_index: z.number().min(0).max(3),
})

const EditQuestionPage = async ({ params, searchParams }: EditQuestionPageProps) => {
  await requireAdmin()
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()

  const [{ data: categories }, { data: question }, { data: options }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("questions").select("*").eq("id", id).single(),
    supabase.from("question_options").select("*").eq("question_id", id).order("created_at"),
  ])

  async function updateQuestion(formData: FormData) {
    "use server"
    await requireAdmin()
    const payload = schema.safeParse({
      question_text: String(formData.get("question_text") ?? ""),
      explanation: String(formData.get("explanation") ?? ""),
      category_id: String(formData.get("category_id") ?? ""),
      difficulty: String(formData.get("difficulty") ?? "medium"),
      is_active: Boolean(formData.get("is_active")),
      options: [0, 1, 2, 3].map((index) => String(formData.get(`option_${index}`) ?? "")),
      correct_index: Number(formData.get("correct_index") ?? 0),
    })
    if (!payload.success) redirect(`/admin/questions/${id}?error=Datos invalidos en la pregunta`)

    const imageParsed = parseQuestionImageUrl(formData.get("image_url"))
    if (!imageParsed.ok) redirect(`/admin/questions/${id}?error=${encodeURIComponent(imageParsed.error)}`)

    const supabase = await createClient()
    const { error: updateError } = await supabase
      .from("questions")
      .update({
        question_text: payload.data.question_text,
        explanation: payload.data.explanation,
        category_id: payload.data.category_id,
        difficulty: payload.data.difficulty,
        is_active: payload.data.is_active,
        image_url: imageParsed.value,
      })
      .eq("id", id)
    if (updateError) redirect(`/admin/questions/${id}?error=No se pudo actualizar la pregunta`)

    const correctIndex = payload.data.correct_index
    for (let index = 0; index < 4; index += 1) {
      const optionId = String(formData.get(`option_id_${index}`) ?? "")
      const optionText = payload.data.options[index]
      if (!optionId) continue
      const { error: optionError } = await supabase
        .from("question_options")
        .update({ option_text: optionText, is_correct: correctIndex === index })
        .eq("id", optionId)
      if (optionError) redirect(`/admin/questions/${id}?error=No se pudo actualizar una opcion`)
    }
    redirect("/admin/questions")
  }

  async function deleteQuestion() {
    "use server"
    await requireAdmin()
    const supabase = await createClient()
    await supabase.from("questions").delete().eq("id", id)
    redirect("/admin/questions")
  }

  if (!question) {
    return <Card>Pregunta no encontrada.</Card>
  }

  const correctIndex = Math.max(0, options?.findIndex((option) => option.is_correct) ?? 0)

  return (
    <Card className="space-y-4">
      <h1 className="text-2xl font-semibold">Editar pregunta</h1>
      {query.error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{query.error}</p>}
      <form action={updateQuestion} className="space-y-3">
        <Input name="question_text" defaultValue={question.question_text} required />
        <div className="space-y-1">
          <Input
            name="image_url"
            type="text"
            defaultValue={(question as { image_url?: string | null }).image_url ?? ""}
            placeholder="Imagen (opcional): https://… o /signos/ejemplo.png"
            className="w-full"
          />
          <p className="text-xs text-zinc-500">
            URL pública o ruta bajo <code className="rounded bg-zinc-100 px-1">public</code>.
          </p>
        </div>
        <Input name="explanation" defaultValue={question.explanation ?? ""} required />
        <select name="category_id" defaultValue={question.category_id ?? ""} className="h-10 w-full rounded-xl border border-zinc-300 px-3 text-sm">
          {categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select name="difficulty" defaultValue={question.difficulty} className="h-10 w-full rounded-xl border border-zinc-300 px-3 text-sm">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        {[0, 1, 2, 3].map((index) => (
          <div key={index}>
            <input type="hidden" name={`option_id_${index}`} defaultValue={options?.[index]?.id ?? ""} />
            <Input name={`option_${index}`} defaultValue={options?.[index]?.option_text ?? ""} required />
          </div>
        ))}
        <select name="correct_index" defaultValue={String(correctIndex)} className="h-10 w-full rounded-xl border border-zinc-300 px-3 text-sm">
          <option value="0">Opcion correcta: 1</option>
          <option value="1">Opcion correcta: 2</option>
          <option value="2">Opcion correcta: 3</option>
          <option value="3">Opcion correcta: 4</option>
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={question.is_active} /> Activa</label>
        <div className="flex gap-2">
          <Button>Guardar cambios</Button>
          <Button formAction={deleteQuestion} variant="danger" type="submit">Eliminar</Button>
        </div>
      </form>
    </Card>
  )
}

export default EditQuestionPage
