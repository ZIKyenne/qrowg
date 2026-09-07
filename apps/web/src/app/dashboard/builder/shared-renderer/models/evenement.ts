// Modeles PURS de la famille evenement (aucun React) : `event_guests`,
// `event_access`, `add_to_calendar` et `ticketing`.
//
// Ce qu'ils avaient :
//
//  · add_to_calendar — l'apercu dessinait TROIS boutons (Google, Apple,
//    Outlook), la page en publie DEUX. Le troisieme n'a jamais existe : il n'y
//    a que deux liens, l'un vers Google Agenda, l'autre un fichier .ics que
//    Apple ET Outlook ouvrent tous les deux. Et sans date saisie, l'apercu
//    dessinait quand meme un bouton rose « Ajouter a mon agenda » sur un bloc
//    que la page ne publie pas.
//
//  · ticketing — l'apercu dessinait la carte de billetterie complete, bouton
//    « Acheter mes billets » compris, meme entierement vide.
//
//  · event_access — sans plan ni adresse, l'apercu dessinait quand meme un
//    cadre de carte de 130 px avec une mappemonde dedans. La page n'en publie
//    aucun.
//
//  · event_guests — la fiche d'un invite affichait son role a 9 px et sa
//    description a 10 px cote apercu, contre 13 et 13,5 en ligne : l'apercu
//    ecrasait ces deux textes bien au-dela de son echelle.

import { calendarLinks, mapEmbedUrl, destinationUtile } from "../../types"
import { slugifyBase } from "@/lib/slug"

const txt = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

// ── Invités ─────────────────────────────────────────────────────────────────

export type Invite = { photo: string; nom: string; role: string; description: string }

export function invites(c: Record<string, any> | null | undefined): Invite[] {
  const src = c || {}
  const out: Invite[] = []
  for (let i = 1; i <= 50; i++) {
    const nom = txt(src[`g${i}_name`])
    if (!nom) continue
    out.push({ photo: txt(src[`g${i}_photo`]), nom, role: txt(src[`g${i}_role`]), description: txt(src[`g${i}_desc`]) })
  }
  return out
}

/** L'initiale du pastille quand l'invité n'a pas de photo. */
export function initialeInvite(nom: string): string {
  return (nom || "?")[0]?.toUpperCase() ?? "?"
}

// ── Accès ───────────────────────────────────────────────────────────────────

export type Transport = { icone: string; label: string }
export type Acces = { titre: string; plan: string; adresse: string; transports: Transport[] }

export function acces(c: Record<string, any> | null | undefined): Acces | null {
  const src = c || {}
  const transports: Transport[] = [1, 2, 3]
    .map(i => ({ icone: txt(src[`transport${i}_icon`]), label: txt(src[`transport${i}_label`]) }))
    .filter(t => t.label !== "")
  const adresse = txt(src.address)
  const plan = mapEmbedUrl(adresse, txt(src.embed_url))
  if (!plan && !adresse && transports.length === 0) return null
  return { titre: txt(src.title), plan, adresse, transports }
}

// ── Ajouter à mon agenda ────────────────────────────────────────────────────

export type LienAgenda = { label: string; href: string; fichier: string | null; couleur: string; fond: string; bordure: string }
export type Agenda = { nom: string; debut: string; lieu: string; liens: LienAgenda[] }

/** « 2026-08-15T20:30 » se lit « 2026-08-15 à 20:30 ». La page le faisait,
 *  l'aperçu affichait la valeur brute avec son « T ». */
export function dateLisible(v: unknown): string {
  return txt(v).replace("T", " à ")
}

export function agenda(c: Record<string, any> | null | undefined): Agenda | null {
  const src = c || {}
  const nom = txt(src.event_name)
  const cal = calendarLinks({ name: nom, start: txt(src.start_date), end: txt(src.end_date), location: txt(src.location), description: txt(src.description) })
  const google = destinationUtile(txt(src.google_url)) || cal?.google || ""
  if (!nom && !google) return null
  const liens: LienAgenda[] = []
  if (google) liens.push({ label: "📅 Google Agenda", href: google, fichier: null, couleur: "#4285F4", fond: "rgba(66,133,244,0.12)", bordure: "rgba(66,133,244,0.3)" })
  // Un seul fichier .ics, qu'Apple Agenda ET Outlook ouvrent : c'est pour cela
  // que le troisieme bouton de l'apercu n'avait pas lieu d'etre.
  // Le nom du fichier telecharge : « Concert d'ete » donnait « Concert_d_t_.ics »
  // — les accents etaient supprimes, pas translitteres, et le visiteur retrouvait
  // ca dans son dossier de telechargements. `slugifyBase` sait le faire.
  if (cal) liens.push({ label: "🍎 Apple / Outlook", href: cal.ics, fichier: `${slugifyBase(nom) || "evenement"}.ics`, couleur: "", fond: "", bordure: "" })
  return { nom, debut: dateLisible(src.start_date), lieu: txt(src.location), liens }
}

// ── Billetterie ─────────────────────────────────────────────────────────────

export type Billetterie = { nom: string; date: string; lieu: string; prix: string; cta: { label: string; href: string } | null }

export function billetterie(c: Record<string, any> | null | undefined): Billetterie | null {
  const src = c || {}
  const nom = txt(src.event_name)
  const href = destinationUtile(txt(src.url))
  if (!nom && !href) return null
  const plateforme = txt(src.platform)
  const suffixe = plateforme && plateforme !== "URL personnalisée" ? ` — ${plateforme}` : ""
  return {
    nom, date: txt(src.date), lieu: txt(src.venue), prix: txt(src.price),
    cta: href ? { label: (txt(src.label) || "Acheter mes billets") + suffixe, href } : null,
  }
}
