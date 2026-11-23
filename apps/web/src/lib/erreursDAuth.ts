// erreursDAuth.ts — les erreurs des pages de connexion passent par un CODE, jamais par du texte.
//
// Revue du 23 nov. (vague 0, sécurité de l'inscription) : les pages /auth/login,
// /auth/signup et /auth/forgot-password affichaient `?error=` tel quel. N'importe
// qui pouvait donc faire écrire au VRAI domaine, dans l'encadré d'alerte officiel,
// « Votre compte est suspendu, appelez le 01… » — un lien d'hameçonnage parfait.
// En prime, `decodeURIComponent` levait sur un « % » isolé : la page plantait.
//
// Désormais l'URL ne porte qu'un code. Un code inconnu n'affiche rien. Le seul
// paramètre libre restant, `fois` (combien de fois un mot de passe a fuité), est
// lu comme un entier borné. Module PUR.

import { messageCompromis } from "./motDePasseCompromis"

export const MESSAGES_AUTH = {
  compte_existe: "Cet email a déjà un compte. Connectez-vous.",
  identifiants: "Email ou mot de passe incorrect.",
  email_non_confirme: "Confirmez votre email via le lien reçu par mail.",
  mdp_court: "Le mot de passe doit contenir au moins 6 caractères.",
  email_invalide: "Adresse email invalide.",
  trop_de_tentatives: "Trop de tentatives. Réessayez dans quelques minutes.",
  inscriptions_fermees: "Les inscriptions sont momentanément indisponibles.",
  inconnue: "Une erreur est survenue. Veuillez réessayer.",
  google: "La connexion Google n'a pas abouti. Réessayez, ou créez un compte par email.",
  lien_expire: "Lien invalide ou expiré. Merci de refaire une demande.",
  mdp_compromis: "Ce mot de passe apparaît dans des fuites de données publiques : il est testé en premier par les robots. Choisissez-en un autre, qui ne sert nulle part ailleurs.",
} as const

export type CodeAuth = keyof typeof MESSAGES_AUTH

/** Traduit une erreur Supabase Auth (anglais) en code. */
export function codeDErreurAuth(e: { message?: string } | null): CodeAuth {
  const m = (e?.message || "").toLowerCase()
  if (m.includes("already registered") || m.includes("already been registered")) return "compte_existe"
  if (m.includes("invalid login")) return "identifiants"
  if (m.includes("email not confirmed")) return "email_non_confirme"
  if (m.includes("password should be at least")) return "mdp_court"
  if (m.includes("unable to validate email") || m.includes("invalid email") || m.includes("invalid format")) return "email_invalide"
  if (m.includes("rate limit") || m.includes("too many") || m.includes("for security purposes")) return "trop_de_tentatives"
  if (m.includes("signups not allowed") || m.includes("signup is disabled")) return "inscriptions_fermees"
  return "inconnue"
}

/** Le message à afficher pour `?error=<code>`, ou null si le code est inconnu. */
export function messageDErreurAuth(code: string | string[] | undefined, fois?: string | string[] | undefined): string | null {
  if (typeof code !== "string" || !Object.prototype.hasOwnProperty.call(MESSAGES_AUTH, code)) return null
  if (code === "mdp_compromis" && typeof fois === "string" && /^\d{1,9}$/.test(fois) && Number(fois) > 0) return messageCompromis(Number(fois))
  return MESSAGES_AUTH[code as CodeAuth]
}
