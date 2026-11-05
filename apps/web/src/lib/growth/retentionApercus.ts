// Combien de temps on garde une proposition, et ce qu'on en garde.
//
// ── Trois durées, trois raisons ────────────────────────────────────────────
//
// 1. **30 jours** : l'aperçu est consultable (`jetonApercu.JOURS_DE_VALIDITE`).
//    Au-delà, le lien rend 404.
//
// 2. **+7 jours** : il reste en base sans être servi. Une semaine de grâce
//    pour répondre à « mon lien ne marche plus » — sans elle, la ligne est
//    déjà effacée quand la question arrive, et on ne peut rien dire.
//
// 3. **Ensuite** : effacé. Une proposition qui n'est plus servie et dont
//    personne n'a parlé depuis une semaine n'a aucune raison de rester. Ce
//    n'est pas une question de place : ces lignes décrivent des établissements
//    TIERS, relevés sur leurs sites. Les garder « au cas où » serait
//    constituer un fichier d'entreprises qu'on n'a pas décidé de constituer.
//
// ── Ce qu'on garde quand même, et pourquoi ────────────────────────────────
//
// Une proposition REVENDIQUÉE a produit une vraie page. Sa ligne devient une
// mesure : elle relie un relevé à une activation. On la garde — mais vidée de
// son contenu (`rendu`), qui pèse et ne sert plus à rien une fois la page
// créée. Garder la trace sans garder le dossier.
//
// Module PUR : il reçoit son horloge, il ne la lit pas.

/** Jours de grâce après l'expiration, avant effacement. */
export const JOURS_DE_GRACE = 7

/** Tout ce qui a expiré avant cette date part. */
export function coupureDePurge(maintenant: Date, jours: number = JOURS_DE_GRACE): string {
  return new Date(maintenant.getTime() - jours * 24 * 60 * 60 * 1000).toISOString()
}

export type SortDApercu = "garder" | "effacer" | "vider"

/**
 * Que faire d'un aperçu.
 *
 * L'ordre des questions compte : on regarde d'abord s'il est encore servi,
 * ensuite s'il a produit quelque chose. Inverser reviendrait à vider le
 * contenu d'un aperçu encore consultable.
 */
export function sortDe(
  apercu: { expireLe: string; revendiquePar: string | null },
  maintenant: Date,
  jours: number = JOURS_DE_GRACE,
): SortDApercu {
  const expiration = new Date(apercu.expireLe).getTime()
  if (Number.isNaN(expiration)) return "garder"          // date illisible : on ne devine pas
  if (expiration > maintenant.getTime()) return "garder" // encore servi
  if (expiration > new Date(coupureDePurge(maintenant, jours)).getTime()) return "garder" // en grâce
  return apercu.revendiquePar ? "vider" : "effacer"
}

/** Un prospect dont plus aucun aperçu ne subsiste n'a plus de raison d'être. */
export function prospectDevenuInutile(nbApercusRestants: number): boolean {
  return nbApercusRestants === 0
}
