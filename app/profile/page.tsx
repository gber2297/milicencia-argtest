import { revalidatePath } from "next/cache"

import { AppPageHeader } from "@/components/app/app-page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const ProfilePage = async () => {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  async function updateProfile(formData: FormData) {
    "use server"
    const fullName = String(formData.get("full_name") ?? "")
    const supabase = await createClient()
    await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id)
    revalidatePath("/profile")
  }

  return (
    <div className="space-y-8">
      <AppPageHeader eyebrow="Cuenta" title="Perfil" description="Nombre visible y datos de acceso." />
      <Card className="landing-card-hover mx-auto max-w-lg border-white/90 p-6 sm:p-8">
        <form action={updateProfile} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="full_name" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Nombre y apellido
            </label>
            <Input
              id="full_name"
              defaultValue={profile?.full_name ?? ""}
              name="full_name"
              className="rounded-2xl border-zinc-200/90 bg-white/80"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Email
            </label>
            <Input
              id="email"
              defaultValue={profile?.email ?? user.email ?? ""}
              disabled
              className="rounded-2xl border-zinc-200/60 bg-zinc-50/80"
            />
          </div>
          <Button type="submit" className="mt-2 w-full sm:w-auto">
            Guardar cambios
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default ProfilePage
