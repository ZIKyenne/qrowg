// adressesReservees.ts — les adresses qu'une page de commerçant ne peut pas prendre.
//
// ── Le relevé du 22 septembre ──────────────────────────────────────────────
//
// Le produit sert dix-huit segments de premier niveau : `/features`, `/guides`,
// `/outils`, `/q/…`, `/contact`… Quand un visiteur demande `/guides`, c'est la
// route du produit qui répond — jamais `/[slug]`, qui ne voit que ce qui reste.
//
// La liste des adresses réservées en comptait dix-neuf, écrite à la main, et
// **il en manquait huit** :
//
//     creer  generateur-qr-code  generateur-qr-code-wifi  guides
//     outils  q  qr-code  security
//
// Un commerçant pouvait donc prendre `guides` comme adresse. L'interface lui
// répondait « disponible », la création l'acceptait — et sa page n'était
// **jamais servie**. Il imprimait un QR code vers `qrowg.com/guides`, le client
// scannait, et tombait sur la page « Guides » de QRowg. Rien ne l'en avertissait,
// ni à la création, ni après.
//
// `q` est le pire des huit : c'est la route de redirection des QR codes.
//
// La liste existait en **deux copies mot pour mot** — la vérification de
// disponibilité et la création depuis un modèle. C'est la quatrième fois de
// cette série qu'une règle recopiée finit par ne plus dire la vérité (lots v159
// à v161). Elle est ici, à un seul endroit.
//
// ── Ce que ce fichier NE corrige pas ───────────────────────────────────────
//
// Les pages qui portent déjà l'une de ces huit adresses restent telles quelles :
// elles étaient déjà inaccessibles, et les réserver ne leur retire rien. Ce lot
// empêche d'en créer de nouvelles ; il ne répare pas celles qui existent. Les
// retrouver demande de lire la base, ce qui n'est pas du ressort d'un lot de
// code — c'est noté dans la revue.

/**
 * Les segments que le produit sert lui-même.
 *
 * **Cette liste est le reflet du dossier `app/`**, pas une opinion : elle est
 * recalculée depuis l'arborescence par sa garde (`adresseQuiSeReserve.test.ts`),
 * qui échoue si l'une dérive de l'autre. Ajouter une page au produit sans
 * l'ajouter ici fait donc échouer la suite, au lieu de créer silencieusement une
 * adresse qu'un commerçant peut prendre sans jamais être servi.
 */
export const SEGMENTS_SERVIS: readonly string[] = [
  "api", "auth", "contact", "creer", "dashboard", "examples", "features",
  "generateur-qr-code", "generateur-qr-code-wifi", "guides", "legal", "outils",
  "privacy", "q", "qr-code", "security", "terms", "upgrade",
]

/**
 * Réservées à la main, et pourquoi.
 *
 * Aucune n'est un segment de premier niveau : ce sont des écrans internes
 * (`/dashboard/settings`, `/auth/login`) ou des mots qu'on ne veut pas voir
 * servir de vitrine à quelqu'un d'autre. Les garder coûte neuf adresses sur un
 * espace de noms immense, et évite qu'un client pris pour QRowg s'y trompe.
 */
export const RESERVES_A_LA_MAIN: readonly string[] = [
  "admin", "login", "new", "pricing", "profile", "qr-codes", "settings", "signup", "templates",
]

/** Toutes les adresses interdites, triées — l'ordre rend les écarts lisibles. */
export const ADRESSES_RESERVEES: readonly string[] =
  [...new Set([...SEGMENTS_SERVIS, ...RESERVES_A_LA_MAIN])].sort()

/**
 * Cette adresse est-elle réservée ?
 *
 * Compare comme le produit enregistre : en minuscules, sans espaces autour. Une
 * valeur qui n'est pas du texte est réservée — refuser vaut mieux qu'accepter
 * ce qu'on n'a pas su lire.
 */
export function adresseReservee(slug: unknown): boolean {
  if (typeof slug !== "string") return true
  return ADRESSES_RESERVEES.includes(slug.trim().toLowerCase())
}
