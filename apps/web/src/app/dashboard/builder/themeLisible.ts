// themeLisible.ts — ce que le produit ne corrige pas, il le dit.
//
// Le lot v68 a réparé les couleurs que QRowg IMPOSE sur la page du client
// (statuts, pastilles, encre des boutons) : elles s'adaptent désormais au fond
// choisi. Restent les couleurs que le CLIENT choisit lui-même dans le thème.
//
// Là, corriger en silence serait pire que le mal : il a choisi ce rose, il le
// verra rose dans l'éditeur et autrement en ligne, sans comprendre. Le produit
// n'a pas à trancher à sa place — il a à l'avertir, avant de publier, comme il
// l'avertit déjà d'un bouton sans lien ou d'un bloc vide.
//
// Mesuré le 11 septembre sur les 34 pages de démonstration : « 80 € » à 2,9 : 1
// et « Annulation » à 3,6 sur le modèle Institut, « Notre parti pris » à 4,3 sur
// Fleuriste. Aucun de ces textes n'est lisible dehors, au soleil, sur un
// téléphone. Module PUR, testable seul.

import { contraste, encreSur, CONTRASTE_MIN } from "./couleurLisible"

export type ProblemeTheme = { champ: string; texte: string; rapport: number }

const NOMS: Record<string, string> = {
  text: "la couleur du texte",
  muted: "la couleur des textes secondaires",
  primary: "la couleur d'accent",
}

/**
 * Les couleurs du thème qui ne se lisent pas sur le fond de la page, et l'encre
 * des boutons quand l'accent lui-même ne peut porter aucune encre. Une liste
 * vide veut dire que le thème tient.
 */
export function problemesDeTheme(theme: Record<string, any> | null | undefined): ProblemeTheme[] {
  if (!theme) return []
  const fond = typeof theme.bg === "string" ? theme.bg : null
  if (!fond) return []
  const out: ProblemeTheme[] = []

  for (const champ of ["text", "muted", "primary"]) {
    const c = theme[champ]
    if (typeof c !== "string") continue
    const r = contraste(c, fond)
    if (r == null || r >= CONTRASTE_MIN) continue
    out.push({ champ, texte: `${NOMS[champ]} se lit mal sur le fond`, rapport: Math.round(r * 10) / 10 })
  }

  // Un bouton plein porte l'accent en fond : si NI le noir NI le blanc n'y passent,
  // aucune encre ne sauvera ce bouton — seule la couleur peut changer.
  const acc = theme.primary
  if (typeof acc === "string") {
    const r = contraste(encreSur(acc), acc)
    if (r != null && r < CONTRASTE_MIN) {
      out.push({ champ: "primary", texte: "le texte des boutons se lit mal sur la couleur d'accent", rapport: Math.round(r * 10) / 10 })
    }
  }
  return out
}

/** La phrase montrée près de « Publier ». */
export function phraseProbleme(p: ProblemeTheme): string {
  return `${p.texte} (${p.rapport.toString().replace(".", ",")} : 1 — il en faut ${CONTRASTE_MIN.toString().replace(".", ",")})`
}
