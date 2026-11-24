// Rendu unique, lot 5 — les actions externes (24 nov.).
//
// Huit blocs qui envoient le visiteur ailleurs : agenda, rendez-vous,
// réservation de table, boutique, paiement, demande de devis, fiche contact —
// et le bloc QR, qui ne publie rien. Ce que chacun publie se décide ICI.
//
// Ce que les copies disaient de différent :
//   · l'aperçu du bloc QR dessinait un FAUX QR code, tiré au hasard
//     (`Math.random()`) à chaque rendu, sous une fausse adresse « /q/... » ;
//   · l'aperçu de la demande de devis dessinait son bouton sans adresse — le
//     bloc n'avait pas de détecteur du tout ;
//   · l'aperçu peignait la réservation de table en rouge et le rendez-vous en
//     bleu ; la page publiée, dans la couleur du thème ;
//   · rendez-vous, agenda et table se publiaient pour n'importe quel texte
//     dans l'adresse, puis la page retirait le bouton qui n'y menait pas : une
//     carte sans action.
import { destinationUtile, paymentLink, paymentBrand, buildVCard } from "../../types"
import { texteUtile } from "./repeaterExtract"

type C = Record<string, any> | null | undefined
const externe = (href: string) => /^https?:/i.test(href)

// ── calendly ────────────────────────────────────────────────────────────────
/** Le titre de la carte est celui du commerçant ; le bouton a son propre
 *  libellé (vague 24 : `label` servait aux deux, doublé en ligne). */
export function agendaEnLigne(c: C) {
  const href = destinationUtile(c?.url)
  return href ? { titre: texteUtile(c?.label), description: texteUtile(c?.description), href } : null
}

// ── booking_button ──────────────────────────────────────────────────────────
export function priseDeRendezVous(c: C) {
  const href = destinationUtile(c?.url)
  if (!href) return null
  return { label: texteUtile(c?.label) || "Prendre rendez-vous", description: texteUtile(c?.description), plateforme: texteUtile(c?.platform), href }
}

// ── table_booking ───────────────────────────────────────────────────────────
export function reservationDeTable(c: C) {
  const href = destinationUtile(c?.url)
  if (!href) return null
  return { label: texteUtile(c?.label) || "Réserver une table", plateforme: texteUtile(c?.platform), href }
}

// ── external_shop ───────────────────────────────────────────────────────────
export function boutiqueEnLigne(c: C) {
  const href = destinationUtile(c?.url)
  if (!href) return null
  return { label: texteUtile(c?.label) || "Voir la boutique", plateforme: texteUtile(c?.platform), description: texteUtile(c?.description), href, externe: externe(href) }
}

// ── quote_request ───────────────────────────────────────────────────────────
export function demandeDeDevis(c: C) {
  const href = destinationUtile(c?.url)
  if (!href) return null
  return { label: texteUtile(c?.label) || "Demander un devis", description: texteUtile(c?.description), href, externe: externe(href) }
}

// ── payment_button ──────────────────────────────────────────────────────────
/** `paymentLink` construit l'adresse (URL collée, ou pseudo PayPal/Lydia…) ;
 *  `destinationUtile` la juge, comme toutes les autres. */
export function boutonDePaiement(c: C) {
  const href = destinationUtile(paymentLink((c || {}) as Parameters<typeof paymentLink>[0]))
  if (!href) return null
  const marque = paymentBrand(c?.platform)
  return { label: texteUtile(c?.label) || "Payer maintenant", montant: texteUtile(c?.amount), href, couleur: marque.color, icone: marque.icon }
}

// ── vcard ───────────────────────────────────────────────────────────────────
/** Une fiche à enregistrer dans le téléphone : il lui faut un nom, un numéro
 *  ou une adresse e-mail. Le fichier est construit ici, une fois. */
export function ficheContact(c: C) {
  const nom = texteUtile(c?.name), telephone = texteUtile(c?.phone), email = texteUtile(c?.email)
  if (!nom && !telephone && !email) return null
  return {
    nom, entreprise: texteUtile(c?.company),
    label: texteUtile(c?.label) || "Ajouter à mes contacts",
    href: `data:text/vcard;charset=utf-8,${encodeURIComponent(buildVCard((c || {}) as Parameters<typeof buildVCard>[0]))}`,
    fichier: `${(nom || "contact").replace(/\s+/g, "_")}.vcf`,
  }
}
