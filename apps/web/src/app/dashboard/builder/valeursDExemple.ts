// valeursDExemple.ts — ce qui, dans une page, vient encore du modèle.
//
// Audit du 14 novembre 2026 (D5) : « Bistrot français » charge un nom, des
// plats et des prix fictifs ; « Publier » partait avec « Foie gras poêlé, 18 € »
// sans qu'aucun avertissement ne le dise. Un faux prix en ligne est pire qu'un
// bloc vide : le client le croit.
//
// On compare chaque champ de FAIT (nom, prix, plat, description, accroche) aux
// valeurs écrites dans les modèles. Une valeur identique est signalée, avec le
// champ exact. Les libellés de bouton et titres de section (« Horaires »,
// « Réserver une table ») ne sont pas des faits : ils ne sont pas comparés.
// Module PUR.

import { PAGE_TEMPLATES } from "./page-templates"
import { OBJECTIVES } from "../onboarding/objectives"
import { MODELES_HISTORIQUES } from "../templates/modelesHistoriques"

/** Clés de contenu qui portent un FAIT propre au commerce. */
export const CLE_DE_FAIT = /^(name|tagline|price|address|phone|(item|p|s|d)\d+_(name|price|desc|title))$/

const norme = (v: string) => v.trim().replace(/\s+/g, " ").toLocaleLowerCase("fr")

function indexer(): Map<string, Set<string>> {
  const idx = new Map<string, Set<string>>()   // clé → valeurs normalisées
  // Les recettes de l'onboarding aussi (20 nov.) : « Entrée du jour », « Produit
  // phare »… arrivaient par là sans que l'alerte les connaisse. Leur profil est
  // laissé de côté : son nom est vide et son accroche (« Notre carte du moment »)
  // est une phrase générique, pas un fait inventé.
  const recettes = [...OBJECTIVES.map(o => ({ blocks: o.blocks.filter(b => b.type !== "profile") })), { blocks: ANCIENNE_RECETTE_MENU }]
  // Les 14 modèles historiques de la galerie aussi (U2, 23 nov.) : « Foie gras
  // poêlé, 18 EUR » partait en ligne sans alerte.
  const historiques = Object.values(MODELES_HISTORIQUES).map(blocks => ({ blocks }))
  for (const t of [...PAGE_TEMPLATES, ...recettes, ...historiques]) {
    for (const b of t.blocks as { type: string; content?: Record<string, unknown> }[]) {
      for (const [k, v] of Object.entries(b.content ?? {})) {
        if (!CLE_DE_FAIT.test(k) || typeof v !== "string" || v.trim().length < 2) continue
        if (!idx.has(k)) idx.set(k, new Set())
        idx.get(k)!.add(norme(v))
      }
    }
  }
  return idx
}

/**
 * La recette « menu » d'avant le 23 nov. (vague 1) : elle n'écrit plus ces plats,
 * mais des pages créées avant les portent encore. On continue de les signaler.
 */
const ANCIENNE_RECETTE_MENU = [
  { type: "menu_section", content: { item1_name: "Entrée du jour", item1_desc: "À compléter", item2_name: "Salade maison" } },
  { type: "menu_section", content: { item1_name: "Plat signature", item1_desc: "À compléter", item2_name: "Suggestion du chef" } },
  { type: "menu_section", content: { item1_name: "Dessert maison" } },
]

let INDEX: Map<string, Set<string>> | null = null
const index = () => (INDEX ??= indexer())

export type ValeurDExemple = { champ: string; valeur: string }

/** Les champs de fait de ce bloc encore identiques à un modèle. */
export function exemplesRestants(content: Record<string, unknown> | null | undefined): ValeurDExemple[] {
  const out: ValeurDExemple[] = []
  for (const [k, v] of Object.entries(content ?? {})) {
    if (!CLE_DE_FAIT.test(k) || typeof v !== "string" || !v.trim()) continue
    if (index().get(k)?.has(norme(v))) out.push({ champ: k, valeur: v.trim() })
  }
  return out
}

/** « Foie gras poêlé », « 18€ » et 4 autres valeurs d'exemple */
export function phraseExemples(ex: readonly ValeurDExemple[]): string | null {
  if (ex.length === 0) return null
  const montres = ex.slice(0, 2).map(e => `« ${e.valeur} »`).join(", ")
  const reste = ex.length - 2
  const suite = reste > 0 ? ` et ${reste} autre${reste > 1 ? "s" : ""}` : ""
  return `Valeur${ex.length > 1 ? "s" : ""} d'exemple du modèle : ${montres}${suite} — remplacez-les par les vôtres`
}
