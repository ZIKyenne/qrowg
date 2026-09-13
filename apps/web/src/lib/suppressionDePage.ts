// suppressionDePage.ts — la suppression qui emporte les QR déjà collés.
//
// Relevé du 13 septembre. Ce que le produit demande de confirmer, avant de
// supprimer une page, tient en une phrase :
//
//   « Vous êtes sur le point de supprimer « X ». Cette action supprimera aussi
//     les blocs, LE QR CODE et toutes les données analytics associées. Elle est
//     irréversible. »
//
// Et ce que la base fait, depuis le schéma initial :
//
//     page_id uuid not null references public.pages(id) on delete cascade
//
// sur `qr_codes`, `scans`, `page_views`, `block_clicks`, `leads`. Donc :
//
//  · « le QR code », au singulier — une page en porte autant qu'elle a de
//    supports. Le lot v83 vient d'ouvrir ce chemin officiellement : vitrine,
//    tables, flyers, chacun son code vers la même page.
//  · ces codes sont IMPRIMÉS. Les supprimer ne les met pas en pause : il les
//    détruit. `short_code` est unique ; un nouveau QR en porterait un autre.
//    Autrement dit, il faut tout réimprimer — la phrase ne le dit pas.
//  · l'historique de scans part avec, sans qu'on dise combien.
//
// Une case à cocher mentale — « oui oui, supprimer » — suffit aujourd'hui à
// éteindre les autocollants de toutes les tables d'un restaurant. Module PUR.

import { nomDuQr } from "./nomDuQr"

export type SupportSupprime = { label?: string | null; short_code?: string | null }

export type CeQuiDisparait = {
  supports: SupportSupprime[]
  scans?: number
  vues?: number
  messages?: number
}

function nombre(n: number): string {
  return n.toLocaleString("fr-FR")
}

/**
 * Le nom d'un support. Une seule règle dans tout le produit, tenue par
 * `lib/nomDuQr` : le nom donné par le commerçant, sinon le titre de la page,
 * sinon le code. Ici on ne passe pas de titre de page — la page qu'on supprime
 * est la même pour tous ses supports, elle ne les distinguerait pas.
 */
export function nomDuSupport(s: SupportSupprime): string {
  return nomDuQr({ label: s.label, short_code: s.short_code })
}

/**
 * Ce qui disparaît, ligne par ligne, avec des nombres. On ne liste que ce qui
 * existe vraiment : annoncer « 0 message » à quelqu'un qui n'en a jamais reçu
 * n'apprend rien et noie ce qui compte.
 */
export function consequencesDeSuppression(c: CeQuiDisparait): string[] {
  const out: string[] = []
  const n = c.supports.length
  if (n > 0) {
    const noms = c.supports.slice(0, 4).map(nomDuSupport)
    const reste = n - noms.length
    const liste = noms.join(", ") + (reste > 0 ? `, et ${reste} de plus` : "")
    out.push(n === 1
      ? `1 QR imprimable : ${liste}`
      : `${n} QR imprimables : ${liste}`)
  }
  if (c.scans && c.scans > 0) out.push(`${nombre(c.scans)} scan${c.scans > 1 ? "s" : ""} enregistré${c.scans > 1 ? "s" : ""}`)
  if (c.vues && c.vues > 0) out.push(`${nombre(c.vues)} vue${c.vues > 1 ? "s" : ""} de la page`)
  if (c.messages && c.messages > 0) out.push(`${nombre(c.messages)} message${c.messages > 1 ? "s" : ""} reçu${c.messages > 1 ? "s" : ""}`)
  return out
}

/**
 * La phrase qui manque : ces codes-là sont dehors, et les détruire n'est pas
 * réversible — même en recréant un QR, le code serait différent.
 */
export function phraseCodesImprimes(nbSupports: number): string | null {
  if (nbSupports <= 0) return null
  return nbSupports === 1
    ? "Ce code est peut-être déjà collé ou distribué : il cessera de fonctionner définitivement. Un nouveau QR porterait un autre code — il faudrait réimprimer le support."
    : "Ces codes sont peut-être déjà collés ou distribués : ils cesseront de fonctionner définitivement. De nouveaux QR porteraient d'autres codes — il faudrait réimprimer les supports."
}

/**
 * Quand la perte est irrattrapable — un support imprimé, ou un historique de
 * scans — on demande d'écrire le nom de la page, comme le produit le fait déjà
 * pour la suppression d'un compte. Sinon, la confirmation ordinaire suffit : on
 * n'impose pas une friction à qui supprime un brouillon vide.
 */
export function exigeConfirmationEcrite(c: CeQuiDisparait): boolean {
  return c.supports.length > 0 || (c.scans ?? 0) > 0
}

/** Ce qu'il faut écrire : le titre de la page, tel qu'il s'affiche. */
export function confirmationAttendue(titre: string | null | undefined): string {
  return (titre || "").trim() || "SUPPRIMER"
}

/** La saisie correspond-elle ? Espaces et casse pardonnés, le reste non. */
export function confirmationValide(saisie: string, titre: string | null | undefined): boolean {
  return saisie.trim().toLowerCase() === confirmationAttendue(titre).toLowerCase()
}
