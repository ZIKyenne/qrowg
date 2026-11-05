// Le jeton d'une URL d'aperçu : opaque, non devinable, expirant, et jamais
// stocké en clair.
//
// ── Les quatre exigences, et d'où elles viennent ───────────────────────────
//
// Le document de mission les pose sans ambiguïté : « URL opaque/signée à
// expiration, non indexable, interdite à l'énumération ». Chacune répond à une
// façon précise de se tromper :
//
//   opaque        — l'URL ne doit rien dire. Ni le nom de l'établissement, ni
//                   un numéro qui se suit. Un identifiant séquentiel permet de
//                   parcourir les propositions faites à toute la concurrence.
//   non devinable — 32 octets de hasard cryptographique. Pas `Math.random()`,
//                   qui n'est pas imprévisible et n'a jamais prétendu l'être.
//   expirant      — une proposition commerciale n'a pas à rester en ligne pour
//                   toujours. Au-delà, le lien ne rend plus rien.
//   haché         — la base ne garde que le condensé. Une fuite de la table
//                   ne donne donc aucune URL utilisable. C'est le choix déjà
//                   fait dans ce dépôt pour les clés d'API (`qrk_`, SHA-256).
//
// Module PUR côté calcul : il reçoit sa source d'aléa et son horloge, donc il
// se teste sans navigateur et sans attendre que le temps passe.

/** Durée de vie par défaut d'un aperçu. */
export const JOURS_DE_VALIDITE = 30

/** Longueur du jeton en octets avant encodage. 32 o = 256 bits. */
export const OCTETS_DE_JETON = 32

/**
 * Encodage base64 « URL-safe », sans remplissage.
 *
 * Pourquoi pas le base64 ordinaire : `+` et `/` doivent être échappés dans une
 * URL, et `=` en fin de chaîne se fait manger par certains clients de
 * messagerie quand le lien est recopié. Un jeton qui survit mal au voyage
 * n'est pas un jeton.
 */
export function encoderUrl(octets: Uint8Array): string {
  let binaire = ""
  for (const o of octets) binaire += String.fromCharCode(o)
  const b64 = typeof btoa === "function"
    ? btoa(binaire)
    : Buffer.from(octets).toString("base64")
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/** Fabrique un jeton. L'aléa est injecté : testable, et auditable. */
export function creerJeton(alea: (n: number) => Uint8Array = hasardSur): string {
  return encoderUrl(alea(OCTETS_DE_JETON))
}

/** L'aléa cryptographique de la plateforme. Jamais `Math.random()`. */
export function hasardSur(n: number): Uint8Array {
  const octets = new Uint8Array(n)
  globalThis.crypto.getRandomValues(octets)
  return octets
}

/** Le condensé stocké en base. Le jeton lui-même n'y entre jamais. */
export async function hacher(jeton: string): Promise<string> {
  const donnees = new TextEncoder().encode(jeton)
  const empreinte = await globalThis.crypto.subtle.digest("SHA-256", donnees)
  return [...new Uint8Array(empreinte)].map(o => o.toString(16).padStart(2, "0")).join("")
}

/** La date d'expiration, calculée depuis une horloge injectée. */
export function expireLe(maintenant: Date, jours: number = JOURS_DE_VALIDITE): Date {
  return new Date(maintenant.getTime() + jours * 24 * 60 * 60 * 1000)
}

/**
 * L'aperçu est-il encore consultable ?
 *
 * La borne est stricte : à la seconde d'expiration, c'est fini. Un « encore un
 * peu » serait une règle qu'on ne saurait plus expliquer.
 */
export function encoreValide(expiration: Date, maintenant: Date): boolean {
  return expiration.getTime() > maintenant.getTime()
}

/**
 * Le jeton a-t-il la forme attendue ?
 *
 * Sert à écarter les requêtes manifestement bidon AVANT de toucher la base —
 * un balayage d'URL ne doit pas coûter une requête SQL par essai. Ce n'est pas
 * une vérification d'authenticité : seul le condensé en base la donne.
 */
export function formeValide(jeton: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(jeton)
}

/** L'URL publique d'un aperçu, à partir du jeton. */
export function urlDApercu(base: string, jeton: string): string {
  return `${base.replace(/\/+$/, "")}/apercu/${jeton}`
}
