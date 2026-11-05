// Lire une liste d'établissements collée, et dire qui est retenu — et pourquoi
// pas les autres.
//
// Module PUR. C'est le chemin d'entrée de la phase 2 qui ne dépend d'AUCUNE
// décision : le propriétaire colle une liste qu'il possède déjà, au lieu
// d'attendre qu'on branche un annuaire extérieur.
//
// ── Pourquoi un en-tête est EXIGÉ ──────────────────────────────────────────
//
// Pour une carte de restaurant, l'ordre des colonnes est conventionnel : nom,
// prix, description. `menuImport` peut donc se placer positionnellement sans
// risque. Une liste d'entreprises, non : « Reims » peut être une commune, et
// « 5610A » un code d'activité, mais rien ne dit dans quel ordre ils viennent,
// et une colonne mal attribuée produit un résultat FAUX sans rien signaler —
// des établissements jugés sur le mauvais champ, écartés ou retenus à tort.
//
// Le module refuse donc de deviner. C'est une limite assumée, et elle est dite
// à l'appelant (`raison: "sans en-tête"`) plutôt que contournée.
//
// ── Pourquoi un plafond ────────────────────────────────────────────────────
//
// Un collage est une action humaine : au-delà de quelques centaines de lignes,
// c'est un fichier, et un fichier se traite ailleurs, par lots. Le plafond
// protège l'écran qui affichera le résultat autant que le processus.

import { corpsEtEntete, colonnesParNom } from "@/lib/tableauColle"
import type { FicheEntreprise } from "./ficheEntreprise"
import { jugerEligibilite, type Verdict } from "./eligibilite"

/** Nombre de lignes traitées par collage. */
export const MAX_LIGNES = 500

/**
 * Les intitulés acceptés pour chaque champ.
 *
 * Généreux sur les mots, strict sur le principe : on reconnaît « Raison
 * sociale » comme « Nom », mais on ne devine jamais une colonne non nommée.
 *
 * Les mots sont écrits en BON FRANÇAIS, une seule fois. La première version de
 * cette liste doublait chaque entrée accentuée par sa variante sans accent
 * (« état » et « etat ») pour accepter les tableurs mal saisis. C'était inutile
 * : la comparaison passe par `cleDeColonne`, qui retire déjà les accents des
 * deux côtés. Ces doublons ne servaient donc à rien, et c'est la garde
 * `orthographeInterface` qui les a signalés — elle cherchait une faute, elle a
 * trouvé du code mort.
 */
export const SYNONYMES: Record<string, string[]> = {
  nom: ["nom", "name", "dénomination", "raison sociale", "enseigne", "entreprise", "établissement"],
  siren: ["siren", "siret", "identifiant"],
  codeActivite: ["code activité", "activité", "naf", "ape", "code naf", "code ape"],
  etat: ["état", "statut", "état administratif"],
  adresse: ["adresse", "address", "rue", "voie"],
  codePostal: ["code postal", "cp", "postal", "zip"],
  commune: ["commune", "ville", "city", "localité"],
}

export type LigneLue = {
  /** Numéro de la ligne dans le collage, en comptant l'en-tête. Pour que l'humain la retrouve. */
  numero: number
  fiche: FicheEntreprise
  verdict: Verdict
}

export type Lecture = {
  lignes: LigneLue[]
  /** Les champs reconnus dans l'en-tête, et leur position. */
  colonnes: Record<string, number>
  /** Vrai quand le collage dépassait le plafond : le reste n'a pas été lu. */
  tronque: boolean
  /** Pourquoi rien n'a pu être lu. `null` quand la lecture a abouti. */
  raison: "vide" | "sans en-tête" | "colonnes inconnues" | null
}

/** Le drapeau d'entrepreneur individuel, quand la colonne le dit en toutes lettres. */
function entrepreneurIndividuel(cellules: string[]): boolean | undefined {
  const texte = cellules.join(" ").toLowerCase()
  if (/\bentrepreneur individuel\b|\bpersonne physique\b|\bauto[- ]entrepreneur\b/.test(texte)) return true
  return undefined   // absent ≠ « c'est une société »
}

