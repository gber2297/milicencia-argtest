import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

interface AdminQuestionsPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    difficulty?: string
    active?: string
  }>
}

const AdminQuestionsPage = async ({ searchParams }: AdminQuestionsPageProps) => {
  await requireAdmin()
  const supabase = await createClient()
  const params = await searchParams

  const { data: categories } = await supabase.from("categories").select("id, name").order("name")
  let query = supabase
    .from("questions")
    .select("id, question_text, difficulty, is_active, categories(name)")
    .order("created_at", { ascending: false })

  if (params.q) query = query.ilike("question_text", `%${params.q}%`)
  if (params.category) query = query.eq("category_id", params.category)
  if (params.difficulty) query = query.eq("difficulty", params.difficulty)
  if (params.active) query = query.eq("is_active", params.active === "true")

  const { data: questions } = await query.limit(100)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Preguntas</h1>
        <Link href="/admin/questions/new"><Button>Nueva pregunta</Button></Link>
      </div>
      <Card>
        <form className="grid gap-2 md:grid-cols-5">
          <Input name="q" defaultValue={params.q} placeholder="Buscar texto..." />
          <select name="category" defaultValue={params.category} className="h-10 rounded-xl border border-zinc-300 px-3 text-sm">
            <option value="">Todas las categorias</option>
            {categories?.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <select name="difficulty" defaultValue={params.difficulty} className="h-10 rounded-xl border border-zinc-300 px-3 text-sm">
            <option value="">Todas las dificultades</option>
            <option value="easy">Facil</option>
            <option value="medium">Media</option>
            <option value="hard">Dificil</option>
          </select>
          <select name="active" defaultValue={params.active} className="h-10 rounded-xl border border-zinc-300 px-3 text-sm">
            <option value="">Todos los estados</option>
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </select>
          <Button variant="secondary">Filtrar</Button>
        </form>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="py-2">Pregunta</th>
              <th className="py-2">Categoria</th>
              <th className="py-2">Dificultad</th>
              <th className="py-2">Estado</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {questions?.map((question) => (
              <tr key={question.id} className="border-b border-zinc-100">
                <td className="py-3">{question.question_text}</td>
                <td>{(question.categories as { name?: string })?.name ?? "-"}</td>
                <td>{question.difficulty}</td>
                <td>{question.is_active ? "Activa" : "Inactiva"}</td>
                <td>
                  <Link href={`/admin/questions/${question.id}`} className="text-blue-600">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {!questions?.length && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-zinc-500">
                  No se encontraron preguntas con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export default AdminQuestionsPage
