// ceQueMesureLeProduit.ts — ce que les compteurs comptent, ce qu'ils gardent,
// et ce qu'ils ne sauront jamais. La seule source pour en parler, en vitrine
// comme à l'écran.
//
// ── Deux constats du 29 septembre ──────────────────────────────────────────
//
// Q20. L'accueil promettait « Sachez exactement qui scanne », et la grille
// tarifaire « Voyez qui scanne, quand et avec quoi ». Le produit ne sait pas
// QUI. Il ne connaît ni nom, ni adresse e-mail, ni numéro : rien de ce qu'il
// enregistre ne désigne une personne par elle-même.
//
// Q30. « Vues », « Visites », « Scans », « Scans QR » cohabitaient d'un panneau
// à l'autre pour désigner parfois la même chose — la table `page_views` est
// « Vues » chez GeoPanel et « Visites » chez DevicePanel. Et rien, nulle part,
// ne disait la différence entre un scan, une redirection et une visite : un
// serveur voit passer une requête, il ne voit pas s'ouvrir une caméra.
//
// ── Ce qui a failli être écrit ici, et qui était faux ──────────────────────
//
// Une première version de ce fichier annonçait « pas d'IP conservée, seul le
// pays ». En ouvrant les deux chemins d'écriture, c'est plus nuancé — et c'est
// la nuance qui compte :
//
//  · `/api/track` (une VUE de page) écrit pays, source, référent, famille
//    d'appareil et un identifiant de session ;
//  · `/q/<code>` (un SCAN, qui passe par la redirection) écrit en plus la
//    ville, le système et le navigateur, les paramètres de campagne, et un
//    `ip_hash` — l'empreinte SHA-256 de (adresse IP + navigateur + sel), qui
//    sert à estimer les visiteurs uniques.
//
// Cette empreinte est une **pseudonymisation**, pas une anonymisation : elle ne
// donne pas l'adresse, mais elle distingue durablement un appareil. La page
// Confidentialité le décrit déjà ainsi ; c'est la vitrine qui promettait
// l'inverse — dans les deux sens, d'ailleurs : trop savoir d'un côté, trop peu
// de l'autre.
//
// La règle : **un compteur porte un nom, et ce nom a une définition écrite.**
//
// Module PUR : aucune dépendance, testable seul.

export type Dimension = {
  cle: string
  nom: string
  desc: string
  /** Écrit à chaque vue de page, ou seulement quand le QR est scanné. */
  quand: "toute vue" | "scan seulement"
}

/** Ce qui est réellement enregistré — une ligne par colonne écrite. */
export const DIMENSIONS_MESUREES: readonly Dimension[] = [
  { cle: "source", nom: "Source", desc: "scan du QR, lien direct, réseau social ou moteur de recherche", quand: "toute vue" },
  { cle: "device", nom: "Appareil", desc: "la famille : mobile, tablette ou ordinateur", quand: "toute vue" },
  { cle: "country", nom: "Pays", desc: "le code à deux lettres donné par le réseau de diffusion", quand: "toute vue" },
  { cle: "referrer", nom: "Page d’origine", desc: "l’adresse depuis laquelle on est arrivé, quand le navigateur la transmet", quand: "toute vue" },
  { cle: "session_id", nom: "Session", desc: "un identifiant de passage, le temps d’une visite", quand: "toute vue" },
  { cle: "city", nom: "Ville", desc: "la ville estimée par le réseau de diffusion", quand: "scan seulement" },
  { cle: "os", nom: "Système", desc: "iOS, Android, Windows…", quand: "scan seulement" },
  { cle: "browser", nom: "Navigateur", desc: "Safari, Chrome, Firefox…", quand: "scan seulement" },
  { cle: "utm", nom: "Campagne", desc: "les paramètres de campagne présents dans le lien scanné", quand: "scan seulement" },
  { cle: "ip_hash", nom: "Empreinte d’appareil", desc: "une empreinte salée de l’adresse et du navigateur, pour estimer les visiteurs uniques — elle ne redonne pas l’adresse, mais elle distingue un appareil", quand: "scan seulement" },
] as const

