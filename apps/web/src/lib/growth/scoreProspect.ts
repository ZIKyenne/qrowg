// Dans quel ordre traiter les prospects éligibles — et quand refuser de les
// classer.
//
// Module PUR. Aucun appel réseau, aucune lecture de base : il reçoit ce qui a
// déjà été relevé et rend un verdict.
//
// ── Ce que ce module ne prétend PAS savoir ─────────────────────────────────
//
// Il ne prédit aucune vente, aucune probabilité, aucun « taux de conversion
// estimé ». Rien dans ce dépôt n'a jamais observé une conversion de prospection
// — il n'y a pas eu une seule campagne. Un chiffre de ce genre serait inventé,
// et inventer est précisément ce que `profilEtablissement.ts` interdit pour les
// données, donc aussi pour les prédictions qu'on en tire.
//
// Ce qu'il sait, en revanche, est mesurable sans rien supposer :
//
//   · combien de faits VÉRIFIÉS on détient pour fabriquer une page réelle ;
//   · combien de faits utiles leur présence web ne donne PAS à lire.
//
// ── Pourquoi deux axes, et pas un score sur cent ───────────────────────────
//
// `controleQualite.ts` l'écrit déjà pour la QA : « il n'y a pas de score sur
// cent […] un nombre invite à négocier avec lui ». Ici le motif est encore plus
// net : les deux axes tirent en sens CONTRAIRE, et une moyenne les annulerait.
//
//   · beaucoup de matière, rien d'illisible → leur site fait déjà le travail ;
//     la proposition n'a presque rien à apporter ;
//   · rien de lisible, donc rien à relever → il y a tout à apporter, mais pas
//     de quoi fabriquer la page qui le montrerait.
//
// Les deux cas méritent d'attendre, pour des raisons OPPOSÉES. Un score unique
// les mettrait tous les deux « au milieu », exactement là où on ne sait plus
// quoi en faire. D'où un rang nommé plutôt qu'un nombre : il dit ce qu'il faut
// faire ensuite.
//
// ── Ce que « illisible » veut dire, exactement ─────────────────────────────
//
// Attention au mot. `releverLeSite` ne lit que ce qui est DÉCLARÉ pour une
// machine : le JSON-LD, un lien `tel:`, un lien vers une plateforme connue. Un
// restaurant dont les horaires sont peints sur une image, ou dont le numéro est
// un simple texte, n'a donc pas d'horaires ni de téléphone dans son profil —
// alors que son site les affiche très bien à un œil humain.
//
// Un champ absent ne prouve donc PAS que le site l'ignore. Il prouve qu'aucune
// machine ne peut le lire : ni un moteur de recherche, ni une fiche locale, ni
// un assistant. C'est un fait réel, vérifiable, et c'est ce que ce module
// compte. Le nommer « ce qui manque à leur site » serait une affirmation qu'on
// n'a pas constatée ; `illisibles` est le mot juste.

import {
  affichable, assezRichePourUnePage, champsAffichables, CHAMPS_AFFICHES,
  type Champ, type ProfilRestaurant,
} from "./profilEtablissement"

/** Ce qu'on a relevé d'un prospect, et par quel chemin. */
export type Observation = {
  profil: ProfilRestaurant
  /**
   * L'URL effectivement consultée, ou `null` si aucun site n'a été relevé.
   *
   * Ce champ ne se devine pas depuis le profil : un profil maigre peut venir
   * d'un site relevé qui ne déclare rien, ou d'une fiche d'annuaire jamais
   * complétée. Les deux donnent le même profil et appellent des décisions
   * contraires, donc l'appelant le dit.
   */
  siteConsulte: string | null
}

/**
 * Le rang, et ce qu'il commande de faire.
 *
 * `prioritaire`    — assez de matière pour une page honnête, et un écart réel
 *                    à leur montrer. C'est le seul rang qu'on traite.
 * `a_approfondir`  — l'écart existe, la matière manque. Un relevé plus large
 *                    (page contact, page carte) peut le faire basculer ; la
 *                    page d'accueil seule n'a pas suffi.
 * `deja_equipe`    — leur présence est déjà lisible par une machine. Leur
 *                    proposer une page n'est pas malhonnête, c'est inutile.
 * `inclassable`    — on n'en sait pas assez pour trancher. Ce n'est PAS un
 *                    mauvais prospect : c'est un prospect non observé.
 */
export type Rang = "prioritaire" | "a_approfondir" | "deja_equipe" | "inclassable"

