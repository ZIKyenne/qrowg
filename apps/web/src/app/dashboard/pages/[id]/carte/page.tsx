import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import type { Metadata } from "next"
import { carteDeLaPage, BLOCS_DE_CARTE } from "@/app/dashboard/builder/shared-renderer/models/epuises"
import { menuSectionViewModel } from "@/app/dashboard/builder/shared-renderer/models/menuSection"
import { menuTabsViewModel } from "@/app/dashboard/builder/shared-renderer/models/menuTabs"
import { ardoiseDeLaPage } from "@/app/dashboard/builder/shared-renderer/models/ardoiseDuJour"
import { TYPE_ARDOISE } from "@/app/dashboard/builder/shared-renderer/models/platDuJour"
import { fermetureDeLaPage, TYPE_HORAIRES } from "@/app/dashboard/builder/shared-renderer/models/fermetureDuCommerce"
import { rubriquesDesAutresCartes } from "@/app/dashboard/builder/shared-renderer/models/autresCartes"
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
  // La colonne s'appelle `is_visible` en base (le builder dit `visible`). Relevé
  // du 16 novembre sur la page Red Fish : demander `visible` faisait échouer la
  // lecture, et l'écran annonçait « pas encore de carte » à un bar qui en a
  // quatre. Une lecture refusée se dit désormais comme telle.
  const { data: blocs, error } = await supabase.from("blocks").select("id, type, content, is_visible, position")
    .eq("page_id", id).in("type", [...BLOCS_DE_CARTE, TYPE_ARDOISE, TYPE_HORAIRES]).order("position", { ascending: true })
  if (error) return <CarteClient page={page as any} rubriques={[]} erreur="Votre carte n'a pas pu être lue. Rechargez la page dans un instant." />

  const lus = (blocs ?? []).map((b: any) => ({ id: b.id, type: b.type, content: b.content, position: b.position, visible: b.is_visible !== false }))
  const rubriques = carteDeLaPage(lus, { section: menuSectionViewModel, onglets: menuTabsViewModel, autres: rubriquesDesAutresCartes })
  // L'ardoise est décidée ici, à l'heure du serveur, et transmise telle quelle :
  // l'écran ne la recalcule pas (pas d'écart entre rendu serveur et téléphone).
  return <CarteClient page={page as any} rubriques={rubriques} ardoise={ardoiseDeLaPage(lus, new Date())} fermeture={fermetureDeLaPage(lus, new Date())} />
}
