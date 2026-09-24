// motDePasseCompromis — refuser un mot de passe qui figure déjà dans une fuite.
//
// ── Pourquoi ce fichier existe ─────────────────────────────────────────────
//
// L'audit du 23 septembre relevait que la « protection contre les mots de passe
// compromis » de Supabase est désactivée. Elle l'est parce qu'elle est réservée
// aux offres payantes, et le projet est en FREE. Le contrôle, lui, ne dépend pas
// de Supabase : il tient en une requête à HaveIBeenPwned, et rien n'empêche de
// le faire ici.
//
// ── Ce que le mot de passe ne fait PAS ─────────────────────────────────────
//
// Il ne sort jamais. Le protocole k-anonymity de HIBP est fait pour ça :
//
//   1. on calcule le SHA-1 du mot de passe ;
//   2. on envoie **les 5 premiers caractères hexadécimaux**, rien d'autre ;
//   3. HIBP renvoie tous les hachages de sa base commençant par ce préfixe —
//      quelques centaines de lignes « SUFFIXE:nombre » ;
//   4. on cherche notre suffixe dans cette liste, chez nous.
//
// HIBP apprend donc qu'un mot de passe commençant par ces 5 caractères a été
// vérifié, et ne peut rien en déduire : un préfixe couvre des centaines de
// milliers de mots de passe possibles. Le mot de passe complet, et même son
// hachage complet, ne quittent pas le processus qui les détient.
//
// ── Le mode de panne est une décision, pas un accident ─────────────────────
//
// Si HIBP ne répond pas, on LAISSE PASSER. Ce contrôle est une aide à la
// personne qui choisit son mot de passe — un attaquant qui choisirait un mot de
// passe faible pour SON PROPRE compte ne nuit à personne. Bloquer l'inscription
// parce qu'un service tiers est en panne coûterait un client pour ne protéger
// personne. Le choix est ici, écrit, et une garde le vérifie.

import { fetchBorne } from "@/lib/appelQuiNAttendPas"

/** L'adresse de l'API de plages. Nommée ici pour que la garde la retrouve. */
export const HIBP_RANGE = "https://api.pwnedpasswords.com/range/"

/**
 * Quelqu'un attend devant un formulaire d'inscription. Trois secondes est le
 * maximum qu'on accepte de lui prendre pour un contrôle facultatif ; au-delà,
 * on laisse passer (voir le mode de panne ci-dessus).
 */
export const DELAI_HIBP = 3000

/** Le SHA-1 coupé comme HIBP l'attend : 5 caractères dehors, 35 dedans. */
export function couperLeHachage(sha1: string): { prefixe: string; suffixe: string } {
  const h = sha1.trim().toUpperCase()
  return { prefixe: h.slice(0, 5), suffixe: h.slice(5) }
}

/**
 * Combien de fuites contiennent ce suffixe, d'après la réponse de HIBP.
 *
 * Le corps est du texte : une ligne par hachage, `SUFFIXE:NOMBRE`, séparateurs
 * CRLF. `0` veut dire « absent de la liste », donc jamais vu dans une fuite
 * connue.
 */
export function compterDansLaPlage(corps: string, suffixe: string): number {
  const cible = suffixe.trim().toUpperCase()
  for (const ligne of corps.split("\n")) {
    const i = ligne.indexOf(":")
    if (i < 0) continue
    if (ligne.slice(0, i).trim().toUpperCase() !== cible) continue
    const n = parseInt(ligne.slice(i + 1).trim(), 10)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

/**
 * Va chercher la plage d'un préfixe. Renvoie `null` si HIBP n'a pas répondu —
 * `null` n'est PAS « le mot de passe est sain », c'est « on ne sait pas », et
 * l'appelant doit le traiter comme tel.
 */
export async function plageHibp(prefixe: string): Promise<string | null> {
  if (!/^[0-9A-F]{5}$/i.test(prefixe)) return null
  try {
    const r = await fetchBorne(HIBP_RANGE + prefixe.toUpperCase(), {
      // `Add-Padding` demande à HIBP de rembourrer la réponse de faux hachages :
      // sans ça, la TAILLE de la réponse renseigne un observateur du réseau sur
      // le préfixe demandé, malgré le chiffrement.
      headers: { "Add-Padding": "true", "User-Agent": "QRowg-password-check" },
      cache: "no-store",
    }, DELAI_HIBP)
    if (!r.ok) return null
    return await r.text()
  } catch {
    return null
  }
}

/** Le message montré. Il dit quoi faire, pas seulement ce qui ne va pas. */
export function messageCompromis(occurrences: number): string {
  const n = occurrences >= 1000
    ? `${Math.round(occurrences / 1000)} 000 fois`
    : `${occurrences} fois`
  return `Ce mot de passe apparaît ${n} dans des fuites de données publiques : il est testé en premier par les robots. Choisissez-en un autre, qui ne sert nulle part ailleurs.`
}
