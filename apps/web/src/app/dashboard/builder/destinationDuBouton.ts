// destinationDuBouton — « où mène ce bouton ? », dit avec les mots du commerçant.
//
// Relevé du 20 novembre, éditeur au téléphone. Le bouton d'une page neuve
// (« Me contacter ») arrive sans destination, et le seul champ proposé est
// « Lien » — un champ d'adresse web. Pour qu'un client puisse APPELER, il
// fallait savoir écrire `tel:0612345678` ; pour WhatsApp, `https://wa.me/33…`
// sans le 0 ni le « + » ; pour un e-mail, `mailto:`. Personne ne sait ça, et
// le bouton part sans lien — donc n'est pas publié.
//
// Ici : on choisit Site · Appel · WhatsApp · E-mail, on tape son numéro ou son
// adresse comme on l'écrirait sur une carte de visite, et le lien est fabriqué
// par les règles qui décident déjà en ligne (`lib/lienDeContact`). Rien de
// nouveau n'est stocké : la valeur reste un lien dans le même champ `url`, que
// le rendu public lit sans changement.
//
// Module PUR, testé seul (destinationDuBouton.test.ts).

import { lienEmail, lienTelephone, lienWhatsApp } from "@/lib/lienDeContact"

export type SorteDeDestination = "site" | "appel" | "whatsapp" | "email"

export interface Sorte {
  id: SorteDeDestination
  libelle: string
  placeholder: string
  /** Clavier proposé au téléphone. */
  inputMode: "url" | "tel" | "email"
}

export const SORTES_DE_DESTINATION: readonly Sorte[] = [
  { id: "site", libelle: "Site", placeholder: "monsite.fr ou lien complet", inputMode: "url" },
  { id: "appel", libelle: "Appel", placeholder: "06 12 34 56 78", inputMode: "tel" },
  { id: "whatsapp", libelle: "WhatsApp", placeholder: "06 12 34 56 78", inputMode: "tel" },
  { id: "email", libelle: "E-mail", placeholder: "contact@monsite.fr", inputMode: "email" },
]

/** WhatsApp sans indicatif saisi : la France, comme le reste de l'éditeur (v304). */
export const INDICATIF_PAR_DEFAUT = "33"

const WA = /^https?:\/\/(?:api\.)?wa\.me\/(\d+)\/?(?:\?.*)?$/i

/** Ce que le champ montre pour un lien déjà enregistré. */
export function lireDestination(url?: string | null): { sorte: SorteDeDestination; saisie: string } {
  const u = (url || "").trim()
  if (/^tel:/i.test(u)) return { sorte: "appel", saisie: u.slice(4) }
  if (/^mailto:/i.test(u)) return { sorte: "email", saisie: u.slice(7).split("?")[0] }
  const wa = u.match(WA)
  if (wa) return { sorte: "whatsapp", saisie: "+" + wa[1] }
  // « # » est la valeur des modèles qui n'ont pas encore de lien : rien à montrer.
  return { sorte: "site", saisie: /^#*$/.test(u) ? "" : u }
}

/** Le lien enregistré pour une saisie. `""` quand il n'y a encore rien d'utilisable. */
export function ecrireDestination(sorte: SorteDeDestination, saisie: string): string {
  const s = (saisie || "").trim()
  if (!s) return ""
  switch (sorte) {
    case "appel": return lienTelephone(s)
    case "whatsapp": return lienWhatsApp(s, undefined, INDICATIF_PAR_DEFAUT)
    // `lienEmail` : la même règle que le rendu public. Une adresse encore
    // incomplète n'est pas enregistrée — le champ la garde pendant la frappe,
    // et le bouton reste annoncé sans destination tant qu'elle ne tient pas.
    case "email": return lienEmail(s) ?? ""
    case "site": return s
  }
}

/** Changer de sorte garde le numéro entre Appel et WhatsApp ; ailleurs on repart de zéro. */
export function saisieApresChangement(de: SorteDeDestination, vers: SorteDeDestination, saisie: string): string {
  const tel = (x: SorteDeDestination) => x === "appel" || x === "whatsapp"
  return tel(de) && tel(vers) ? saisie : ""
}
