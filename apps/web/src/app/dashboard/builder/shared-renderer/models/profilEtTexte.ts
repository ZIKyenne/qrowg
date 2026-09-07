// Modeles PURS de `profile` et `rich_text` (aucun React).
//
// `profile` est le bloc le plus pose de toutes les pages : c'est le nom, la
// photo et l'accroche. Il etait ecrit deux fois, avec deux ecarts :
//   • la page publiee masque le bloc entier quand rien n'est rempli ; l'apercu
//     dessinait quand meme le cadre et ses deux champs vides ;
//   • l'avatar de l'apercu etait un <img> brut, celui de la page passait par
//     SmartImage — et l'initiale n'y avait pas la meme police.
//
// `rich_text` : les deux cotes avaient leur PROPRE echelle de tailles — 11/13/15
// dans l'apercu, 13/14/16 en ligne. Le rapport n'etait pas le meme : « petit »
// paraissait 15 % plus petit que « normal » dans l'apercu, alors que l'ecart
// reel n'est que de 7 %. Le commercant choisissait donc sa taille sur une
// comparaison faussee. Une seule echelle desormais, reduite d'un seul facteur.

const txt = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

export type Profil = { avatar: string; nom: string; accroche: string; badges: string[]; montrerAvatar: boolean }

export function profil(c: Record<string, any> | null | undefined): Profil | null {
  const src = c || {}
  const nom = txt(src.name)
  const accroche = txt(src.tagline)
  const avatar = txt(src.avatar)
  const badges = txt(src.badge).split(/[,\n]/).map(b => b.trim()).filter(Boolean).slice(0, 5)
  // L'avatar apparait s'il y a une photo OU un nom (pour l'initiale), et s'il
  // n'est pas explicitement masque.
  const montrerAvatar = txt(src.hide_avatar) !== "Masquer" && !!(avatar || nom)
  if (!montrerAvatar && !nom && !accroche && badges.length === 0) return null
  return { avatar, nom, accroche, badges, montrerAvatar }
}

/** Initiale affichee quand il n'y a pas de photo. */
export function initialeProfil(nom: string): string {
  return (nom || "?")[0]?.toUpperCase() ?? "?"
}

// ── Texte libre ─────────────────────────────────────────────────────────────
// Trois tailles de reference — celles de la page publiee ; l'apercu les reduit
// d'un facteur unique. Toutes au-dessus du plancher de lisibilite de 12 px.
const TAILLES: Record<string, number> = { small: 13, normal: 14, large: 16 }
export const TAILLE_MINIMALE = 13

export type TexteLibre = { texte: string; taille: number; align: "left" | "center" | "right" }

export function texteLibre(c: Record<string, any> | null | undefined): TexteLibre | null {
  const src = c || {}
  const texte = txt(src.text)
  if (!texte) return null
  const a = txt(src.align)
  return {
    texte,
    taille: TAILLES[txt(src.size)] ?? TAILLES.normal,
    align: a === "center" || a === "right" ? a : "left",
  }
}
