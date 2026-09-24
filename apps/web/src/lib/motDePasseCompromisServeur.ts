// motDePasseCompromisServeur — le contrôle, côté serveur, là où le mot de passe
// est déjà présent (Server Action d'inscription).
//
// Séparé de `motDePasseCompromis.ts` parce que celui-ci importe `node:crypto` :
// le module pur reste importable depuis le navigateur, qui fait son SHA-1 avec
// l'API Web Crypto et n'envoie que le préfixe.

import { createHash } from "node:crypto"
import { couperLeHachage, compterDansLaPlage, plageHibp } from "./motDePasseCompromis"

/**
 * Combien de fuites connues contiennent ce mot de passe.
 *
 * `null` = on n'a pas pu savoir (HIBP injoignable, trop lent, réponse illisible).
 * Ce n'est PAS zéro, et l'appelant ne doit pas le confondre avec « sain ».
 */
export async function occurrencesDansLesFuites(motDePasse: string): Promise<number | null> {
  if (!motDePasse) return null
  const sha1 = createHash("sha1").update(motDePasse, "utf8").digest("hex")
  const { prefixe, suffixe } = couperLeHachage(sha1)
  const corps = await plageHibp(prefixe)
  if (corps === null) return null
  return compterDansLaPlage(corps, suffixe)
}

/**
 * Faut-il refuser ce mot de passe ?
 *
 * Refus UNIQUEMENT sur une réponse positive de HIBP. Une panne, une lenteur, un
 * réseau coupé donnent `false` : on laisse passer. Ce choix est expliqué en tête
 * de `motDePasseCompromis.ts` et vérifié par `motDePasseQuiALeaké.test.ts`.
 */
export async function doitEtreRefuse(motDePasse: string): Promise<{ refuse: boolean; occurrences: number }> {
  const n = await occurrencesDansLesFuites(motDePasse)
  return { refuse: n !== null && n > 0, occurrences: n ?? 0 }
}
