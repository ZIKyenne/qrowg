// pauseDesPages.ts — ce que devient un QR DE PAGE quand le plan descend.
//
// Décision du 14 novembre 2026 (audit A1) : les conditions le promettaient,
// le code ne le faisait pas. « À l'échéance, votre compte passe au plan
// Gratuit. Rien n'est supprimé. Ce qui dépasse les limites est mis en pause,
// et vous choisissez ce que vous gardez actif. »
//
// Jusqu'ici, seuls les QR MODIFIABLES (instant_qrs) étaient réconciliés ; les
// QR de page restaient tous actifs, à vie, après une résiliation.
//
// Règles (même famille que lib/dynamicReconcile) :
//  · rien n'est supprimé, aucune URL ne change : le QR imprimé reste valable ;
//  · les QR ACTIFS sont servis d'abord, du plus ancien au plus récent — ainsi
//    un choix fait par le client (pause de l'un, activation de l'autre) n'est
//    jamais défait par un renouvellement ou un rejeu de notification ;
//  · au-delà du quota, un actif passe en pause, motif « quota » ;
//  · une pause « quota » se rallume d'elle-même quand le plan remonte ;
//  · une pause manuelle, un brouillon, une archive : on n'y touche jamais.
// Module PUR : la route webhook applique.

export const PAUSE_PAR_LE_PLAN = "quota"

/**
 * La colonne `qr_codes.paused_reason` manque-t-elle ? (migration
 * 20261114120000 non appliquée). Le code part en production AVANT elle : il
 * doit alors continuer à pauser et activer comme avant, sans la réconciliation.
 */
export function colonneMotifAbsente(erreur: { code?: string; message?: string } | null | undefined): boolean {
  if (!erreur) return false
  return erreur.code === "42703" || erreur.code === "PGRST204" || /paused_reason/.test(erreur.message ?? "")
}

export type QrDePage = {
  id: string
  status: string | null          // active | paused | draft | archived | null (historique = actif)
  paused_reason?: string | null
}

export type OperationPage = { id: string; patch: { status: "active" | "paused"; paused_reason: string | null } }

const estActif = (q: QrDePage) => q.status === "active" || q.status == null

/** `qrs` triés du plus ANCIEN au plus récent. `limite` null = illimité. */
export function planPagesReconcile(qrs: readonly QrDePage[], limite: number | null): OperationPage[] {
  const cap = limite === null ? Infinity : limite
  const ops: OperationPage[] = []
  let places = 0
  // 1) Les actifs gardent leur place, dans l'ordre ; le surplus s'éteint.
  for (const q of qrs) {
    if (!estActif(q)) continue
    if (places < cap) { places++; continue }
    ops.push({ id: q.id, patch: { status: "paused", paused_reason: PAUSE_PAR_LE_PLAN } })
  }
  // 2) Les places restantes rallument ce que le plan avait éteint.
  for (const q of qrs) {
    if (places >= cap) break
    if (q.status === "paused" && q.paused_reason === PAUSE_PAR_LE_PLAN) {
      ops.push({ id: q.id, patch: { status: "active", paused_reason: null } })
      places++
    }
  }
  return ops
}

/** Combien de QR de page s'éteindraient si le quota tombait à `limite`. */
export function pagesQuiSArretent(qrs: readonly QrDePage[], limite: number | null): number {
  return planPagesReconcile(qrs, limite).filter(o => o.patch.status === "paused").length
}

/** L'avertissement AVANT. Null quand rien ne s'arrête. */
export function phrasePagesAvant(nb: number): string | null {
  if (nb <= 0) return null
  return nb === 1
    ? "1 de vos pages serait mise en pause : son QR afficherait un écran de pause jusqu'à ce que vous la réactiviez."
    : `${nb} de vos pages seraient mises en pause : leurs QR afficheraient un écran de pause jusqu'à ce que vous les réactiviez.`
}

/** Ce qu'on écrit APRÈS la bascule. */
export function phrasePagesApres(nb: number, limite: number | null): string | null {
  if (nb <= 0) return null
  const couvertes = limite === null ? "toutes" : limite === 1 ? "une seule" : `${limite}`
  return nb === 1
    ? `1 de vos pages a été mise en pause : votre plan n'en couvre plus que ${couvertes} active${limite === 1 ? "" : "s"}. Choisissez celle que vous gardez en ligne depuis « Mes pages », bouton « QR » ; le QR imprimé reste valable.`
    : `${nb} de vos pages ont été mises en pause : votre plan n'en couvre plus que ${couvertes} active${limite === 1 ? "" : "s"}. Choisissez celles que vous gardez en ligne depuis « Mes pages », bouton « QR » ; les QR imprimés restent valables.`
}
