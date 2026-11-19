// messagesAJour.ts — Messages se tient à jour tout seul (lot fast-food 2, 19 nov.).
//
// Un « Appel en salle » qui n'apparaît qu'en rechargeant la page ne sert à rien
// en plein service. Messages relit donc la liste toutes les 30 s tant que
// l'écran est visible. Ce module est la règle de FUSION, pure : les nouveaux
// arrivent en tête, et ce que le commerçant vient de changer (lu, statut) n'est
// jamais écrasé par une lecture plus ancienne.

export const RAFRAICHIR_TOUTES_LES_MS = 30_000

/** Les demandes nouvelles (absentes de `actuels`) en tête, les autres inchangées. */
export function fusionnerMessages<T extends { id: string }>(actuels: readonly T[], frais: readonly T[]): T[] {
  const connus = new Set(actuels.map(m => m.id))
  const nouveaux = frais.filter(m => !connus.has(m.id))
  return nouveaux.length ? [...nouveaux, ...actuels] : (actuels as T[])
}
