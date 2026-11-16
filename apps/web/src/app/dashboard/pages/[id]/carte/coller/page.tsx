import { createServerSupabaseClient } from "@/lib/supabase/server"
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
  const { data: page } = await supabase.from("pages").select("id, title, slug").eq("id", id).maybeSingle()
  if (!page) notFound()
  return <ColleClient page={page as any} />
}
