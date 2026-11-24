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
import { EXTRA_STRUCTURES } from "./templateStructures.extra"

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
  // Et les 62 métiers du moteur, exposés au catalogue (point 5, lot 3, 24 nov.) :
  // leurs prix et noms de prestations sont des exemples à remplacer, signalés comme tels.
  for (const t of [...PAGE_TEMPLATES, ...recettes, ...historiques, ...EXTRA_STRUCTURES]) {
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
  const c = content ?? {}
  const estExemple = (k: string, v: unknown) =>
    CLE_DE_FAIT.test(k) && typeof v === "string" && !!v.trim() && !!index().get(k)?.has(norme(v))
  const out: ValeurDExemple[] = []
  for (const [k, v] of Object.entries(c)) {
    if (!estExemple(k, v)) continue
    // Un prix SEUL n'est pas un fait du modèle : « 11 € » est aussi le vrai prix
    // d'un commerçant. Il n'est signalé que si sa ligne porte encore le NOM du
    // modèle (« Foie gras poêlé, 18 € »). Sans cette règle, plus le catalogue
    // grandit (127 modèles, lot 3), plus les vrais prix seraient pris pour des
    // exemples — et une alerte qui crie à tort ne se lit plus.
    if (k === "price" || k.endsWith("_price")) {
      const nom = k === "price" ? "name" : k.replace(/_price$/, "_name")
      if (!estExemple(nom, c[nom])) continue
    }
    out.push({ champ: k, valeur: (v as string).trim() })
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
