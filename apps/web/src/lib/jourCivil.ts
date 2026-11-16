// Le jour civil — la seule unité dans laquelle une tâche planifiée peut décider.
//
// ── Le fait qui impose ce module ───────────────────────────────────────────
//
// Un cron Vercel ne part PAS à l'heure annoncée. Relevé dans `cron_runs` le
// 2026-11-15, sur les six tâches quotidiennes du projet :
//
//     cron/prune-events     04:00 → 04:39     (+39 min)
//     cron/purge-apercus    05:00 → 05:26     (+26 min)
//     cron/essai            07:00 → 07:15     (+15 min)
//     reports/send          08:00 → 08:20     (+20 min)
//     cron/relance          09:00 → 09:53     (+53 min)
//     cron/dynamic-expiry   10:00 → 10:55     (+55 min)
//
// La dérive n'est ni nulle, ni constante : deux passages successifs de la même
// tâche peuvent être espacés de 24 h ± 40 min.
//
// ── Pourquoi c'est un piège, et pas un détail ─────────────────────────────
//
// Deux modules de ce dépôt décidaient d'un envoi en mesurant un DÉLAI ENTRE
// INSTANTS — « il reste 7 jours », « le compte a 48 h ». Un délai mesuré ainsi
// bouge avec l'heure du passage, et la dérive déplace donc la frontière de
// l'arrondi :
//
//   · deux passages espacés de MOINS de 24 h → la même condition est remplie
//     deux jours de suite, et la personne reçoit DEUX fois le même e-mail ;
//   · espacés de PLUS de 24 h → la journée est sautée, et elle ne reçoit RIEN.
//
// Les deux ont été mesurés, pas supposés, le 2026-11-15 :
//
//   · `alerteEssai` envoyait TROIS e-mails au compte publié entre 07:00 et
//     07:55 UTC, dont deux fois « Demain, vos clients ne verront plus votre
//     page » — la veille, puis le jour même de la coupure ;
//   · `relance` ne relançait JAMAIS le compte inscrit vers 09:50 UTC. Jamais,
//     pas en retard : la tâche note « aucun compte dans la fenêtre » et tout a
//     l'air normal.
//
// Aucune garde ne le voyait, parce que toutes faisaient passer le cron « à
// heure fixe » — l'hypothèse exacte que la production ne tient pas.
//
// ── La règle, désormais ────────────────────────────────────────────────────
//
// Une tâche quotidienne décide en JOURS CIVILS. Tout passage du même jour rend
// la même réponse, donc un passage par jour donne exactement une décision par
// jour, quelle que soit l'heure. La dérive cesse d'être un paramètre.
//
// Les fenêtres SQL de ces tâches s'alignent sur la même unité : une borne posée
// à l'heure du passage glisserait de quarante minutes pendant que la décision,
// elle, ne bougerait pas — et laisserait dehors des comptes éligibles.
//
// ── La limite assumée : UTC, pas Paris ────────────────────────────────────
//
// Le jour civil est compté en UTC. Pour un compte dont l'échéance tombe en fin
// de soirée UTC, « demain » peut être après-demain heure française : on annonce
// donc l'échéance un peu TÔT, jamais trop tard. L'erreur résiduelle fait agir
// le commerçant en avance, ce qui ne lui coûte rien — alors qu'une annonce en
// retard arriverait après la coupure.
//
// Passer à Europe/Paris exigerait de l'arithmétique de fuseau (et son heure
// d'été) dans un module qui doit rester pur et lisible. Ce n'est pas exclu ;
// c'est simplement un coût qui n'achète, aujourd'hui, qu'une poignée d'heures
// de précision dans le bon sens.

const MS_PAR_JOUR = 86_400_000

/**
 * Le minuit UTC du jour civil d'un instant.
 *
 * C'est toute la mécanique : en ramenant les deux dates à leur minuit, la
 * soustraction ne voit plus l'heure du passage.
 */
export function minuitUtc(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

/**
 * Combien de jours civils séparent `de` de `a`.
 *
 * Positif quand `a` est après `de`, négatif sinon, zéro le même jour. Entier
 * par construction : `Math.round` n'est là que pour clore la question d'un
 * reste flottant, car la division de deux minuits UTC est exacte.
 */
export function joursCivilsEntre(de: Date, a: Date): number {
  return Math.round((minuitUtc(a) - minuitUtc(de)) / MS_PAR_JOUR)
}

/** Les deux instants tombent-ils le même jour civil ? */
export function memeJourCivil(a: Date, b: Date): boolean {
  return minuitUtc(a) === minuitUtc(b)
}

/**
 * Le minuit UTC d'un jour décalé de `jours` par rapport à celui de `d`.
 *
 * Sert à poser les bornes des fenêtres SQL sur des minuits, et non sur l'heure
 * du passage.
 */
export function minuitDecale(d: Date, jours: number): string {
  return new Date(minuitUtc(d) + jours * MS_PAR_JOUR).toISOString()
}