/**
 * Ce que le produit ne mesure PAS. C'est la moitié de la réponse à « savez-vous
 * qui scanne ? », et c'est celle qu'on oublie d'écrire.
 */
export const NON_MESURE: readonly string[] = [
  "le nom, l’adresse e-mail ou le numéro de la personne qui scanne",
  "son adresse exacte : la localisation s’arrête à la ville estimée par le réseau",
  "son activité sur d’autres sites",
  "de quoi la reconnaître d’un support à l’autre sans qu’elle scanne",
] as const

/** La phrase de vitrine, bornée à ce que les listes ci-dessus autorisent. */
export function promesseMesure(): string {
  return "Voyez d’où viennent vos scans"
}

/** Le détail, pour une carte d'offre : les dimensions, nommées. */
export function detailMesure(): string {
  return "Scans et vues par jour, source, appareil, ville et pays"
}

/** La phrase qui borne la promesse — à afficher partout où l'on vante la mesure. */
export function limiteMesure(): string {
  return "Des statistiques agrégées : vous voyez des tendances, jamais l’identité de qui scanne."
}

// ── Les compteurs, et ce que chacun compte exactement (Q30) ────────────────

export type Compteur = {
  /** Le mot affiché. Un seul par notion : c'est tout l'objet de ce tableau. */
  nom: string
  /** Ce qu'une unité représente, en une phrase qu'un commerçant peut vérifier. */
  definition: string
  /** Ce que ce compteur ne dit pas — la limite, dite avant qu'on la découvre. */
  limite: string
}

export const COMPTEURS: Record<"scans" | "vues" | "clics" | "sessions", Compteur> = {
  scans: {
    nom: "Scans",
    definition: "Une ouverture de votre page passée par la redirection du QR code.",
    limite: "Nous comptons une requête, pas une caméra. Un code photographié sans être ouvert n’apparaît pas ; une page rouverte depuis l’historique peut apparaître.",
  },
  vues: {
    nom: "Vues",
    definition: "Un affichage de votre page publiée, quelle que soit la façon d’y arriver : QR code, lien partagé, moteur de recherche.",
    limite: "Un rechargement compte pour une vue de plus. Les robots reconnus sont écartés, jamais tous.",
  },
  clics: {
    nom: "Clics",
    definition: "Un appui sur un lien, un bouton ou un moyen de contact de votre page.",
    limite: "Un clic dit qu’on est parti vers une destination, pas qu’on y est arrivé.",
  },
  sessions: {
    nom: "Sessions",
    definition: "Un passage sur votre page, estimé à partir d’un identifiant gardé le temps de la visite.",
    limite: "Une même personne revenue plus tard, ou depuis un autre appareil, compte pour une session de plus.",
  },
}

/** Les définitions dans l'ordre où elles se lisent. */
export const COMPTEURS_ORDONNES: Compteur[] = [COMPTEURS.scans, COMPTEURS.vues, COMPTEURS.clics, COMPTEURS.sessions]

/**
 * Le nom canonique d'un compteur. `page_views` s'appelait « Vues » sur un
 * panneau et « Visites » sur le voisin, pour la même requête.
 */
export const NOM_CANONIQUE: Record<string, string> = {
  scan: COMPTEURS.scans.nom, scans: COMPTEURS.scans.nom,
  vue: COMPTEURS.vues.nom, vues: COMPTEURS.vues.nom, visite: COMPTEURS.vues.nom, visites: COMPTEURS.vues.nom,
  clic: COMPTEURS.clics.nom, clics: COMPTEURS.clics.nom,
  session: COMPTEURS.sessions.nom, sessions: COMPTEURS.sessions.nom,
}
