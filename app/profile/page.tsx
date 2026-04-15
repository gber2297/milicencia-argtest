import { revalidatePath } from "next/cache"

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
    <Card className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">Perfil</h1>
      <form action={updateProfile} className="space-y-3">
        <Input defaultValue={profile?.full_name ?? ""} name="full_name" />
        <Input defaultValue={profile?.email ?? user.email ?? ""} disabled />
        <Button>Guardar cambios</Button>
      </form>
    </Card>
  )
}

export default ProfilePage
