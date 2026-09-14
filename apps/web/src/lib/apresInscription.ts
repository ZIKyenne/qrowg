// apresInscription.ts — l'inscription ne lit pas ce qu'elle reçoit.
//
// Relevé du 14 septembre. `app/auth/actions.ts` fait :
//
//     const { error } = await supabase.auth.signUp({ … })
//
// `data` est jeté. Or Supabase répond trois choses différentes :
//
//   confirmation désactivée   session présente, compte prêt
//   confirmation ACTIVÉE      session ABSENTE, un e-mail attend dans la boîte
//   adresse déjà inscrite     session absente, `user.identities` VIDE — Supabase
//                             répond « succès » exprès, pour ne pas révéler
//                             qu'une adresse a déjà un compte
//
// Les trois partent au même endroit : `/dashboard/onboarding`. Dans deux cas sur
// trois, la personne atterrit sur un écran qui la renvoie à la connexion, sans
// un mot sur l'e-mail qui l'attend. Elle vient de créer un compte et elle est
// devant un formulaire de connexion.
//
// Et l'e-mail de bienvenue part dans les trois cas — alors que
// `/auth/callback` l'envoie DÉJÀ au premier passage (`isBrandNew`). Sur un
// compte à confirmer, il arrive donc avant le lien de confirmation, puis une
// seconde fois quand la personne clique dessus.
//
// Module PUR.

/** Ce que `supabase.auth.signUp` renvoie, réduit à ce qui décide. */
export type ReponseInscription = {
  session?: unknown | null
  user?: { identities?: unknown[] | null } | null
} | null | undefined

export type SuiteInscription = "connecte" | "a_confirmer"

/**
 * Où en est-on après l'inscription ?
 *
 * Sans session, le compte n'est pas utilisable : que l'adresse soit nouvelle et
 * en attente de confirmation, ou qu'elle ait déjà un compte, la personne doit
 * aller voir sa boîte. On ne distingue PAS les deux à l'écran : dire « cette
 * adresse a déjà un compte » révélerait à un inconnu qu'elle est inscrite — ce
 * que Supabase prend soin de ne pas faire. Le bon e-mail part de toute façon.
 */
export function suiteDeLInscription(r: ReponseInscription): SuiteInscription {
  return r?.session ? "connecte" : "a_confirmer"
}

/** Une adresse déjà inscrite se reconnaît à une liste d'identités vide. */
export function adresseDejaInscrite(r: ReponseInscription): boolean {
  const ids = r?.user?.identities
  return Array.isArray(ids) && ids.length === 0
}

/** Destination interne sûre : jamais `//hôte`, jamais l'extérieur. */
export function destinationInterne(valeur: string | null | undefined, repli = ""): string {
  const v = (valeur ?? "").trim()
  return v.startsWith("/") && !v.startsWith("//") ? v : repli
}

/**
 * Où envoyer la personne après l'inscription. Connectée : là où elle allait.
 * À confirmer : sur l'écran d'inscription, qui lui dit quoi faire — et qui
 * garde sa destination pour l'y ramener après la confirmation.
 */
export function destinationApresInscription(r: ReponseInscription, redirection?: string | null, email?: string | null): string {
  const to = destinationInterne(redirection)
  if (suiteDeLInscription(r) === "connecte") return to || "/dashboard/onboarding"
  const params = new URLSearchParams()
  const e = (email ?? "").trim()
  if (e) params.set("confirmer", e)
  if (to) params.set("redirect", to)
  const q = params.toString()
  return q ? `/auth/signup?${q}` : "/auth/signup?confirmer=1"
}

/**
 * L'e-mail de bienvenue part-il d'ici ?
 *
 * Seulement si le compte est utilisable tout de suite. Sinon c'est
 * `/auth/callback` qui l'enverra, au moment où la personne confirme — il le fait
 * déjà pour les comptes Google, avec le même garde `isBrandNew`.
 */
export function doitEnvoyerBienvenue(r: ReponseInscription): boolean {
  return suiteDeLInscription(r) === "connecte"
}

/** Ce que l'écran dit à quelqu'un qui doit aller voir sa boîte. */
export function phraseConfirmation(email: string | null | undefined): string {
  const e = (email ?? "").trim()
  return e
    ? `Un e-mail vient de partir à ${e}. Ouvrez-le et cliquez sur le lien pour activer votre compte.`
    : "Un e-mail vient de partir. Ouvrez-le et cliquez sur le lien pour activer votre compte."
}

/** Et la ligne d'à côté, pour celui qui ne le trouve pas. */
export const PHRASE_CONFIRMATION_AIDE =
  "Rien reçu ? Regardez dans les indésirables, puis réessayez avec la même adresse."
