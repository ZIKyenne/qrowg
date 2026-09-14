// Où chaque média est utilisé — la lecture qui permet de ne plus dire « si ».
//
// L'écran des médias confirmait une suppression par « Si ce média est utilisé
// sur une page publiée, il n'y apparaîtra plus. » Le produit a pourtant les
// pages, les blocs et l'URL : il peut répondre par un fait (lot v96 bis / v97).
import { pagesUtilisantLeMedia, type PageUtilisante, type PageLue, type BlocLu } from "@/lib/mediaUtilise"

type Client = { from: (t: string) => any }

export type Bibliotheque = { pages: PageLue[]; blocs: BlocLu[] }

/** Les pages du compte et leurs blocs — une fois, pour tous les médias. */
export async function lireBibliotheque(supabase: Client, userId: string): Promise<Bibliotheque> {
  try {
    const { data: pages } = await supabase.from("pages").select("id, title, status, theme").eq("user_id", userId)
    const ids = (pages ?? []).map((p: any) => p.id)
    if (!ids.length) return { pages: (pages ?? []) as PageLue[], blocs: [] }
    const { data: blocs } = await supabase.from("blocks").select("page_id, content").in("page_id", ids)
    return { pages: (pages ?? []) as PageLue[], blocs: (blocs ?? []) as BlocLu[] }
  } catch {
    // Une lecture ratée ne doit pas bloquer la suppression : on retombe sur
    // « aucune page connue », et la phrase le dit sans rien affirmer de faux.
    return { pages: [], blocs: [] }
  }
}

/** Les pages qui utilisent ce média, dans cette bibliothèque déjà lue. */
export function usagesDuMedia(b: Bibliotheque | null | undefined, urlOuNom: string): PageUtilisante[] {
  return pagesUtilisantLeMedia(b?.pages, b?.blocs, urlOuNom)
}
