// motDePasseCompromisClient — le même contrôle, depuis le navigateur.
//
// Les trois écrans de changement de mot de passe (réinitialisation, profil,
// réglages) parlent à Supabase directement : le mot de passe n'arrive jamais
// sur nos serveurs. Le contrôle doit donc vivre ici — et le mot de passe ne
// doit pas plus sortir d'ici qu'il ne sortait avant.
//
// D'où le découpage : Web Crypto calcule le SHA-1 DANS la page, on envoie les
// 5 premiers caractères au relais `/api/mot-de-passe/plage`, et on cherche le
// suffixe dans la réponse, toujours dans la page. Le serveur voit cinq
// caractères hexadécimaux ; il ne peut pas en tirer le mot de passe, ni même
// son empreinte.

import { couperLeHachage, compterDansLaPlage } from "./motDePasseCompromis"

async function sha1Hex(texte: string): Promise<string | null> {
  // `crypto.subtle` n'existe que sur une origine sûre (https, ou localhost).
  // En son absence on ne bricole pas un SHA-1 maison : on renvoie null, et
  // l'appelant traitera ça comme « on ne sait pas ».
  const sub = typeof globalThis.crypto !== "undefined" ? globalThis.crypto.subtle : undefined
  if (!sub) return null
  try {
    const buf = await sub.digest("SHA-1", new TextEncoder().encode(texte))
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("")
  } catch {
    return null
  }
}

/**
 * Combien de fuites connues contiennent ce mot de passe.
 *
 * `null` = on n'a pas pu savoir (pas de Web Crypto, relais injoignable, HIBP en
 * panne). Comme côté serveur, `null` n'est PAS zéro : l'appelant laisse passer
 * mais ne doit pas dire à la personne que son mot de passe a été vérifié.
 */
export async function occurrencesCoteClient(motDePasse: string): Promise<number | null> {
  if (!motDePasse) return null
  const sha1 = await sha1Hex(motDePasse)
  if (!sha1) return null
  const { prefixe, suffixe } = couperLeHachage(sha1)
  try {
    const r = await fetch(`/api/mot-de-passe/plage?p=${prefixe}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    })
    if (!r.ok) return null
    return compterDansLaPlage(await r.text(), suffixe)
  } catch {
    return null
  }
}

/** Vrai seulement sur une réponse positive. Une panne ne bloque personne. */
export async function estCompromisCoteClient(motDePasse: string): Promise<{ compromis: boolean; occurrences: number }> {
  const n = await occurrencesCoteClient(motDePasse)
  return { compromis: n !== null && n > 0, occurrences: n ?? 0 }
}
