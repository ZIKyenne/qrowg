// lectureHonnete.ts — ce que les statistiques ont le droit d'affirmer.
//
// Relevé du 11 septembre, sur le banc d'essai d'un compte qui vient de publier
// (trois scans en trente jours) : l'écran annonçait « Votre trafic augmente. »,
// « +100 % contre hier (0) », « surtout via QR code sur mobile · pic d'activité
// vers 0h », et le graphique titrait « pic · 1 scans le 8/9 ».
//
// Aucune de ces phrases n'était vraie. Une hausse de 0 à 2 n'est pas +100 % :
// c'est une division par zéro. Un « pic d'activité » sur trois scans, une source
// « dominante » sur trois scans, ce sont des conclusions tirées d'un échantillon
// qui n'en autorise aucune. Le produit disait à son utilisateur ce qu'il voulait
// entendre, avec l'aplomb d'une mesure.
//
// Ce module tranche : au-dessous d'un seuil, on donne les faits bruts et ce qu'il
// reste à faire ; au-dessus seulement, on interprète. Module PUR, testable seul.

/**
 * En dessous de ce nombre d'événements sur la période, aucune interprétation :
 * ni tendance, ni source dominante, ni heure de pic. Vingt est un choix, assumé
 * comme tel — assez pour qu'une source majoritaire veuille dire quelque chose,
 * assez bas pour ne pas laisser un petit commerce sans lecture pendant des mois.
 */
export const SEUIL_INTERPRETATION = 20

export function assezPourConclure(evenements: number): boolean {
  return evenements >= SEUIL_INTERPRETATION
}

/**
 * Variation d'un jour à l'autre, en pourcentage — ou `null` quand elle n'existe
 * pas. Partir de zéro n'est pas « +100 % » : c'est un départ, et ça se dit avec
 * des mots, pas avec un pourcentage.
 */
export function evolutionJournaliere(aujourdhui: number, hier: number): number | null {
  if (hier <= 0) return null
  return Math.round(((aujourdhui - hier) / hier) * 100)
}

/** « 1 scan », « 3 scans » — l'accord, que personne ne fait à la main sans se tromper. */
export function pluriel(n: number, singulier: string, plurielMot?: string): string {
  return `${n} ${n > 1 ? (plurielMot ?? singulier + "s") : singulier}`
}

/**
 * La phrase du haut : un titre, un constat, et le cas échéant une interprétation.
 * `evo` vaut null quand la comparaison n'a pas de sens.
 */
export function titreSynthese(evenements: number, evo: number | null): string {
  if (!assezPourConclure(evenements)) return "Vos premières mesures arrivent."
  if (evo != null && evo > 5) return "Votre trafic augmente."
  if (evo != null && evo < -5) return "Votre trafic ralentit un peu."
  return "Votre QR est suivi en temps réel."
}

/** Ce qu'on conseille : amorcer tant qu'il n'y a rien à lire, optimiser ensuite. */
export function conseilLecture(
  evenements: number,
  opts: { heurePic?: number | null; sourcePrincipale?: string | null } = {},
): string | null {
  if (!assezPourConclure(evenements)) {
    return "Partagez votre QR sur vos réseaux et imprimez-le : c'est ce qui fait venir les premiers scans."
  }
  if (opts.heurePic != null) return `Publiez vos contenus ${creneauHoraire(opts.heurePic)}, votre heure de pic.`
  if (opts.sourcePrincipale) return `L'essentiel vient de ${opts.sourcePrincipale} — testez un autre canal pour diversifier.`
  return null
}

/**
 * Un « pic » ne se désigne que s'il en est un. Sur une série où le maximum vaut 1,
 * ou bien où plusieurs jours partagent le maximum, le point mis en avant serait
 * choisi par l'ordre du tableau, pas par les faits.
 */
export function picLisible(valeurs: number[]): boolean {
  const max = Math.max(0, ...valeurs)
  if (max < 2) return false
  return valeurs.filter(v => v === max).length === 1
}

/**
 * Une heure de pic est un créneau d'une heure, pas un instant : « 0h » se lit mal
 * (minuit ? midi ? une erreur ?) alors que « entre 0 h et 1 h » se lit tout seul.
 */
export function creneauHoraire(heure: number): string {
  const h = ((Math.round(heure) % 24) + 24) % 24
  return `entre ${h} h et ${(h + 1) % 24} h`
}
