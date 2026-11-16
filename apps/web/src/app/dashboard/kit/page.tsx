import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import type { Metadata } from "next"
import { estAdministrateur } from "@/lib/admin"
import { aUneCarte } from "@/app/dashboard/builder/shared-renderer/models/epuises"
import KitClient from "./KitClient"

export const metadata: Metadata = { title: "Kit de démarchage — QRowg" }
export const dynamic = "force-dynamic"

// Kit de démarchage : la fiche A5 à laisser au comptoir. Outil interne, même
// doctrine que /dashboard/pilotage (notFound() pour qui n'est pas
// administrateur). Lu sous RLS : vos pages, votre code de parrainage.
export default async function KitPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  if (!estAdministrateur(user.email)) notFound()

  const [{ data: profil }, { data: pages }] = await Promise.all([
    supabase.from("profiles").select("ref_code").eq("id", user.id).maybeSingle(),
    supabase.from("pages").select("id, title, slug, status, created_at, blocks(type), qr_codes(short_code, created_at)")
      .eq("user_id", user.id).eq("status", "published").order("created_at", { ascending: true }).limit(50),
  ])
  // Pages de démonstration possibles : en ligne, avec une carte ; le QR = le plus ancien de la page.
  const demos = ((pages as any[]) ?? []).filter(p => aUneCarte(p.blocks)).map(p => {
    const qrs = ((p.qr_codes as { short_code: string | null; created_at: string | null }[] | null) ?? [])
      .filter(q => q.short_code).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    return { id: p.id as string, title: (p.title as string | null) ?? null, slug: p.slug as string, qr: qrs[0]?.short_code ?? null }
  })
  return <KitClient refCode={(profil as any)?.ref_code ?? null} demos={demos} appUrl={process.env.NEXT_PUBLIC_APP_URL || "https://qrowg.com"} />
}
