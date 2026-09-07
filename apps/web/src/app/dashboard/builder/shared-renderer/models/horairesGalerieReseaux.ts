// Modeles PURS de `opening_hours`, `gallery` et `social_links` (aucun React).
//
// Les trois derniers gros blocs presents sur presque toutes les pages. Ils
// avaient chacun leur ecart :
//
//  · opening_hours : l'apercu ecrivait « Lun — Ven », la page « Lundi —
//    Vendredi ». Et la note de bas de tableau n'etait publiee QUE s'il y avait
//    au moins une ligne d'horaire : un commercant ferme pour conges, qui avait
//    saisi une exception et une note, perdait la note en ligne.
//
//  · gallery : l'apercu ignorait les descriptions de photos (le champ existe,
//    il est lu a voix haute par les lecteurs d'ecran) et affichait six cases
//    « 🖼️ » factices sur un bloc vide que la page ne publie pas.
//
//  · social_links : la page publiee redeclarait `website` EN TETE de sa table,
//    par-dessus l'entree que l'editeur avait deja en 74e position. Un
//    commercant qui renseignait son site le voyait donc en dernier dans
//    l'apercu et en PREMIER en ligne. Et le libelle personnalise d'un reseau
//    n'etait pas repris par l'affichage « icones » — la ou il compte le plus,
//    puisqu'une icone seule ne dit rien a un lecteur d'ecran.

import { DAY_KEYS, socialHref, SOCIAL_NETWORKS_MAP } from "../../types"

const txt = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

// ── Horaires ────────────────────────────────────────────────────────────────

/** Les sept jours, index JavaScript (0 = dimanche). */
const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
/** Ordre d'affichage francais : la semaine commence le lundi. */
const ORDRE = [1, 2, 3, 4, 5, 6, 0]

export type LigneHoraire = { label: string; heures: string; jour: number }
export type Horaires = { titre: string; lignes: LigneHoraire[]; exception: string; note: string }

/** Vrai si le detail est saisi jour par jour (choisi, ou deduit du contenu). */
export function modeJourParJour(c: Record<string, any> | null | undefined): boolean {
  const src = c || {}
  return txt(src.mode) === "Jour par jour" || DAY_KEYS.some(k => txt(src[k]) !== "")
}

/** Une plage vide vaut « fermé » : c'est le seul mot que le bloc ajoute, et il
 *  ne s'ajoute qu'en mode jour-par-jour, ou l'absence de ligne EST l'information. */
export const FERME = "Fermé"
const estFerme = (h: string) => /^(fermé|ferme|closed|repos)/i.test(h.trim())
export { estFerme }

export function horaires(c: Record<string, any> | null | undefined): Horaires | null {
  const src = c || {}
  const lignes: LigneHoraire[] = modeJourParJour(src)
    ? ORDRE.map(d => ({ label: JOURS[d], heures: txt(src[DAY_KEYS[d]]) || FERME, jour: d }))
    // « Lundi — Vendredi » en toutes lettres : l'apercu abregeait en « Lun — Ven ».
    : ([
        { label: "Lundi — Vendredi", heures: txt(src.mon_fri), jour: -1 },
        { label: "Samedi", heures: txt(src.saturday), jour: 6 },
        { label: "Dimanche", heures: txt(src.sunday), jour: 0 },
      ] as LigneHoraire[]).filter(l => l.heures !== "")
  const exception = txt(src.exception)
  const note = txt(src.note)
  if (lignes.length === 0 && !exception) return null
  return { titre: txt(src.title), lignes, exception, note }
}

/** Le jour surligne. `aujourdhui` vaut -1 tant que l'heure n'est pas connue
 *  (rendu serveur), et le groupe « Lundi — Vendredi » couvre les jours 1 a 5. */
export function estAujourdhui(jour: number, aujourdhui: number): boolean {
  if (aujourdhui < 0) return false
  return jour === aujourdhui || (jour === -1 && aujourdhui >= 1 && aujourdhui <= 5)
}

// ── Galerie ─────────────────────────────────────────────────────────────────

/**
 * L'attribut `sizes` d'une vignette de grille.
 *
 * Sans lui, le navigateur suppose la pleine largeur et prend la plus grosse
 * variante : mesure, une photo de 1600 px pour une vignette de 168 px. La page
 * publiee fait au plus 520 px de large ; en dessous, chaque vignette occupe
 * 100/colonnes pour cent de l'ecran.
 */
export function sizesGrille(colonnesMobile: number, colonnes: number): string {
  const m = Math.max(1, colonnesMobile), d = Math.max(1, colonnes)
  return `(max-width: 520px) ${Math.round(100 / m)}vw, ${Math.round(520 / d)}px`
}

export type Photo = { src: string; legende: string }
export type Galerie = { titre: string; photos: Photo[]; layout: string; colonnes: number; colonnesMobile: number }

const NUMEROS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const entier = (v: unknown, defaut: number) => {
  const n = parseInt(txt(v), 10)
  return Number.isFinite(n) && n >= 1 ? n : defaut
}

export function galerie(c: Record<string, any> | null | undefined): Galerie | null {
  const src = c || {}
  // La legende suit SA photo : filtrer les deux ensemble, sinon retirer la
  // photo 2 decale toutes les descriptions d'un cran.
  const photos = NUMEROS
    .map(n => ({ src: txt(src[`img${n}`]), legende: txt(src[`img${n}_alt`]) }))
    .filter(p => p.src !== "")
  if (photos.length === 0) return null
  const layout = txt(src.layout) || "grid"
  const colonnes = entier(src.columns, 3)
  return {
    titre: txt(src.title),
    photos,
    layout,
    // « compact » impose au moins trois colonnes : c'est ce qui le rend compact.
    colonnes: layout === "compact" ? Math.max(colonnes, 3) : colonnes,
    colonnesMobile: entier(src.columns_mobile, colonnes),
  }
}

// ── Reseaux sociaux ─────────────────────────────────────────────────────────

export type Reseau = { cle: string; icone: string; couleur: string; libelle: string; compte: string; href: string }

/** La table des reseaux — UNE seule, celle de l'editeur, dans son ordre.
 *  La page publiee en tenait une copie qui repositionnait `website` en tete :
 *  la cle y etait deja, l'ancien « repli pour cles legacy » ne faisait donc que
 *  changer l'ordre d'affichage entre l'apercu et la page. */
export const RESEAUX: Record<string, { icon: string; color: string; label: string }> = SOCIAL_NETWORKS_MAP

const AFFICHAGES = new Set(["list", "icons", "grid"])

export function reseauxActifs(c: Record<string, any> | null | undefined): Reseau[] {
  const src = c || {}
  return Object.entries(RESEAUX)
    .filter(([cle]) => txt(src[cle]) !== "")
    .map(([cle, n]) => ({
      cle,
      icone: n.icon,
      couleur: n.color,
      // Le libelle personnalise vaut partout, y compris en affichage « icones »
      // ou il devient l'intitule lu par les lecteurs d'ecran.
      libelle: txt(src[`${cle}__label`]) || n.label,
      compte: txt(src[`${cle}__count`]),
      href: socialHref(cle, txt(src[cle])),
    }))
    .filter(r => r.href !== "")
}

export function affichageReseaux(c: Record<string, any> | null | undefined): "list" | "icons" | "grid" {
  const d = txt((c || {}).display)
  return (AFFICHAGES.has(d) ? d : "list") as "list" | "icons" | "grid"
}
