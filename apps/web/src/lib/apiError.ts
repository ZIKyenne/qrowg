import { NextResponse } from "next/server"

// Réponse d'erreur SERVEUR : on logue le détail côté serveur (pour le debug) mais
// on renvoie un message GÉNÉRIQUE au client — évite de divulguer les internes
// Postgres (noms de tables/contraintes) ou Stripe. Les messages précis restent
// réservés aux erreurs de VALIDATION (400), écrites explicitement dans chaque route.
export function serverError(context: string, e: unknown, status = 500) {
  const detail = e instanceof Error ? e.message : (typeof e === "string" ? e : JSON.stringify(e))
  console.error(`[${context}]`, detail)
  return NextResponse.json({ error: "Une erreur est survenue. Réessayez dans un instant." }, { status })
}

// ── Ce que le commerçant lisait à la place (lot v134) ────────────────────────
//
// La règle ci-dessus est suivie dans vingt-deux routes. **Sept réponses**
// tendaient quand même le détail brut :
//
//   api/pages/create:71     `pageError?.message || "Erreur creation page"`
//   api/qr-duplicate:81,108 `e2?.message`, `e3?.message`
//   api/qr-support:54       `error?.message`
//   api/templates/use:97    `pageError?.message` — en repli d'une phrase juste
//   api/domains:48          le message de l'API de l'hébergeur
//   api/cron/prune-events   `error.message`, par table
//
// Le commerçant clique « Créer ma page » et lit, dans son navigateur :
//
//   duplicate key value violates unique constraint "pages_slug_unique"
//
// Deux problèmes dans une seule phrase. D'abord elle donne à qui la reçoit le
// nom d'une table, d'une colonne et d'une contrainte — c'est exactement ce que
// l'en-tête de ce fichier dit d'éviter. Ensuite, et surtout, **elle ne lui
// apprend rien** : il voulait publier une page, il ne sait pas ce qu'est une
// contrainte d'unicité, et il n'a aucune idée de ce qu'il doit changer.
//
// Le plus net est `templates/use` : la même ligne porte les deux gestes.
//
//   error: isDup ? "Cette adresse est déjà prise." : (pageError?.message || …)
//
// Quelqu'un avait vu le cas du doublon et écrit la phrase juste. Tous les autres
// codes retombaient sur le message de Postgres.
//
// La classe : **une erreur montrée au commerçant lui dit quoi faire, et ne dit
// rien de la base.** Le détail part dans le journal du serveur, où il sert.
//
// Et `domains:48` est le même geste sur un autre fournisseur : le message de
// l'API de l'hébergeur remonte jusqu'à `vercel_error`, que deux écrans affichent
// tel quel (`profile/page.tsx`, et un toast dans `DomainsPage`).

/** Ce que Postgres sait nommer, et ce que le commerçant peut en faire. */
export const PHRASE_PAR_CODE: Record<string, { phrase: string; statut: number }> = {
  // Unique violation — deux fois la même valeur là où une seule est permise.
  "23505": { phrase: "Cette valeur est déjà utilisée. Choisissez-en une autre.", statut: 409 },
  // Foreign key violation — la ligne visée n'existe plus.
  "23503": { phrase: "L'élément lié n'existe plus. Rechargez la page et réessayez.", statut: 409 },
  // Not null violation — un champ obligatoire est vide.
  "23502": { phrase: "Un champ obligatoire est vide.", statut: 400 },
  // Check violation — la valeur ne respecte pas une règle de la base.
  "23514": { phrase: "Cette valeur n'est pas acceptée ici.", statut: 400 },
  // String trop longue pour la colonne.
  "22001": { phrase: "Ce texte est trop long.", statut: 400 },
  // Insufficient privilege — la politique d'accès a refusé.
  "42501": { phrase: "Vous n'avez pas accès à cet élément.", statut: 403 },
}

/** Ce qu'on répond quand on ne sait pas nommer la panne. */
export const PHRASE_GENERIQUE = "Une erreur est survenue. Réessayez dans un instant."

type ErreurBase = { code?: string | null; message?: string | null } | null | undefined

/**
 * La phrase à montrer pour une erreur venue de la base — sans son détail.
 *
 * `precisions` permet à une route de dire mieux que la phrase générale quand
 * elle sait de QUELLE unicité il s'agit : `templates/use` sait que son 23505
 * porte sur l'adresse de la page, et le dit. Module pur : testable sans réseau.
 */
export function phraseDeLErreurBase(
  error: ErreurBase, repli = PHRASE_GENERIQUE, precisions?: Record<string, string>,
): { phrase: string; statut: number } {
  const code = error?.code ?? ""
  const connu = PHRASE_PAR_CODE[code]
  const precise = precisions?.[code]
  if (precise) return { phrase: precise, statut: connu?.statut ?? 400 }
  if (connu) return connu
  return { phrase: repli, statut: 500 }
}

/**
 * Réponse d'erreur pour une écriture en base : le détail au journal, une phrase
 * utile au commerçant.
 *
 * `serverError` répond toujours la même chose, ce qui est juste quand on ne sait
 * rien ; ici on sait souvent quelque chose — et une adresse déjà prise mérite
 * mieux qu'« une erreur est survenue ».
 */
export function erreurDeBase(
  contexte: string, error: ErreurBase, repli = PHRASE_GENERIQUE, precisions?: Record<string, string>,
) {
  console.error(`[${contexte}]`, error?.code ?? "", error?.message ?? "")
  const { phrase, statut } = phraseDeLErreurBase(error, repli, precisions)
  return NextResponse.json({ error: phrase }, { status: statut })
}
