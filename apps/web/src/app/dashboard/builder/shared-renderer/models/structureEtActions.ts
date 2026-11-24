// Rendu unique, lot 3 — la structure (24 nov.).
//
// Cinq blocs qui organisent la page ou y posent des actions : onglets,
// accordéon, barre fixe, grille de boutons, documents. Ce que chacun publie se
// décide ICI ; l'aperçu de l'éditeur et la page publiée ne font que dessiner.
//
// Ce que les copies disaient de différent :
//   · l'aperçu de `multi_cta` dessinait les boutons sans adresse, que la page
//     ne publie pas ; celui de `documents` affichait « Télécharger ↓ » sur un
//     document sans fichier ;
//   · l'aperçu des onglets écrivait « Ajoutez du contenu... » dans un onglet
//     vide — un texte que personne n'a écrit ;
//   · l'aperçu de la barre fixe retenait une action que la page écartait
//     (adresse vide mais définie) ; les deux filtres diffèrent depuis le début.
import { destinationUtile, stickyActionHref, docTypeMeta, docActionLabel } from "../../types"
import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"

type C = Record<string, any> | null | undefined

// ── tabs_block ──────────────────────────────────────────────────────────────
export function onglets(c: C): { label: string; contenu: string }[] {
  return extractIndexed(c || {}, plafondDesLignes("tabs_block"), (s, i) => {
    const label = texteUtile(s[`tab${i}_label`])
    return label ? { label, contenu: texteUtile(s[`tab${i}_content`]) } : null
  })
}

// ── accordion_block ─────────────────────────────────────────────────────────
export function sectionsAccordeon(c: C): { titre: string; contenu: string }[] {
  return extractIndexed(c || {}, plafondDesLignes("accordion_block"), (s, i) => {
    const titre = texteUtile(s[`a${i}_title`])
    return titre ? { titre, contenu: texteUtile(s[`a${i}_content`]) } : null
  })
}

// ── sticky_bar ──────────────────────────────────────────────────────────────
/** Ce que tient la largeur d'un téléphone, pas un plafond de répéteur : la
 *  barre n'est pas une liste que le commerçant allonge, ses cinq emplacements
 *  sont déclarés un par un dans le panneau. (Rendu unique, lot 3.) */
export const ACTIONS_PAR_BARRE = 5
export type ActionDeBarre = { type: string; href: string | null; partage: boolean; icone: string; label: string; couleur: string; externe: boolean }
/** Une action ne compte que si elle mène quelque part (ou partage la page) —
 *  la règle du détecteur, au mot près, et celle de la page depuis toujours. */
export function actionsDeBarre(c: C): ActionDeBarre[] {
  return extractIndexed<ActionDeBarre>(c || {}, ACTIONS_PAR_BARRE, (s, i) => {
    const type = texteUtile(s[`a${i}_type`])
    if (!type || type === "none") return null
    const a = stickyActionHref(type, s[`a${i}_value`])
    const href = a.href ? destinationUtile(a.href) : null
    if (!href && !a.share) return null
    return { type, href, partage: !!a.share, icone: a.icon, label: a.label, couleur: a.color, externe: !!href && /^https?:/i.test(href) }
  })
}

// ── multi_cta ───────────────────────────────────────────────────────────────
/** Un bouton existe s'il a un texte ET une destination (vague 25). */
export function boutonsMultiples(c: C): { icone: string; label: string; href: string; externe: boolean }[] {
  return extractIndexed(c || {}, plafondDesLignes("multi_cta"), (s, i) => {
    const label = texteUtile(s[`btn${i}_label`])
    const href = destinationUtile(s[`btn${i}_url`])
    if (!label || !href) return null
    return { icone: texteUtile(s[`btn${i}_icon`]) || "⚡", label, href, externe: /^https?:/i.test(href) }
  })
}

// ── documents ───────────────────────────────────────────────────────────────
export type Document = { type: string; nom: string; desc: string; meta: string; href: string | null; icone: string; couleur: string; action: string }
export function documentsListe(c: C): Document[] {
  return extractIndexed<Document>(c || {}, plafondDesLignes("documents"), (s, i) => {
    const nom = texteUtile(s[`d${i}_title`])
    if (!nom) return null
    const type = texteUtile(s[`d${i}_type`])
    const m = docTypeMeta(type)
    return {
      type, nom,
      desc: texteUtile(s[`d${i}_desc`]),
      meta: texteUtile(s[`d${i}_meta`]),
      href: destinationUtile(s[`d${i}_url`]),
      icone: m.icon, couleur: m.color, action: docActionLabel(type),
    }
  })
}
