import { Card } from "@/components/ui/card"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const AdminCategoriesPage = async () => {
  await requireAdmin()
  const supabase = await createClient()
  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return (
    <Card>
      <h1 className="text-2xl font-semibold">Categorias</h1>
      <ul className="mt-3 space-y-2 text-sm">
        {categories?.map((category) => <li key={category.id} className="rounded-xl border border-zinc-200 p-2">{category.name}</li>)}
        {!categories?.length && (
          <li className="rounded-xl border border-zinc-200 p-3 text-zinc-500">
            No hay categorias cargadas.
          </li>
        )}
      </ul>
    </Card>
  )
}

export default AdminCategoriesPage
