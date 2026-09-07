// Modeles PURS de la structure de page (aucun React) : `hero_banner`,
// `section_banner`, `two_columns`, `grid_section` et `section_block`.
//
// Ce que le visiteur voit en premier, et ce que le commercant compose le plus
// souvent. Leurs ecarts :
//
//  · hero_banner — l'apercu n'avait AUCUNE garde de vide : il dessinait une
//    banniere de 180 px avec son degrade sur un bloc que la page ne publie pas.
//    Et il rendait un <img> brut pour l'image de fond : une photo de banniere en
//    pleine taille, sur le telephone de l'auteur, a chaque ouverture.
//
//  · section_banner — la couleur choisie ne s'appliquait qu'au TEXTE dans
//    l'apercu ; les filets et le degrade restaient a la couleur du theme. En
//    ligne, tout prend la couleur choisie. Le commercant reglait un bleu et
//    voyait des filets dores.
//
//  · grid_section — l'apercu coupait la grille a `colonnes x 2` cartes. A deux
//    colonnes, les cartes 5 et 6 etaient donc invisibles cote auteur alors que
//    la page les publie.
//
//  · section_block — sans style de fond choisi, l'apercu appliquait quand meme
//    14 px de marge interieure, la page zero.

const txt = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

// ── Bannière d'accueil ──────────────────────────────────────────────────────

export type Hero = {
  image: string; couleurFond: string; hauteur: number
  titre: string; sousTitre: string; aGauche: boolean
  boutons: { label: string; cle: "cta_url" | "cta2_url" }[]
}

const HAUTEURS: Record<string, number> = { sm: 170, lg: 280 }

export function hero(c: Record<string, any> | null | undefined): Hero | null {
  const src = c || {}
  const titre = txt(src.title), image = txt(src.bg_image)
  if (!titre && !image) return null
  const boutons: Hero["boutons"] = []
  if (txt(src.cta_label)) boutons.push({ label: txt(src.cta_label), cle: "cta_url" })
  if (txt(src.cta2_label)) boutons.push({ label: txt(src.cta2_label), cle: "cta2_url" })
  return {
    image, couleurFond: txt(src.bg_color),
    hauteur: HAUTEURS[txt(src.height)] ?? 220,
    titre, sousTitre: txt(src.subtitle),
    aGauche: txt(src.align) === "left", boutons,
  }
}

// ── Séparateur de section ───────────────────────────────────────────────────

export type Separateur = { titre: string; couleur: string; style: string }
const STYLES_SEP = new Set(["lines", "dots", "gradient", "minimal", "badge"])

export function separateur(c: Record<string, any> | null | undefined, couleurTheme: string): Separateur | null {
  const src = c || {}
  const titre = txt(src.title)
  // « SECTION » etait le texte de remplissage de l'apercu.
  if (!titre) return null
  const style = txt(src.style)
  return { titre, couleur: txt(src.color) || couleurTheme, style: STYLES_SEP.has(style) ? style : "lines" }
}

// ── Colonnes et grille ──────────────────────────────────────────────────────

export type Carte = { icone: string; titre: string; texte: string }

/** `two_columns` : deux colonnes, gardées dès qu'un titre OU un texte existe. */
export function deuxColonnes(c: Record<string, any> | null | undefined): Carte[] {
  const src = c || {}
  return [1, 2]
    .map(i => ({ icone: txt(src[`col${i}_icon`]), titre: txt(src[`col${i}_title`]), texte: txt(src[`col${i}_text`]) }))
    .filter(col => col.titre !== "" || col.texte !== "")
}

export type Grille = { titre: string; colonnes: number; cartes: Carte[] }

/** `grid_section` : jusqu'à six cartes, le titre décide. Aucun plafond lié au
 *  nombre de colonnes — l'aperçu en imposait un que la page n'avait pas. */
export function grille(c: Record<string, any> | null | undefined): Grille | null {
  const src = c || {}
  const cartes = [1, 2, 3, 4, 5, 6]
    .map(i => ({ icone: txt(src[`c${i}_icon`]), titre: txt(src[`c${i}_title`]), texte: txt(src[`c${i}_text`]) }))
    .filter(k => k.titre !== "")
  if (cartes.length === 0) return null
  const n = parseInt(txt(src.columns), 10)
  return { titre: txt(src.title), colonnes: Number.isFinite(n) && n >= 1 && n <= 6 ? n : 3, cartes }
}

// ── En-tête de section ──────────────────────────────────────────────────────

export type EnTete = { titre: string; sousTitre: string; fond: "card" | "highlight" | "transparent"; filet: boolean }

export function enTeteSection(c: Record<string, any> | null | undefined): EnTete | null {
  const src = c || {}
  const titre = txt(src.title), sousTitre = txt(src.subtitle)
  if (!titre && !sousTitre) return null
  const fond = txt(src.bg_style)
  return {
    titre, sousTitre,
    // Sans style choisi, aucun cadre — donc aucune marge intérieure. L'aperçu
    // en mettait 14 px, la page zéro.
    fond: fond === "card" || fond === "highlight" ? fond : "transparent",
    filet: txt(src.show_divider) !== "no",
  }
}
