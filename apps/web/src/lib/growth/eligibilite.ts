// Qui a le droit de recevoir une proposition — et qui ne l'a pas.
//
// Module PUR, et volontairement SÉVÈRE. Chaque refus porte une raison en toutes
// lettres : une éligibilité qui rend `false` sans dire pourquoi est
// inexploitable, et personne ne saura si elle est trop large ou trop étroite.
//
// ── Pourquoi un « non » par défaut ─────────────────────────────────────────
//
// Les trois critères ci-dessous refusent quand ils ne SAVENT pas, et non
// seulement quand ils savent que non. Un annuaire muet sur l'état
// administratif ne dit pas « en activité » : il ne dit rien. Fabriquer une page
// au nom d'un établissement fermé, puis la lui proposer, serait le genre
// d'erreur qu'on ne rattrape pas par un correctif.

import { codeNafNormalise, estEnActivite, type FicheEntreprise } from "./ficheEntreprise"

/**
 * Les activités pour lesquelles une page QRowg a un sens.
 *
 * Codes NAF rév. 2. ⚠️ Une révision 2025 existe et renumérote une partie des
 * codes ; l'annuaire expose les deux. Tant qu'une réponse réelle n'a pas été
 * constatée (voir `ficheEntreprise.ts`), cette liste ne couvre que la rév. 2 —
 * c'est écrit ici pour qu'on ne découvre pas le trou en production.
 *
 * La liste est EXPLICITE et commentée : une famille entière (« tout le 56 »)
 * ferait entrer la restauration collective sous contrat, qui sert des salariés
 * d'entreprise sur un site fermé et n'a aucun passant à qui montrer un QR code.
 */
export const ACTIVITES_ELIGIBLES: Record<string, string> = {
  "5610A": "restauration traditionnelle",
  "5610B": "cafétéria ou libre-service",
  "5610C": "restauration de type rapide",
  "5621Z": "traiteur",
  "5629B": "autre service de restauration",
  "5630Z": "débit de boissons",
}

/**
 * Accepte-t-on les entrepreneurs individuels ?
 *
 * ⚠️ DÉCISION DU PROPRIÉTAIRE, posée ici au plus prudent en attendant.
 *
 * Pour un entrepreneur individuel, la dénomination publiée EST le nom d'une
 * personne physique : la fiche devient une donnée personnelle, et sa
 * conservation comme son usage relèvent d'une base légale qui n'est pas encore
 * arrêtée (c'est la même décision qui bloque la phase 3). Tant qu'elle ne l'est
 * pas, on ne constitue pas le fichier.
 *
 * Conséquence assumée et à connaître : **beaucoup de restaurants sont des
 * entrepreneurs individuels**. Ce `false` écarte donc une part réelle du
 * marché. Le basculer est une ligne — mais c'est une décision, pas un réglage.
 */
export const ACCEPTE_ENTREPRENEUR_INDIVIDUEL = false

export type Verdict = {
  eligible: boolean
  /** Les raisons du refus, en toutes lettres. Vide quand c'est accepté. */
  refus: string[]
  /** L'activité reconnue, quand elle l'est. */
  activite: string | null
}

/**
 * L'établissement peut-il recevoir une proposition ?
 *
 * Toutes les raisons sont collectées, pas seulement la première : savoir qu'une
 * fiche est à la fois cessée ET hors périmètre vaut mieux que de corriger
 * l'activité pour découvrir ensuite qu'elle est fermée.
 */
export function jugerEligibilite(fiche: FicheEntreprise): Verdict {
  const refus: string[] = []

  const actif = estEnActivite(fiche)
  if (actif === false) refus.push("établissement cessé")
  else if (actif === undefined) refus.push("état administratif inconnu")

  const code = codeNafNormalise(fiche.codeActivite)
  const activite = ACTIVITES_ELIGIBLES[code] ?? null
  if (!code) refus.push("activité non renseignée")
  else if (!activite) refus.push(`activité hors périmètre (${code})`)

  if (fiche.entrepreneurIndividuel === true && !ACCEPTE_ENTREPRENEUR_INDIVIDUEL) {
    refus.push("entrepreneur individuel : la fiche est une donnée personnelle")
  }

  if (!fiche.nom) refus.push("sans dénomination")

  return { eligible: refus.length === 0, refus, activite }
}

/**
 * Le genre de départ, déduit du SEUL code d'activité.
 *
 * `null` quand le code ne le dit pas : le générateur prendra alors le modèle le
 * plus neutre. Déduire « bistrot » d'un code de restauration traditionnelle est
 * déjà une approximation — on ne l'étend pas aux codes qui ne distinguent rien.
 */
export function genreDepuisActivite(fiche: FicheEntreprise): "bistrot" | "rapide" | "bar" | null {
  switch (codeNafNormalise(fiche.codeActivite)) {
    case "5610A": return "bistrot"
    case "5610C": return "rapide"
    case "5630Z": return "bar"
    // 5610B (cafétéria), 5621Z (traiteur) et 5629B ne tranchent pas entre les
    // trois modèles : on ne choisit pas à leur place.
    default: return null
  }
}
