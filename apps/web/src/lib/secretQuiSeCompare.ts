// secretQuiSeCompare — un secret se compare en temps constant, et n'entre que
// par une porte.
//
// Relevé du 15 septembre. `gardeCron` a écrit les deux règles, il y a quelques
// jours, en refermant les portes des cinq tâches planifiées :
//
//   « Le secret présenté : en-tête Authorization uniquement (c'est ce que Vercel
//     Cron envoie). Il était aussi accepté en query string — donc dans les
//     journaux d'accès et l'historique — et dans le corps. »
//
//   « Comparaison à temps constant : `includes` s'arrêtait au premier octet
//     différent. »
//
// **Trois endroits ne les suivent pas.** Et le plus exposé est celui qui efface :
//
//   app/api/cron/prune-events/route.ts
//     const secret = req.nextUrl.searchParams.get("secret")
//     if (CRON_SECRET === "" || (auth !== `Bearer ${CRON_SECRET}` && secret !== CRON_SECRET))
//
//   C'est la SEULE route destructive du produit — elle supprime définitivement
//   les lignes de `scans`, `page_views`, `block_clicks` au-delà de la fenêtre de
//   rétention. C'est aussi la seule qui a gardé la porte que le produit a fermée
//   partout ailleurs : le secret en clair dans l'URL, donc dans les journaux
//   d'accès de l'hébergeur, dans l'historique du navigateur, dans le `Referer`
//   envoyé à la page suivante. Elle compare avec `!==`, qui s'arrête au premier
//   octet différent. Et elle refuse sans laisser de trace : le journal des tâches
//   ne peut pas distinguer « jamais déclenchée » de « déclenchée et refusée » —
//   exactement le manque que `gardeCron` a été écrit pour combler.
//
//   lib/rateLimit.ts:90   `req.headers.get("x-internal-token") === secret`
//     Le même CRON_SECRET, comparé autrement. Il protège les envois d'e-mails
//     internes (bienvenue, abonnement).
//
//   app/api/reports/unsubscribe/route.ts:32   `token !== expectedToken`
//     Ce jeton-là voyage dans un e-mail, donc dans une boîte de réception : une
//     boîte partagée, un message transféré, un filtre anti-spam qui ouvre les
//     liens. Et ce n'est pas un secret — c'est `base64url(sub.id)`, l'identifiant
//     de la ligne, réversible. Voir `jetonDeDesabonnement` plus bas.
//
// La classe : **un secret se compare en temps constant, et n'entre que par
// l'en-tête `Authorization`.** Module PUR (node:crypto seulement), pour être
// importable des routes comme des tâches, sans traîner le client d'administration.

import { timingSafeEqual, createHmac } from "node:crypto"

/**
 * Deux secrets sont-ils identiques ?
 *
 * `===` et `includes` s'arrêtent au premier octet différent : le temps de réponse
 * dit alors combien d'octets étaient bons, et un secret se devine octet par octet.
 * `timingSafeEqual` compare toujours toute la longueur.
 *
 * Les longueurs, elles, ne peuvent pas se comparer à temps constant (le tampon
 * doit avoir la même taille) : elles fuient la longueur du secret, pas sa valeur.
 */
export function secretsEgaux(donne: string, attendu: string): boolean {
  const a = Buffer.from(donne, "utf8"), b = Buffer.from(attendu, "utf8")
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * Le secret présenté par une requête : l'en-tête `Authorization: Bearer …`, et
 * rien d'autre.
 *
 * Une seule porte. Un secret lu dans l'URL finit dans les journaux d'accès, dans
 * l'historique, et dans l'en-tête `Referer` de la requête suivante ; un secret lu
 * dans le corps ne peut pas être présenté par un appel `GET` de l'ordonnanceur.
 */
export function secretPresente(req: { headers: { get(n: string): string | null } }): string | null {
  const auth = req.headers.get("authorization")
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null
}

/**
 * Un en-tête nommé porte-t-il le bon secret ? (`x-internal-token`, et les autres.)
 *
 * Renvoie `false` si le secret attendu est vide : sans secret configuré, tout le
 * monde passerait — le produit refuse plutôt que d'ouvrir (fail-closed).
 */
export function enTetePorteLeSecret(
  req: { headers: { get(n: string): string | null } }, nom: string, attendu: string | undefined | null,
): boolean {
  if (!attendu) return false
  const donne = req.headers.get(nom)
  return donne !== null && secretsEgaux(donne, attendu)
}

// ── Le jeton d'un lien de désabonnement ──────────────────────────────────────
//
// `base64url(sub.id)` n'est pas un secret : c'est l'identifiant de la ligne,
// écrit autrement. Qui connaît l'identifiant connaît le jeton.
//
// On ne peut pas simplement changer de format : des liens sont déjà partis dans
// des e-mails, et un lien de désabonnement qui cesse de fonctionner est une
// promesse rompue — celle que la loi impose. La route accepte donc les DEUX, en
// temps constant, et les e-mails suivants portent le jeton signé.

/** Le jeton historique : l'identifiant, encodé. Toujours accepté. */
export function jetonHistorique(subId: string): string {
  return Buffer.from(subId).toString("base64url")
}

/**
 * Le jeton signé : une empreinte de l'identifiant par un secret du serveur.
 * Sans secret configuré, retombe sur le jeton historique — le lien marche
 * toujours, et rien ne casse.
 */
export function jetonDeDesabonnement(subId: string, secret = process.env.CRON_SECRET): string {
  if (!secret) return jetonHistorique(subId)
  return createHmac("sha256", secret).update(`unsub:${subId}`).digest("base64url")
}

/** Ce jeton ouvre-t-il ce désabonnement ? L'ancien comme le nouveau. */
export function jetonValide(jeton: string, subId: string, secret = process.env.CRON_SECRET): boolean {
  if (!jeton) return false
  return secretsEgaux(jeton, jetonDeDesabonnement(subId, secret)) || secretsEgaux(jeton, jetonHistorique(subId))
}
