// tarifs.ts — l'arithmétique de la facturation annuelle, et elle seule.
//
// ── Ce qu'on répare ici ────────────────────────────────────────────────────
//
// Le 29 septembre, l'accueil annonçait « 149,04 € / an » et la page d'abonnement
// « 149 € / an » pour le même plan. Aucune des deux ne disait la vérité : toutes
// deux RECONSTRUISAIENT la facture en multipliant par douze un équivalent
// mensuel arrondi (12,42 × 12 = 149,04), avec deux arrondis d'affichage
// différents. La facture, elle, vaut 149 €.
//
// Le sens de lecture est donc inversé, une fois pour toutes : **le montant
// stocké est celui qui sera facturé**, et l'équivalent mensuel en est dérivé
// pour l'affichage. On ne remonte jamais de l'équivalent vers la facture.
//
// À côté de ça, l'écran d'abonnement portait un badge « -20 % » commun aux deux
// plans, alors que la remise réelle vaut 35 % pour l'un et 17 % pour l'autre, et
// l'accueil promettait « jusqu'à 2 mois offerts » quand le plan Établissement en
// offre plus de quatre. Les deux chiffres se calculent : ils ne s'écrivent plus.
//
// Module PUR : il ne prend que des nombres, n'importe rien, et se teste seul
// (voir tarifs.test.ts). C'est ce qui permet à `plans.ts` de s'en servir pour
// dériver ses propres champs sans dépendance circulaire.

/** Arrondi au centime — la seule précision qu'un prix affiché puisse avoir. */
export const auCentime = (n: number): number => Math.round(n * 100) / 100

/**
 * Équivalent mensuel d'un abonnement payé à l'année, arrondi au centime.
 * C'est un AFFICHAGE : 149 € l'an se lisent « 12,42 € / mois », mais douze fois
 * 12,42 € ne font pas 149 €. Ne jamais s'en servir pour reconstruire la facture.
 */
export const mensuelEquivalent = (totalAnnuel: number): number => auCentime(totalAnnuel / 12)

/** Ce que coûtent douze mois payés mois par mois. */
export const totalMensualise = (prixMensuel: number): number => auCentime(prixMensuel * 12)

/** Ce que l'annuel fait gagner sur une année, en euros. Jamais négatif. */
export const economieAnnuelle = (prixMensuel: number, totalAnnuel: number): number =>
  Math.max(0, auCentime(totalMensualise(prixMensuel) - totalAnnuel))

/**
 * La remise, en pourcentage entier ARRONDI VERS LE BAS.
 *
 * Vers le bas parce qu'un pourcentage annoncé est une promesse : mieux vaut en
 * tenir un peu plus que d'en promettre un peu trop. 34,65 % s'annonce « 34 % ».
 */
export function remisePourcent(prixMensuel: number, totalAnnuel: number): number {
  const plein = totalMensualise(prixMensuel)
  if (plein <= 0) return 0
  return Math.max(0, Math.floor((economieAnnuelle(prixMensuel, totalAnnuel) / plein) * 100))
}

/** Combien de mois l'annuel offre, arrondi vers le bas. 0 si l'offre n'en offre pas. */
export function moisOfferts(prixMensuel: number, totalAnnuel: number): number {
  if (prixMensuel <= 0) return 0
  return Math.max(0, Math.floor(economieAnnuelle(prixMensuel, totalAnnuel) / prixMensuel))
}

type Tarifable = { priceMonthly: number; priceAnnualTotal: number }

/**
 * La meilleure remise de la grille — ce que « jusqu'à » a le droit de dire.
 * Les plans gratuits n'entrent pas dans le calcul : 0 € remisé de 0 %, ce n'est
 * pas une offre, et ça tirerait le maximum vers le bas pour rien.
 */
export const remiseMaxPourcent = (plans: readonly Tarifable[]): number =>
  plans.filter(p => p.priceMonthly > 0)
       .reduce((max, p) => Math.max(max, remisePourcent(p.priceMonthly, p.priceAnnualTotal)), 0)

/** Le plus grand nombre de mois offerts de la grille — même règle. */
export const moisOffertsMax = (plans: readonly Tarifable[]): number =>
  plans.filter(p => p.priceMonthly > 0)
       .reduce((max, p) => Math.max(max, moisOfferts(p.priceMonthly, p.priceAnnualTotal)), 0)

/**
 * Un montant d'euros tel qu'on l'écrit sur une facture : « 149 € », « 1 490 € ».
 * Les centimes n'apparaissent que s'il y en a — un total annuel rond ne doit pas
 * s'afficher « 149,00 », et surtout jamais « 149,04 » quand il vaut 149.
 */
export const fmtEuros = (n: number): string =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
