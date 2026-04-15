import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const AdminPage = async () => {
  await requireAdmin()
  const supabase = await createClient()

  const [{ count: questionsCount }, { count: categoriesCount }] = await Promise.all([
    supabase.from("questions").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
  ])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Panel admin</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><p className="text-sm text-zinc-500">Preguntas</p><p className="text-2xl font-semibold">{questionsCount ?? 0}</p></Card>
        <Card><p className="text-sm text-zinc-500">Categorias</p><p className="text-2xl font-semibold">{categoriesCount ?? 0}</p></Card>
      </div>
      <Link href="/admin/questions"><Button>Gestionar preguntas</Button></Link>
    </div>
  )
}

export default AdminPage
