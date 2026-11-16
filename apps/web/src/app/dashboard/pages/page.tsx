import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { accessibleOwnerIds } from "@/lib/team"
import PagesClient from "./PagesClient"

export const metadata: Metadata = { title: "Mes pages - QRowg" }

// Mes pages — la liste des projets existants (audit du 14 novembre, C1/C2).
// Destination commune du menu « Pages » et du lien « Tout voir » de l'accueil.
// Le plafond suit le modèle de quota : 300 pages créables au plus (lib/quota).
const PLAFOND_LISTE = 300

export default async function MesPagesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const ownerIds = await accessibleOwnerIds(supabase, user.id)
  const { data: pages } = await supabase
    .from("pages")
    .select("id, title, slug, status, total_views, updated_at, created_at, qr_codes(short_code, created_at)")
    .in("user_id", ownerIds)
    .order("updated_at", { ascending: false })
    .limit(PLAFOND_LISTE)

  // Le QR « de la page » = son plus ancien (celui créé avec elle) ; les autres sont des supports.
  const liste = ((pages as any[]) ?? []).map(({ qr_codes, ...p }) => {
    const qrs = ((qr_codes as { short_code: string | null; created_at: string | null }[] | null) ?? [])
      .filter(q => q.short_code).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    return { ...p, qr: qrs[0]?.short_code ?? null }
  })
  return <PagesClient pages={liste} />
}