export type Classement = {
  rang: Rang
  /** Les faits affichables que la page saurait RENDRE, par leur nom. */
  matiere: string[]
  /** Les faits utiles qu'aucune machine ne peut lire chez eux. */
  illisibles: string[]
  /** Pourquoi ce rang, en toutes lettres. Jamais vide. */
  pourquoi: string[]
}

/**
 * Les faits dont la lisibilité machine change quelque chose pour eux.
 *
 * Liste explicite et justifiée, comme `ACTIVITES_ELIGIBLES` : une liste
 * dérivée automatiquement de tous les champs ferait entrer `instagram` et
 * `facebook`, dont l'absence ne coûte rien à un restaurant de quartier, et
 * gonflerait l'écart mesuré sans qu'il corresponde à un manque.
 */
export const FAITS_LISIBLES_QUI_COMPTENT = [
  // Le passant appelle, il ne recopie pas un numéro.
  "telephone",
  // « C'est ouvert ? » est la première question posée à un commerce.
  "horaires",
  // Sans elle : pas d'itinéraire, pas de fiche locale, pas de livraison.
  "adresse",
  // La seule action qui remplisse une salle.
  "reservation",
  // Le point d'entrée réel de la recherche locale, avant tout site.
  "ficheGoogle",
  // Une carte en image n'est lisible par personne d'autre qu'un œil humain.
  "plats",
] as const

/** Au-dessous de ce nombre d'écarts, la proposition n'a presque rien à dire. */
export const ECARTS_POUR_PRIORITAIRE = 2

/**
 * Au-delà de cet âge, un relevé ne se classe plus.
 *
 * Un restaurant change de carte, de téléphone, de propriétaire. Classer sur un
 * relevé de l'an dernier, c'est proposer une page à un établissement qui n'est
 * peut-être plus celui-là — et `profilEtablissement.ts` prévient déjà qu'« une
 * donnée vieille d'un an se méfie ». Six mois est la limite retenue : assez
 * long pour ne pas rejeter un relevé de la semaine dernière, assez court pour
 * qu'un changement de saison ne passe pas inaperçu.
 */
export const PEREMPTION_JOURS = 180

const JOUR = 24 * 60 * 60 * 1000

/**
 * La date du relevé le plus RÉCENT du profil, ou `null` si aucun champ n'est
 * daté — c'est-à-dire si le profil est vide.
 *
 * On prend le plus récent, et non le plus ancien : un profil complété en
 * plusieurs passages n'est pas périmé parce que son premier champ est vieux.
 */
export function dernierReleve(p: ProfilRestaurant): string | null {
  let max: string | null = null
  for (const [cle, v] of Object.entries(p)) {
    if (cle === "id") continue
    const champ = v as Champ<unknown>
    if (!champ) continue
    const d = champ.provenance.observeLe
    if (typeof d !== "string" || !d) continue
    if (max === null || d > max) max = d
  }
  return max
}

/** L'âge du relevé en jours, ou `null` quand il n'y a rien à dater. */
export function ageDuReleve(p: ProfilRestaurant, maintenant: Date): number | null {
  const dernier = dernierReleve(p)
  if (!dernier) return null
  const t = Date.parse(dernier)
  if (Number.isNaN(t)) return null
  return Math.floor((maintenant.getTime() - t) / JOUR)
}

/** Les faits utiles qu'aucune machine ne peut lire chez eux. */
export function faitsIllisibles(p: ProfilRestaurant): string[] {
  return FAITS_LISIBLES_QUI_COMPTENT
    .filter(f => !affichable((p as unknown as Record<string, Champ<unknown>>)[f]))
    .slice()
    .sort()
}

/**
 * Classe un prospect.
 *
 * `maintenant` est passé plutôt que lu : une fonction qui lit l'horloge n'est
 * pas testable sur ses propres bornes, et c'est exactement sur une borne que
 * `alerteEssai` a menti un jour entier.
 */
