// Modeles PURS de `about`, `availability`, `announcement` et `faq` (aucun React).
//
// Les quatre blocs d'information qu'on trouve sur presque toutes les pages.
// Chacun avait son ecart, et trois d'entre eux publiaient — ou montraient —
// quelque chose que le commercant n'avait pas ecrit :
//
//  · about : l'apercu ecrivait « Votre histoire ici... » a la place du texte
//    manquant. La page, elle, ne publie rien. Le commercant composait donc
//    contre un paragraphe qui n'existerait jamais. Et avec un titre seul, la
//    page publiait un <p> vide : un trou dans la mise en page.
//
//  · availability : `availabilityStatus` retombe sur le PREMIER statut de la
//    liste, « Disponible ». Un bloc ou seul le message est saisi annoncait donc
//    au visiteur que le commercant EST disponible — une affirmation que
//    personne n'avait faite. Meme famille que les horaires inventes.
//
//  · announcement : l'apercu dessinait un cadre colore avec sa seule icone
//    quand titre et message etaient vides ; la page ne rend rien. Et la fenetre
//    de dates n'existait que cote public : le commercant voyait sa banniere
//    dans le canvas alors qu'elle etait deja expiree en ligne.
//
//  · faq : sans aucune question, la page ne publie rien — mais l'apercu
//    dessinait le titre, le sous-titre, la barre de recherche et les onglets de
//    categories. Un en-tete de FAQ qui n'existerait pas.

import { AVAILABILITY_STATUSES, announcementMeta, destinationUtile } from "../../types"

const txt = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

// ── À propos ────────────────────────────────────────────────────────────────

export type APropos = { emoji: string; titre: string; texte: string }

export function apropos(c: Record<string, any> | null | undefined): APropos | null {
  const src = c || {}
  const titre = txt(src.title), texte = txt(src.text)
  if (!titre && !texte) return null
  return { emoji: txt(src.emoji), titre, texte }
}

// ── Disponibilité ───────────────────────────────────────────────────────────

export type Disponibilite = {
  label: string; couleur: string; fond: string; bordure: string
  depuis: string; message: string; cta: { label: string; href: string } | null
}

/** Couleur du point quand aucun statut n'est choisi : neutre, sans affirmation. */
const NEUTRE = "#8A8478"

export function disponibilite(c: Record<string, any> | null | undefined): Disponibilite | null {
  const src = c || {}
  const cle = txt(src.status), message = txt(src.message), ctaLabel = txt(src.cta_label)
  if (!cle && !message && !ctaLabel) return null
  // Sans statut choisi, on n'en invente pas un : `availabilityStatus` retombait
  // sur « Disponible », le premier de la liste.
  const trouve = cle ? AVAILABILITY_STATUSES.find(s => s.key === cle) : undefined
  const perso = txt(src.dot_color)
  const couleur = /^#[0-9a-fA-F]{6}$/.test(perso) ? perso : (trouve?.color ?? NEUTRE)
  const href = destinationUtile(txt(src.cta_url))
  return {
    label: trouve?.label ?? "",
    couleur, fond: `${couleur}14`, bordure: `${couleur}40`,
    depuis: txt(src.available_from), message,
    cta: ctaLabel && href ? { label: ctaLabel, href } : null,
  }
}

// ── Annonce ─────────────────────────────────────────────────────────────────

export type Annonce = {
  icone: string; couleur: string; titre: string; message: string
  cta: { label: string; href: string } | null
  fermable: boolean; compact: boolean; debut: string; fin: string
}

export function annonce(c: Record<string, any> | null | undefined): Annonce | null {
  const src = c || {}
  const titre = txt(src.title), message = txt(src.message)
  if (!titre && !message) return null
  const meta = announcementMeta(txt(src.type))
  const perso = txt(src.color)
  const ctaLabel = txt(src.cta_label)
  const href = destinationUtile(txt(src.cta_url))
  return {
    icone: txt(src.emoji) || meta.icon,
    couleur: /^#[0-9a-fA-F]{6}$/.test(perso) ? perso : meta.color,
    titre, message,
    cta: ctaLabel && href ? { label: ctaLabel, href } : null,
    fermable: txt(src.dismissible) === "Oui",
    compact: txt(src.style) === "Compact",
    debut: txt(src.start_date), fin: txt(src.end_date),
  }
}

export type EtatFenetre = "avant" | "pendant" | "apres"

/**
 * Où en est l'annonce dans sa fenêtre d'affichage.
 * Une date illisible est ignorée plutôt que de masquer par erreur.
 * `maintenant` négatif = heure encore inconnue (rendu serveur) : on répond
 * « pendant », comme le faisait la page, pour ne pas dépendre de l'horloge.
 */
export function etatFenetre(debut: string, fin: string, maintenant: number): EtatFenetre {
  if (maintenant < 0) return "pendant"
  const d = debut ? Date.parse(debut) : NaN
  const f = fin ? Date.parse(fin) : NaN
  if (!isNaN(d) && maintenant < d) return "avant"
  if (!isNaN(f) && maintenant > f) return "apres"
  return "pendant"
}

/** Ce que l'éditeur dit à l'auteur quand sa bannière n'est pas visible en ligne. */
export function mentionFenetre(etat: EtatFenetre): string | null {
  if (etat === "avant") return "Programmée : pas encore visible en ligne."
  if (etat === "apres") return "Expirée : elle n’est plus visible en ligne."
  return null
}

// ── FAQ ─────────────────────────────────────────────────────────────────────

export type Question = { q: string; a: string; categorie: string; lien: { href: string; label: string } | null }
export type Faq = { titre: string; sousTitre: string; style: string; recherche: boolean; items: Question[]; categories: string[] }

const STYLES = new Set(["Accordéon", "Compact", "Cartes"])

export function faq(c: Record<string, any> | null | undefined): Faq | null {
  const src = c || {}
  const items: Question[] = []
  for (let i = 1; i <= 8; i++) {
    const q = txt(src[`q${i}`])
    if (!q) continue
    const href = destinationUtile(txt(src[`q${i}_link`]))
    items.push({
      q, a: txt(src[`a${i}`]), categorie: txt(src[`q${i}_cat`]),
      lien: href ? { href, label: txt(src[`q${i}_link_label`]) || "En savoir plus" } : null,
    })
  }
  // Sans question, il n'y a pas de FAQ — et donc pas d'en-tête non plus.
  if (items.length === 0) return null
  const style = txt(src.style)
  return {
    titre: txt(src.title), sousTitre: txt(src.subtitle),
    style: STYLES.has(style) ? style : "Accordéon",
    recherche: txt(src.search) === "Oui",
    items,
    categories: Array.from(new Set(items.map(i => i.categorie).filter(Boolean))),
  }
}

/** Le filtre appliqué par la recherche et les onglets. Pur, donc éprouvable. */
export function filtrer(items: Question[], recherche: string, categorie: string): Question[] {
  const q = recherche.trim().toLowerCase()
  return items.filter(it =>
    (!categorie || it.categorie === categorie) &&
    (!q || it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)))
}
