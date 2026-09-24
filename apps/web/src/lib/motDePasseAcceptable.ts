// motDePasseAcceptable — une seule règle pour « ce mot de passe convient-il ? ».
//
// ── Le relevé (lot v179) ───────────────────────────────────────────────────
//
// Trois écrans laissent choisir un mot de passe : la réinitialisation, le
// profil, les réglages. Les trois vérifiaient la même chose, chacun à sa façon,
// et le disaient dans trois formulations différentes :
//
//   reset-password   « Le mot de passe doit contenir au moins 8 caractères. »
//   profile          « Mot de passe trop court (min 8 car.) »
//   settings         « Minimum 8 caractères »
//
// Trois copies d'une même règle : la dérive que les lots v151 à v154, puis v159,
// v170, v175 et v176 ont passé leur temps à défaire. En ajoutant ici le contrôle
// des fuites, on allait en faire trois copies de plus. Elle est donc écrite une
// fois, et les trois écrans la lisent.
//
// ── L'ordre des vérifications n'est pas indifférent ────────────────────────
//
// Ce qui se juge sans réseau passe d'abord : inutile d'interroger HIBP pour un
// mot de passe de quatre lettres, ni de faire attendre quelqu'un qui a
// simplement mal retapé sa confirmation.

import { estCompromisCoteClient } from "./motDePasseCompromisClient"
import { messageCompromis } from "./motDePasseCompromis"

/** Supabase en impose 6 ; le produit en demande 8 depuis toujours. */
export const LONGUEUR_MIN = 8

/**
 * Ce qui se juge sans rien demander à personne.
 * `null` = rien à redire jusqu'ici.
 */
export function refusImmediat(motDePasse: string, confirmation?: string): string | null {
  if (motDePasse.length < LONGUEUR_MIN) return `Le mot de passe doit contenir au moins ${LONGUEUR_MIN} caractères.`
  if (confirmation !== undefined && motDePasse !== confirmation) return "Les deux mots de passe ne correspondent pas."
  return null
}

/**
 * La réponse complète, réseau compris. `null` = acceptable.
 *
 * Le contrôle des fuites ne bloque que sur une réponse POSITIVE de HIBP : une
 * panne laisse passer (la décision est expliquée dans `motDePasseCompromis.ts`).
 */
export async function refusDuMotDePasse(motDePasse: string, confirmation?: string): Promise<string | null> {
  const local = refusImmediat(motDePasse, confirmation)
  if (local) return local
  const fuite = await estCompromisCoteClient(motDePasse)
  return fuite.compromis ? messageCompromis(fuite.occurrences) : null
}