export function classer(obs: Observation, maintenant: Date): Classement {
  const { profil, siteConsulte } = obs
  const matiere = champsAffichables(profil)
    .filter(c => (CHAMPS_AFFICHES as readonly string[]).includes(c))
  const illisibles = faitsIllisibles(profil)

  // ── Les deux refus de classer ────────────────────────────────────────────
  //
  // Ils passent AVANT tout calcul : un rang posé sur une observation absente ou
  // périmée serait un chiffre d'apparence honnête, ce qui est pire qu'un trou.

  if (!siteConsulte) {
    return {
      rang: "inclassable", matiere, illisibles: [],
      pourquoi: [
        "aucun site consulté : la lisibilité de leur présence n'a pas été observée",
        "une fiche d'annuaire identifie un prospect, elle ne dit rien de son site",
      ],
    }
  }

  const age = ageDuReleve(profil, maintenant)
  if (age !== null && age > PEREMPTION_JOURS) {
    return {
      rang: "inclassable", matiere, illisibles,
      pourquoi: [`relevé vieux de ${age} jours (limite ${PEREMPTION_JOURS}) : à refaire avant de classer`],
    }
  }

  // ── Le classement ────────────────────────────────────────────────────────

  const pourquoi: string[] = []
  const assez = assezRichePourUnePage(profil)

  pourquoi.push(
    matiere.length === 0
      ? "aucun fait affichable : le site ne déclare rien qu'une machine sache lire"
      : `${matiere.length} fait(s) affichable(s) : ${matiere.join(", ")}`,
  )
  pourquoi.push(
    illisibles.length === 0
      ? "tout ce qui compte est lisible par une machine"
      : `${illisibles.length} fait(s) illisible(s) par une machine : ${illisibles.join(", ")}`,
  )

  if (assez && illisibles.length >= ECARTS_POUR_PRIORITAIRE) {
    pourquoi.push("assez de matière pour une page honnête, et un écart réel à leur montrer")
    return { rang: "prioritaire", matiere, illisibles, pourquoi }
  }

  if (assez) {
    pourquoi.push(
      `moins de ${ECARTS_POUR_PRIORITAIRE} écart(s) : leur présence fait déjà le travail, ` +
      "la proposition n'aurait presque rien à apporter",
    )
    return { rang: "deja_equipe", matiere, illisibles, pourquoi }
  }

  // Pas assez de matière. Dire PRÉCISÉMENT ce qui bloque, sinon personne ne
  // saura s'il faut relever une page de plus ou abandonner la piste.
  if (!affichable(profil.nom)) {
    pourquoi.push("le nom de l'établissement n'est pas affichable : la page ne dirait pas de qui elle parle")
  } else {
    pourquoi.push(`${matiere.length} fait(s) rendu(s) sur les 3 attendus : ce serait un modèle vierge portant une enseigne`)
  }
  pourquoi.push("un relevé plus large (page contact, page carte) peut le faire basculer")
  return { rang: "a_approfondir", matiere, illisibles, pourquoi }
}

/** L'ordre des rangs, du plus traitable au moins traitable. */
const ORDRE_DES_RANGS: Record<Rang, number> = {
  prioritaire: 0, a_approfondir: 1, deja_equipe: 2, inclassable: 3,
}

export type ProspectClasse = { observation: Observation; classement: Classement }

/**
 * L'ordre de traitement de deux prospects déjà classés.
 *
 * ⚠️ C'est un ORDRE, pas une mesure. Rien ici ne dit que le premier vaut deux
 * fois le second, ni qu'il achètera. Il dit seulement par lequel commencer.
 *
 * Les départages, dans l'ordre : le rang ; puis le nombre d'écarts (plus il y
 * a à leur montrer, plus la démonstration porte) ; puis la matière (plus la
 * page sera réelle) ; puis l'identifiant, pour que deux passages sur les mêmes
 * données rendent toujours la même liste.
 */
export function comparerProspects(a: ProspectClasse, b: ProspectClasse): number {
  const r = ORDRE_DES_RANGS[a.classement.rang] - ORDRE_DES_RANGS[b.classement.rang]
  if (r !== 0) return r
  const e = b.classement.illisibles.length - a.classement.illisibles.length
  if (e !== 0) return e
  const m = b.classement.matiere.length - a.classement.matiere.length
  if (m !== 0) return m
  return a.observation.profil.id.localeCompare(b.observation.profil.id)
}

/** Classe un lot et le rend trié. L'entrée n'est pas modifiée. */
export function classerLot(observations: Observation[], maintenant: Date): ProspectClasse[] {
  return observations
    .map(observation => ({ observation, classement: classer(observation, maintenant) }))
    .sort(comparerProspects)
}

/** Résumé d'une ligne, pour un journal ou le QG. */
export function resumer(c: Classement): string {
  if (c.rang === "inclassable") return `inclassable — ${c.pourquoi[0]}`
  return `${c.rang} — ${c.matiere.length} fait(s), ${c.illisibles.length} illisible(s)`
}
