// Les visiteurs uniques du compte — extrait de `profile/page.tsx`, qui est tenu
// sous 3 000 lignes (lib/testsDeterministes).
//
// `pages.unique_views` n'a jamais été écrite par personne : la carte
// « Visiteurs uniq » affichait zéro à tout le monde (lot v94). On mesure depuis
// les sessions de `page_views`, sur la même fenêtre que le reste des
// statistiques, robots exclus.
import { visiteursUniques, FENETRE_VISITEURS_JOURS } from "@/lib/compteursDePage"
import { APPAREIL_ROBOT } from "@/lib/robots"

type Client = { from: (t: string) => any }

export async function compterVisiteursUniques(supabase: Client, idsPages: string[], maintenant: Date = new Date()): Promise<number> {
  if (!idsPages.length) return 0
  const depuis = new Date(maintenant); depuis.setDate(depuis.getDate() - FENETRE_VISITEURS_JOURS)
  const { data } = await supabase
    .from("page_views").select("session_id")
    .in("page_id", idsPages).gte("viewed_at", depuis.toISOString())
    .neq("device", APPAREIL_ROBOT)
  return visiteursUniques(data ?? [])
}