/**
 * Lit un collage d'établissements.
 *
 * Ne lève jamais : une entrée illisible rend une `Lecture` qui DIT pourquoi.
 * Un import qui échoue en silence est pire qu'un import qui refuse.
 */
export function lireListe(texte: string): Lecture {
  const vide: Lecture = { lignes: [], colonnes: {}, tronque: false, raison: "vide" }
  const { entete, corps } = corpsEtEntete(texte)
  if (corps.length === 0) return vide
  if (!entete) return { ...vide, raison: "sans en-tête" }

  const colonnes = colonnesParNom(entete, SYNONYMES)
  // Sans le nom, il n'y a rien à retenir : une ligne sans dénomination ne
  // désigne aucun établissement.
  if (colonnes.nom === undefined) return { ...vide, colonnes, raison: "colonnes inconnues" }

  const tronque = corps.length > MAX_LIGNES
  const lot = corps.slice(0, MAX_LIGNES)

  const cellule = (cs: string[], champ: string): string | undefined => {
    const i = colonnes[champ]
    if (i === undefined) return undefined
    const v = (cs[i] ?? "").trim()
    return v.length ? v : undefined
  }

  const lignes: LigneLue[] = lot.map((cs, k) => {
    const fiche: FicheEntreprise = {
      nom: cellule(cs, "nom"),
      siren: cellule(cs, "siren"),
      codeActivite: cellule(cs, "codeActivite"),
      etat: cellule(cs, "etat"),
      adresse: cellule(cs, "adresse"),
      codePostal: cellule(cs, "codePostal"),
      commune: cellule(cs, "commune"),
      entrepreneurIndividuel: entrepreneurIndividuel(cs),
    }
    // +2 : l'en-tête occupe la ligne 1, et les humains comptent à partir de 1.
    return { numero: k + 2, fiche, verdict: jugerEligibilite(fiche) }
  })

  return { lignes, colonnes, tronque, raison: null }
}

export type Bilan = {
  retenus: LigneLue[]
  ecartes: LigneLue[]
  /** Combien d'établissements par raison de refus, du plus fréquent au moins. */
  parRaison: { raison: string; nombre: number }[]
  /** Les lignes retenues qui répètent un SIREN déjà vu plus haut. */
  doublons: LigneLue[]
}

/**
 * Le compte rendu d'un import.
 *
 * `parRaison` est trié par fréquence parce que c'est la question qu'on se pose
 * en regardant un import raté : « qu'est-ce qui a écarté la plupart ? ». Une
 * liste entière refusée pour « état administratif inconnu » veut dire que la
 * colonne manque, pas que les établissements sont fermés.
 */
export function bilanDe(lecture: Lecture): Bilan {
  const retenus = lecture.lignes.filter(l => l.verdict.eligible)
  const ecartes = lecture.lignes.filter(l => !l.verdict.eligible)

  const comptes = new Map<string, number>()
  for (const l of ecartes)
    for (const r of l.verdict.refus) comptes.set(r, (comptes.get(r) ?? 0) + 1)

  const parRaison = [...comptes.entries()]
    .map(([raison, nombre]) => ({ raison, nombre }))
    // À nombre égal, l'ordre alphabétique : un compte rendu qui change d'ordre
    // d'un passage à l'autre n'est pas comparable à celui de la veille.
    .sort((a, b) => b.nombre - a.nombre || a.raison.localeCompare(b.raison, "fr"))

  // Doublons : même SIREN deux fois. On ne compare PAS les noms — deux
  // établissements d'une même enseigne portent légitimement le même nom, et les
  // fusionner perdrait une adresse.
  const vus = new Set<string>()
  const doublons: LigneLue[] = []
  for (const l of retenus) {
    const siren = l.fiche.siren
    if (!siren) continue
    if (vus.has(siren)) doublons.push(l)
    else vus.add(siren)
  }

  return { retenus, ecartes, parRaison, doublons }
}
