// La fiche d'une entreprise telle qu'un annuaire public la décrit, et sa
// traduction en profil QRowg.
//
// ── Ce que ce module est, et ce qu'il n'est pas ────────────────────────────
//
// Il est PUR : il reçoit une fiche déjà obtenue, il n'en va chercher aucune.
// Aucun appel réseau n'est fait ici, ni ailleurs dans la phase 2 pour l'instant
// — brancher l'API Recherche d'entreprises est une connexion à un fournisseur
// extérieur, et le prompt maître réserve cette décision au propriétaire.
//
// ── Un avertissement qu'il faut lire avant de brancher quoi que ce soit ────
//
// `FicheEntreprise` ci-dessous est NOTRE contrat, pas le schéma de l'API. Les
// noms de champs réels n'ont pas été constatés sur une réponse : la
// documentation officielle est rendue en JavaScript, et les deux sources
// secondaires consultées donnent des orthographes différentes pour le même
// champ (`activite_principale` contre `activite_principale_naf`, `commune`
// contre `libelle_commune`).
//
// Écrire un adaptateur qui AFFIRME correspondre à l'API serait précisément ce
// que ce dépôt refuse ailleurs : poser une valeur sans provenance. L'adaptateur
// (`depuisAnnuairePublic`) existe donc, mais il est marqué NON CONSTATÉ, et il
// accepte les deux orthographes plutôt que de parier sur l'une. Une seule
// réponse réelle suffira à trancher, et à retirer cet avertissement.
//
// ── Pourquoi la provenance est posée ICI ───────────────────────────────────
//
// Un champ venant d'un annuaire d'État n'a pas la même valeur qu'un champ
// relevé sur le site du restaurant. L'annuaire donne la raison sociale et
// l'adresse du siège ; il ne dit rien de l'enseigne affichée sur la devanture,
// ni du téléphone qu'on décroche. D'où la certitude `probable` sur le nom, et
// jamais `confirme` : « SARL LES TROIS MARCHES » est exact et n'est pas ce qui
// est écrit sur la vitrine.

import { sourcer, profilVide, type ProfilRestaurant, type Provenance } from "./profilEtablissement"

/**
 * Ce que nous attendons d'un annuaire d'entreprises public.
 *
 * Tout est optionnel : une fiche incomplète est un cas normal, pas une erreur.
 */
export type FicheEntreprise = {
  siren?: string
  /** La dénomination publiée. Pour une personne physique, c'est un NOM DE PERSONNE. */
  nom?: string
  /** Code NAF/APE de l'activité principale, avec ou sans point ni espace. */
  codeActivite?: string
  /** « A » actif, « C » cessé — ou les mots en toutes lettres. */
  etat?: string
  adresse?: string
  codePostal?: string
  commune?: string
  /** L'entreprise est-elle un entrepreneur individuel (donc une personne) ? */
  entrepreneurIndividuel?: boolean
  /** Date de création, au format ISO si elle est connue. */
  creeeLe?: string
}

/** Une valeur d'objet quelconque, pour lire une réponse non typée sans `any`. */
type Brut = Record<string, unknown>
const texte = (v: unknown): string | undefined => {
  const s = typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : ""
  return s.length ? s : undefined
}
const premier = (o: Brut, ...cles: string[]): string | undefined => {
  for (const c of cles) { const v = texte(o[c]); if (v) return v }
  return undefined
}

/**
 * Traduit une réponse d'annuaire en `FicheEntreprise`.
 *
 * ⚠️ NON CONSTATÉ sur une réponse réelle — voir l'avertissement en tête de
 * fichier. Chaque champ accepte les orthographes concurrentes relevées dans la
 * documentation secondaire, et rend `undefined` plutôt que de deviner. Un champ
 * absent n'est pas une erreur : c'est l'état par défaut de ce module.
 */
export function depuisAnnuairePublic(brut: unknown): FicheEntreprise {
  if (!brut || typeof brut !== "object") return {}
  const o = brut as Brut
  const siege = (o.siege && typeof o.siege === "object" ? o.siege : {}) as Brut
  const compl = (o.complements && typeof o.complements === "object" ? o.complements : {}) as Brut

  return {
    siren: premier(o, "siren"),
    nom: premier(o, "nom_complet", "nom_raison_sociale", "denomination"),
    codeActivite: premier(o, "activite_principale", "activite_principale_naf")
      ?? premier(siege, "activite_principale"),
    etat: premier(o, "etat_administratif") ?? premier(siege, "etat_administratif"),
    adresse: premier(siege, "adresse", "geo_adresse"),
    codePostal: premier(siege, "code_postal"),
    commune: premier(siege, "libelle_commune", "commune"),
    entrepreneurIndividuel: typeof compl.est_entrepreneur_individuel === "boolean"
      ? compl.est_entrepreneur_individuel
      : undefined,
    creeeLe: premier(o, "date_creation"),
  }
}

/** Le code NAF réduit à ses chiffres et sa lettre : « 56.10A » → « 5610A ». */
export function codeNafNormalise(code: string | undefined): string {
  return (code ?? "").toUpperCase().replace(/[^0-9A-Z]/g, "")
}

/**
 * L'établissement est-il en activité ?
 *
 * `undefined` quand l'annuaire ne le dit pas — et ce n'est PAS « oui ». Un état
 * inconnu et un état actif sont deux choses différentes, et c'est l'éligibilité
 * qui décidera quoi en faire.
 */
export function estEnActivite(fiche: FicheEntreprise): boolean | undefined {
  const e = (fiche.etat ?? "").trim().toUpperCase()
  if (!e) return undefined
  if (e === "A" || e.startsWith("ACTIF")) return true
  if (e === "C" || e.startsWith("CESS") || e.startsWith("FERM")) return false
  return undefined
}

/**
 * Traduit une fiche d'annuaire en profil QRowg.
 *
 * Ne remplit QUE ce que l'annuaire sait : le nom, l'adresse, la ville. Pas de
 * téléphone, pas d'horaires, pas de carte — ces faits-là se relèvent sur le
 * site de l'établissement, et un annuaire d'immatriculation ne les connaît pas.
 * Le profil rendu est donc volontairement maigre, et `assezRichePourUnePage`
 * le refusera le plus souvent : c'est le comportement voulu. Une fiche
 * d'annuaire identifie un prospect, elle ne fait pas une page.
 */
export function profilDepuisFiche(
  fiche: FicheEntreprise,
  id: string,
  observeLe: string,
  source = "annuaire public des entreprises",
): ProfilRestaurant {
  const profil = profilVide(id)

  // `probable`, jamais `confirme` : l'annuaire donne la raison sociale, pas
  // l'enseigne de la devanture. « SARL LES TROIS MARCHES » est exact et n'est
  // pas ce qu'on lit sur la vitrine.
  const p = (certitude: Provenance["certitude"]): Provenance => ({ source, observeLe, certitude })

  if (fiche.nom) profil.nom = sourcer(fiche.nom, p("probable"))

  // L'adresse du SIÈGE. Pour une chaîne, ce n'est pas l'adresse du restaurant
  // qu'on a sous les yeux — d'où `a_verifier`, qui la garde sans l'afficher.
  const adresse = [fiche.adresse, [fiche.codePostal, fiche.commune].filter(Boolean).join(" ")]
    .filter(Boolean).join(", ")
  if (adresse) profil.adresse = sourcer(adresse, p("a_verifier"))
  if (fiche.commune) profil.ville = sourcer(fiche.commune, p("probable"))

  return profil
}
