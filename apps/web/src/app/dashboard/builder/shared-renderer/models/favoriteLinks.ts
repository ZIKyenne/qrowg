// Modèle pur `favorite_links`. items filtrés sur label (link_{i}), limite 50. Chaque item = un
// lien réel (href jugé par destinationUtile, cible de tracking = url brute || "link").
import { destinationUtile } from "../../types"
import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"
import type { CtaLink } from "./ctaLink"

export type FavoriteLinkItem = { icon?: string; label: string; link: CtaLink }
export type FavoriteLinksViewModel = { visible: boolean; title?: string; items: FavoriteLinkItem[] }

export function favoriteLinksViewModel(content: Record<string, any> | null | undefined): FavoriteLinksViewModel {
  const c = content || {}
  const items = extractIndexed<FavoriteLinkItem>(c, plafondDesLignes("favorite_links"), (cc, i) => {
    if (!texteUtile(cc[`link_${i}_label`])) return null
    const url = typeof cc[`link_${i}_url`] === "string" ? cc[`link_${i}_url`] : ""
    // Lot v174 : la vue jetait déjà les items sans adresse — mais le modèle les
    // gardait, donc `visible` valait « plein » et l'éditeur montrait un lien que
    // la page ne publiait pas. Ce bloc s'appelle « liens favoris » : sans
    // adresse, il n'y a pas de lien. Le modèle le dit, l'éditeur affiche son
    // état vide, et la liste d'avant publication le nomme.
    const href = destinationUtile(url)
    if (!href) return null
    return { icon: cc[`link_${i}_icon`], label: cc[`link_${i}_label`], link: { href, external: true, trackTarget: url || "link", visible: true } }
  })
  return { visible: items.length > 0, title: typeof c.title === "string" && c.title ? c.title : undefined, items }
}
