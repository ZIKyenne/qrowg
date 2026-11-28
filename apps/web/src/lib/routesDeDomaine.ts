// ─────────────────────────────────────────────────────────────────────────────
// QUELLE ROUTE SERT CET HÔTE ? (lot v412)
//
// La résolution découpait l'hôte en « deux dernières étiquettes = racine » :
// « menu.resto.co.uk » donnait la racine « co.uk », et aucune route d'un domaine
// en .co.uk, .com.au… ni d'un sous-domaine vérifié pris comme racine ne servait
// jamais. Et elle retirait « www. » AVANT de chercher : la route « www » que
// l'écran propose ne correspondait à rien.
//
// Règle : une route vaut pour l'hôte complet qu'elle décrit (« sous.racine », ou
// la racine seule). Ordre : l'hôte tel quel, puis sans « www. » (le www d'un
// domaine sans route « www » sert la racine, comme avant), puis le joker « * »
// de la racine la plus précise. Pur.
// ─────────────────────────────────────────────────────────────────────────────

export type RouteDeDomaine<P = unknown> = {
  root_domain: string
  subdomain:   string | null
  pages?:      P | null
}

const hoteDe = (r: RouteDeDomaine) => {
  const racine = r.root_domain.toLowerCase()
  return r.subdomain ? `${r.subdomain.toLowerCase()}.${racine}` : racine
}

export function routePourHote<R extends RouteDeDomaine>(hote: string, routes: R[]): R | null {
  const h = hote.toLowerCase().replace(/\.$/, "")
  const servies = routes.filter(r => r.pages)
  const exacte = (cible: string) => servies.find(r => r.subdomain !== "*" && hoteDe(r) === cible)

  const tel = exacte(h)
  if (tel) return tel
  if (h.startsWith("www.")) {
    const sansWww = exacte(h.slice(4))
    if (sansWww) return sansWww
  }
  const jokers = servies
    .filter(r => r.subdomain === "*" && h.endsWith("." + r.root_domain.toLowerCase()))
    .sort((a, b) => b.root_domain.length - a.root_domain.length)
  return jokers[0] ?? null
}

/** Un sous-domaine saisi : une ou plusieurs étiquettes DNS, ou le joker « * ». */
export function sousDomaineValide(brut: unknown): string | null | false {
  if (brut === undefined || brut === null) return null
  if (typeof brut !== "string") return false
  const s = brut.trim().toLowerCase()
  if (!s) return null
  if (s === "*") return s
  if (s.length > 120) return false
  return s.split(".").every(e => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(e)) ? s : false
}
