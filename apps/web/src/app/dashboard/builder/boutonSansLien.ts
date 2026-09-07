// Un bouton dont le lien manque — modèle PUR, aucun React.
//
// Le rendu public ne publie plus de bouton sans destination (7 septembre) : un
// contrôle qui ne fait rien est pire qu'un contrôle absent, le visiteur en
// conclut que le commerce ne fonctionne pas. Mais l'aperçu de l'éditeur, lui,
// ne lit l'adresse dans AUCUN de ses vingt-neuf cas : il dessinerait donc un
// bouton que la page ne publie pas. C'est exactement l'écart que le renderer
// partagé existe pour supprimer.
//
// Tant que ces blocs sont encore écrits deux fois, l'aperçu garde son bouton —
// le commerçant doit pouvoir le voir et le composer — mais il est accompagné
// d'une mention qui dit ce qui se passera en ligne. Le bouton n'est pas caché ;
// il est ANNONCÉ comme non publiable. Rien n'est masqué au commerçant.

import { BLOCK_DEFS } from "./blockDefs"
import { destinationUtile } from "./types"

const txt = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

/** « cta_label » → « cta_url » ; « label » → « url » ; « btn1_label » → « btn1_url ». */
export function cleDuLien(cleLibelle: string): string | null {
  const m = /^(.*?)_?label$/.exec(cleLibelle)
  if (!m) return null
  return m[1] ? `${m[1]}_url` : "url"
}

export type BoutonOrphelin = { libelle: string; cleLien: string }

/**
 * Les boutons de ce bloc qui ont un texte mais aucune destination utilisable.
 * Ne regarde que les couples réellement DÉCLARÉS dans le panneau : sans quoi
 * on inventerait un reproche sur un champ qui n'existe pas.
 */
export function boutonsSansLien(type: string, contenu: Record<string, any> | null | undefined): BoutonOrphelin[] {
  const def = BLOCK_DEFS[type] as any
  if (!def) return []
  const declares = new Set(((def.fields ?? []) as any[]).map(f => f?.key).filter(Boolean))
  const c = contenu || {}
  const out: BoutonOrphelin[] = []
  for (const cle of Object.keys(c)) {
    if (!/label$/.test(cle)) continue
    const libelle = txt(c[cle])
    if (!libelle) continue
    const cleLien = cleDuLien(cle)
    if (!cleLien || !declares.has(cleLien)) continue
    if (destinationUtile(txt(c[cleLien]))) continue
    out.push({ libelle, cleLien })
  }
  return out
}

/** La phrase montrée sous le bloc dans l'aperçu. Une seule, même à plusieurs boutons. */
export function mentionBoutonSansLien(boutons: BoutonOrphelin[]): string | null {
  if (boutons.length === 0) return null
  if (boutons.length === 1) return `Le bouton « ${boutons[0].libelle} » n’a pas de lien : il ne sera pas publié.`
  return `${boutons.length} boutons n’ont pas de lien : ils ne seront pas publiés.`
}
