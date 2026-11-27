import { createServerSupabaseClient } from "@/lib/supabase/server"
import { accessibleOwnerIds } from "@/lib/team"
import { redirect, notFound } from "next/navigation"
import type { Metadata } from "next"
import ColleClient from "./ColleClient"

export const metadata: Metadata = { title: "Coller ma carte - QRowg" }
export const dynamic = "force-dynamic"

// « Coller ma carte » : le texte d'une carte (PDF, Word, site, photo lue), lu
// sans IA, montré en aperçu, puis ajouté à la page en grande carte.
// Lu sous RLS : une page qu'on ne peut pas lire répond comme une page absente.
export default async function CollerMaCartePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  // Parmi les pages du compte et de son équipe : une page publiée d'un autre est
  // LISIBLE (policy « Lecture pages publiées »), sans ses blocs — l'écran montrait
  // une carte vide au lieu de « introuvable » (v405).
  const { data: page } = await supabase.from("pages").select("id, title, slug").eq("id", id).in("user_id", await accessibleOwnerIds(supabase, user.id)).maybeSingle()
  if (!page) notFound()
  return <ColleClient page={page as any} />
}
