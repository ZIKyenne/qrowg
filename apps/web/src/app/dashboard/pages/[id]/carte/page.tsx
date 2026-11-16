import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import type { Metadata } from "next"
import { carteDeLaPage, BLOCS_DE_CARTE } from "@/app/dashboard/builder/shared-renderer/models/epuises"
import { menuSectionViewModel } from "@/app/dashboard/builder/shared-renderer/models/menuSection"
import { menuTabsViewModel } from "@/app/dashboard/builder/shared-renderer/models/menuTabs"
import CarteClient from "./CarteClient"

export const metadata: Metadata = { title: "Ma carte - QRowg" }
export const dynamic = "force-dynamic"

// « Ma carte ce soir » : la carte d'UNE page, produit par produit, avec un
// interrupteur En vente / Épuisé. Lue sous RLS : une page qu'on ne peut pas
// lire répond comme une page qui n'existe pas.
export default async function MaCartePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: page } = await supabase.from("pages").select("id, title, slug, status").eq("id", id).maybeSingle()
  if (!page) notFound()
  const { data: blocs } = await supabase.from("blocks").select("id, type, content, visible, position")
    .eq("page_id", id).in("type", [...BLOCS_DE_CARTE]).order("position", { ascending: true })

  const rubriques = carteDeLaPage((blocs ?? []) as any, { section: menuSectionViewModel, onglets: menuTabsViewModel })
  return <CarteClient page={page as any} rubriques={rubriques} />
}
