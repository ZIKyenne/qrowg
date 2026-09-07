// Modeles PURS de `team` et `multi_contact` (aucun React).
//
// Deux blocs tres poses — « notre equipe », « vos interlocuteurs » — ecrits deux
// fois, avec les ecarts habituels :
//   • multi_contact remplissait l'apercu de DEUX fausses fiches « Prenom Nom /
//     Poste » quand il etait vide, pour un bloc que la page ne publiait pas ;
//   • l'avatar sans photo n'etait pas le meme des deux cotes : un « 👤 » gris
//     dans l'apercu, l'initiale du nom sur un degrade en ligne ;
//   • les cartes etaient peintes en blanc a 3 % en dur, invisibles sur un theme
//     clair, des deux cotes.
import { extHref, telLink, socialHref } from "../../types"
import type { CtaLink } from "./ctaLink"

const txt = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

export type Jointure = { icone: string; libelle: string; lien: CtaLink }

// Les moyens de joindre une personne, dans un ordre fixe. `nom` sert a
// construire l'intitule lu par un lecteur d'ecran (« Appeler Camille »).
function jointures(nom: string, tel: string, mail: string, linkedin: string): Jointure[] {
  const out: Jointure[] = []
  const t = telLink(tel)
  if (t) out.push({ icone: "📞", libelle: `Appeler ${nom}`, lien: { href: t, external: false, trackTarget: t, visible: true } })
  if (mail) out.push({ icone: "✉️", libelle: `Écrire à ${nom}`, lien: { href: `mailto:${mail}`, external: false, trackTarget: `mailto:${mail}`, visible: true } })
  if (linkedin) {
    const h = socialHref("linkedin", linkedin)
    if (h) out.push({ icone: "in", libelle: `LinkedIn de ${nom}`, lien: { href: extHref(h) || h, external: true, trackTarget: h, visible: true } })
  }
  return out
}

export type Membre = { i: number; photo: string; nom: string; role: string; bio: string; jointures: Jointure[] }

export function equipe(c: Record<string, any> | null | undefined, max = 50): Membre[] {
  const src = c || {}
  const out: Membre[] = []
  for (let i = 1; i <= max; i++) {
    const nom = txt(src[`m${i}_name`])
    if (!nom) continue
    out.push({
      i, photo: txt(src[`m${i}_photo`]), nom, role: txt(src[`m${i}_role`]), bio: txt(src[`m${i}_bio`]),
      jointures: jointures(nom, txt(src[`m${i}_phone`]), txt(src[`m${i}_email`]), txt(src[`m${i}_linkedin`])),
    })
  }
  return out
}

/** Grille a deux colonnes, ou liste. Le libelle vient du panneau de reglages. */
export function enGrille(c: Record<string, any> | null | undefined): boolean {
  return txt((c || {}).layout) === "Grille"
}

export type Interlocuteur = { i: number; photo: string; nom: string; role: string; jointures: Jointure[] }

export function interlocuteurs(c: Record<string, any> | null | undefined, max = 50): Interlocuteur[] {
  const src = c || {}
  const out: Interlocuteur[] = []
  for (let i = 1; i <= max; i++) {
    const nom = txt(src[`c${i}_name`])
    if (!nom) continue
    out.push({
      i, photo: txt(src[`c${i}_photo`]), nom, role: txt(src[`c${i}_role`]),
      jointures: jointures(nom, txt(src[`c${i}_phone`]), txt(src[`c${i}_email`]), ""),
    })
  }
  return out
}

/** Premiere lettre affichable d'un nom, pour l'avatar sans photo. */
export function initiale(nom: string): string {
  return [...nom.trim()].find(ch => /\S/.test(ch))?.toUpperCase() ?? "?"
}
