import { redirect } from "next/navigation"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { requireAdmin } from "@/lib/auth"
import { parseQuestionImageUrl } from "@/lib/question-image-url"
import { createClient } from "@/lib/supabase/server"

const schema = z.object({
  question_text: z.string().min(10),
  explanation: z.string().min(5),
  category_id: z.string().uuid(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  is_active: z.boolean(),
  options: z.array(z.string().min(1)).length(4),
  correct_index: z.number().min(0).max(3),
})

interface NewQuestionPageProps {
  searchParams: Promise<{ error?: string }>
}

const NewQuestionPage = async ({ searchParams }: NewQuestionPageProps) => {
  await requireAdmin()
  const supabase = await createClient()
  const { data: categories } = await supabase.from("categories").select("id, name").order("name")
  const params = await searchParams

  async function createQuestion(formData: FormData) {
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
    if (!payload.success) redirect("/admin/questions/new?error=Revisa los datos de la pregunta")

    const imageParsed = parseQuestionImageUrl(formData.get("image_url"))
    if (!imageParsed.ok) redirect(`/admin/questions/new?error=${encodeURIComponent(imageParsed.error)}`)

    const supabase = await createClient()
    const { data: question } = await supabase
      .from("questions")
      .insert({
        question_text: payload.data.question_text,
        explanation: payload.data.explanation,
        category_id: payload.data.category_id,
        difficulty: payload.data.difficulty,
        is_active: payload.data.is_active,
        image_url: imageParsed.value,
      })
      .select("id")
      .single()

    if (!question) redirect("/admin/questions/new?error=No se pudo crear la pregunta")
    const { error: optionsError } = await supabase.from("question_options").insert(
      payload.data.options.map((option, index) => ({
        question_id: question.id,
        option_text: option,
        is_correct: payload.data.correct_index === index,
      })),
    )
    if (optionsError) redirect("/admin/questions/new?error=No se pudieron crear las opciones")

    redirect("/admin/questions")
  }

  return (
    <Card className="space-y-4">
      <h1 className="text-2xl font-semibold">Crear pregunta</h1>
      {params.error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{params.error}</p>}
      {!categories?.length && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
          Primero crea categorias para poder cargar preguntas.
        </p>
      )}
      <form action={createQuestion} className="space-y-3">
        <Input name="question_text" placeholder="Texto de la pregunta" required />
        <div className="space-y-1">
          <Input name="image_url" type="text" placeholder="Imagen (opcional): https://… o /signos/ejemplo.png" className="w-full" />
          <p className="text-xs text-zinc-500">
            URL pública o ruta en <code className="rounded bg-zinc-100 px-1">public</code> (ej.{" "}
            <code className="rounded bg-zinc-100 px-1">/signos/pare.png</code>). Subí archivos a Supabase Storage o a{" "}
            <code className="rounded bg-zinc-100 px-1">public/signos/</code>.
          </p>
        </div>
        <Input name="explanation" placeholder="Explicacion" required />
        <select name="category_id" className="h-10 w-full rounded-xl border border-zinc-300 px-3 text-sm" required disabled={!categories?.length}>
          {categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select name="difficulty" defaultValue="medium" className="h-10 w-full rounded-xl border border-zinc-300 px-3 text-sm">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        {[0, 1, 2, 3].map((index) => <Input key={index} name={`option_${index}`} placeholder={`Opcion ${index + 1}`} required />)}
        <select name="correct_index" className="h-10 w-full rounded-xl border border-zinc-300 px-3 text-sm">
          <option value="0">Opcion correcta: 1</option>
          <option value="1">Opcion correcta: 2</option>
          <option value="2">Opcion correcta: 3</option>
          <option value="3">Opcion correcta: 4</option>
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked /> Activa</label>
        <Button disabled={!categories?.length}>Guardar pregunta</Button>
      </form>
    </Card>
  )
}

export default NewQuestionPage
