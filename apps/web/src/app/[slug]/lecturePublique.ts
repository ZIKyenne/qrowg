// lecturePublique.ts — Une seule lecture en base par scan.
//
// Un scan faisait TROIS allers-retours vers Supabase : les métadonnées relisaient
// la page (avec ses blocs), puis la page se relisait elle-même, puis ses blocs —
// ces deux derniers l'un APRÈS l'autre. À chaud, chaque aller-retour coûte peu ;
// au réveil d'une fonction (mesuré le 20 nov. : +0,3 à +2 s sur le premier scan
// après 5 min de calme), chacun ouvre une connexion neuve. La page publique ne
// peut pas être mise en cache (le nonce CSP de v164 la rend dynamique, et on le
// garde), donc le temps se gagne ici : une requête, partagée entre
// `generateMetadata` et la page par `cache()` (même requête HTTP = même lecture).

import { cache } from "react"
import { createAdminClient } from "@/lib/supabase/server"

export interface BlocLu {
  position?: number | null
  is_visible?: boolean | null
  [cle: string]: unknown
}

/**
 * Les blocs que la page affiche : visibles, dans l'ordre de position — ce que
 * faisaient `.eq("is_visible", true).order("position")` côté base. Tri stable :
 * deux positions égales gardent l'ordre lu.
 */
export function blocsAffiches<T extends BlocLu>(blocs: T[] | null | undefined): T[] {
  return (blocs ?? [])
    .filter((b) => b.is_visible === true)
    .map((b, i) => [b, i] as const)
    .sort(([a, ia], [b, ib]) => (a.position ?? 0) - (b.position ?? 0) || ia - ib)
    .map(([b]) => b)
}

/**
 * La page publiée et TOUS ses blocs (masqués compris : `jugerPage`, dans les
 * métadonnées, les a toujours tous lus). Une page en pause est lue aussi, mais
 * ses blocs ne quittent jamais le serveur : la page ne les transmet pas.
 */
export const lirePagePubliee = cache(async (slug: string) => {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("pages")
    .select("*, profiles(full_name, username, avatar_url, plan, free_published_since), blocks(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .single()
  // Lignes brutes de la base, typées comme l'ancienne lecture `select("*")`.
  return data as (Record<string, any> & { blocks?: any[] }) | null
})
