// appelQuiNAttendPas — un appel qui sort du produit porte un délai.
//
// Relevé du 16 septembre, en suivant ce qui se passe quand quelqu'un scanne.
//
// Le produit fait **onze** appels vers l'extérieur. **Deux** portent un délai —
// et disent pourquoi :
//
//   app/[slug]/og/route.tsx:97      fetch(avatarUrl, { signal: AbortSignal.timeout(2500) })
//   app/api/domains/check:198       new AbortController(), setTimeout(abort, 6000)
//
// **Neuf n'en portent aucun** — mon premier relevé n'en comptait que sept, les
// deux appels à l'API de l'hébergeur construisant leur adresse une ligne plus
// haut. Les deux plus coûteux sont sur le chemin du visiteur — celui qui est
// debout devant la vitrine, téléphone à la main :
//
//   lib/rateLimit.ts:46         Upstash, sur CHAQUE requête limitée, avant tout le reste
//   lib/premierScanEnvoi.ts:47  Resend, attendu par `/api/track` au premier scan
//
// `fetch` n'a **aucun délai par défaut** : un serveur qui accepte la connexion
// puis ne répond plus tient la requête jusqu'au budget de la fonction. Sur
// Vercel, ça veut dire que le visiteur attend, que la fonction est facturée, et
// qu'à l'échelle d'une vitrine qui marche, les instances se remplissent d'appels
// qui n'arriveront jamais. Le produit a déjà tout ce qu'il faut pour s'en
// remettre — `rateLimit` retombe sur son compteur local, `previenirPremierScan`
// répond « impossible » — il manque seulement le moment où il décide d'arrêter
// d'attendre.
//
// Les cinq autres sont des envois d'e-mail et une recherche d'images :
//
//   app/auth/actions.ts:61            l'e-mail de bienvenue, pendant l'inscription
//   app/auth/callback/route.ts:82     le même, à la confirmation
//   app/api/unsplash/route.ts:40      la recherche de fonds, dans l'atelier
//   app/api/cron/{relance,quota-alerts,dynamic-expiry}, api/reports/send
//   app/api/domains/route.ts:31,52   l'API de l'hébergeur, quand on ajoute un domaine
//
// La classe : **un appel qui sort du produit porte un délai, choisi selon qui
// attend.** Module PUR.

/**
 * Combien de temps on accepte d'attendre, nommé par QUI attend.
 *
 * Les chiffres ne sont pas ronds par hasard : 2 500 ms est ce que
 * `og/route.tsx` s'était déjà donné pour un visiteur, et 6 000 ms ce que
 * `domains/check` s'était donné pour une vérification que le commerçant a
 * lancée lui-même. On garde leurs valeurs, on leur donne un nom.
 */
export const DELAI = {
  /** Quelqu'un est debout devant la vitrine. Il ne regarde pas un écran de chargement. */
  visiteur: 2500,
  /** Le commerçant a cliqué et regarde son écran. */
  ecran: 6000,
  /** Personne n'attend — mais la fonction, elle, a un budget. */
  tache: 15000,
} as const

export type QuiAttend = keyof typeof DELAI

/**
 * Le signal d'abandon d'un appel, et celui de l'appelant s'il en avait un.
 *
 * `AbortSignal.any` n'existe pas partout : sans lui, le délai prime — c'est la
 * protection qu'on ajoute, pas celle qu'on remplace.
 */
export function signalBorne(ms: number, deja?: AbortSignal | null): AbortSignal {
  const delai = AbortSignal.timeout(ms)
  if (!deja) return delai
  const any = (AbortSignal as unknown as { any?: (l: AbortSignal[]) => AbortSignal }).any
  return typeof any === "function" ? any([deja, delai]) : delai
}

/**
 * `fetch`, avec un moment où il renonce.
 *
 * Se comporte exactement comme `fetch` : un délai dépassé lève, comme une
 * coupure réseau lève. Tous les appels du produit sont déjà dans un `try` qui
 * sait quoi en faire — retomber sur le compteur local, répondre « impossible »,
 * renvoyer une liste vide. On ne change pas leur façon d'échouer ; on décide
 * seulement quand.
 */
export function fetchBorne(entree: string | URL, init: RequestInit | undefined, qui: QuiAttend | number): Promise<Response> {
  const ms = typeof qui === "number" ? qui : DELAI[qui]
  return fetch(entree, { ...init, signal: signalBorne(ms, init?.signal) })
}

/** Ce délai-là a-t-il été dépassé ? (Pour distinguer d'une vraie erreur du serveur.) */
export function estUnDelaiDepasse(e: unknown): boolean {
  const nom = (e as { name?: unknown } | null)?.name
  return nom === "TimeoutError" || nom === "AbortError"
}
