// Une page publiée montre-t-elle quelque chose ?
//
// ── Le défaut ──────────────────────────────────────────────────────────────
//
// La page publiée porte, depuis longtemps, la bonne phrase pour le visiteur qui
// arrive trop tôt :
//
//     Cette page est en préparation
//     Revenez bientôt, le contenu arrive.
//
// Elle ne s'affichait qu'à une condition : `blocks.length === 0`. Or un
// commerçant qui ajoute quatre blocs depuis la bibliothèque et les laisse vides
// a bien quatre blocs — et aucun ne publie quoi que ce soit. Le client scanne
// le QR code collé sur la vitrine, et tombe sur une page **entièrement
// blanche**, avec le seul badge QRowg en bas.
//
// Le produit savait pourtant : `hasPublishableContent` répond exactement à cette
// question depuis les lots v166 à v171, pour les cent quarante-six blocs du
// catalogue. `jugerPage` le savait aussi, à sa façon — elle retire déjà cette
// page de Google pour « texte insuffisant ». Personne ne le disait au visiteur,
// ni au commerçant avant qu'il publie.
//
// ── Ce que « montrer quelque chose » veut dire ────────────────────────────
//
// Un bloc masqué ne publie rien. Un bloc vide non plus. Et une décoration —
// un trait, une marge, une bande de couleur — n'est pas du contenu : une page
// faite de trois traits ne montre rien à qui l'a scannée.

import { hasPublishableContent } from "@/app/dashboard/builder/blockEmptyState"

/** Ce qui ne porte aucun contenu, même rendu : c'est leur travail d'être vides. */
export const DECORATIONS: readonly string[] = [
  "divider", "spacer", "shape_divider", "decor_line", "color_band", "back_to_top",
]

/**
 * Les formulaires MONTRENT quelque chose sans rien contenir : leurs champs SONT
 * le contenu. Une page qui ne porte qu'un formulaire de contact est utile — le
 * client scanne, il écrit, le commerçant reçoit.
 *
 * Aucune branche ne les traite à part, et c'est voulu : aucun n'a de détecteur
 * (le rendu legacy les sert seul), donc `hasPublishableContent` leur répond
 * « plein » par prudence, ce qui est déjà la bonne réponse. Une mutation me l'a
 * montré — retirer la branche que j'avais écrite ne cassait rien, parce qu'elle
 * ne servait à rien. Cette liste NOMME donc les blocs pour lesquels la prudence
 * tombe juste, et le cliquet plus bas s'en sert. Le jour où un formulaire
 * recevra un détecteur, ce cliquet échouera et posera la question au bon moment.
 */
export const FORMULAIRES: readonly string[] = [
  "contact_form", "reservation_form", "event_register", "rsvp", "booking_request",
  "quote_form", "quote_request", "lead_form",
]

export type BlocDePage = { type: string; content?: Record<string, any> | null; visible?: boolean }

/** Ce bloc montrera-t-il quelque chose au visiteur ? */
export function blocQuiMontre(b: BlocDePage): boolean {
  if (b.visible === false) return false
  if (DECORATIONS.includes(b.type)) return false
  return hasPublishableContent(b.type, b.content ?? {})
}

/** La page a-t-elle au moins un bloc qui montre quelque chose ? */
export function pageQuiMontreQuelqueChose(blocks: readonly BlocDePage[]): boolean {
  return blocks.some(blocQuiMontre)
}
