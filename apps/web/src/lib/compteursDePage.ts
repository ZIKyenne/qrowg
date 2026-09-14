// compteursDePage.ts — trois compteurs affichés, et ce qu'ils comptent vraiment.
//
// Relevé du 14 septembre, en lisant le schéma comme oracle.
//
// 1) `pages.total_views` n'est incrémenté que par un trigger, et ce trigger
//    écoute la table `scans` :
//
//      create trigger on_scan_created after insert on public.scans
//      → update public.pages set total_views = total_views + 1 …
//
//    Aucun trigger sur `page_views`. La colonne qui s'appelle « vues » compte
//    donc les SCANS du QR, et jamais une visite arrivée par un lien. Sur une
//    page de restaurant, un mois — 40 scans en salle, 300 visites depuis le
//    lien Instagram :
//
//      Carte de la page (dashboard)   « 40 vues »    ← pages.total_views
//      Écran Statistiques             « 340 vues »   ← lignes page_views
//
//    88 % du trafic manquait au chiffre que le commerçant voit en premier — et
//    ce même chiffre part sur la page PUBLIQUE (compteur de visiteurs).
//
// 2) `pages.unique_views` n'est écrit NULLE PART : ni trigger, ni code. Le
//    profil affiche pourtant « Visiteurs uniq » avec l'infobulle « Visiteurs
//    uniques (hors doublons) » — c'est zéro pour tout le monde, et la colonne
//    part aussi dans deux exports CSV.
//
// 3) `profiles.total_pages` non plus (le rapport hebdomadaire l'avait déjà
//    constaté le 9 septembre : « la colonne vaut 0 pour tout le monde, y
//    compris un compte à douze pages »). Quatre écrans la lisent encore.
//
// La règle : un compteur qu'on affiche est alimenté par quelque chose. Sinon on
// ne l'affiche pas — on calcule le vrai, ou on se tait. Module PUR.

/** Fenêtre des visiteurs uniques : la même que le reste des statistiques. */
export const FENETRE_VISITEURS_JOURS = 90

/**
 * Faut-il incrémenter `pages.total_views` pour cette vue ?
 *
 * Le trigger `increment_scan_counters` compte déjà les visites venues d'un QR
 * (il se déclenche sur l'insertion du scan). On compte donc ici — et seulement
 * ici — celles que personne ne comptait : les visites directes, par lien, par
 * moteur de recherche, par bio Instagram.
 */
export function vueACompterEnBase(scanProuve: boolean | null | undefined): boolean {
  return scanProuve !== true
}

/** Les compteurs réellement alimentés par le trigger du schéma. */
export const COMPTEURS_PAR_TRIGGER = ["qr_codes.total_scans", "pages.total_views", "profiles.total_scans"] as const

/** Les colonnes que rien n'écrit : aucun écran ne doit les lire. */
export const COLONNES_MORTES = ["unique_views", "total_pages"] as const

export function estColonneMorte(nom: string): boolean {
  return (COLONNES_MORTES as readonly string[]).includes(nom)
}

/**
 * Les visiteurs uniques, calculés au lieu d'être lus dans une colonne vide.
 * `page_views.session_id` est la session pseudo-anonyme posée par le client
 * (`lib/trackPageView`) : c'est ce que le produit sait de « la même personne ».
 * Une ligne sans session ne se rattache à personne — elle ne compte pas comme
 * un visiteur de plus.
 */
export function visiteursUniques(lignes: { session_id?: string | null }[] | null | undefined): number {
  const vus = new Set<string>()
  for (const l of lignes ?? []) {
    const s = typeof l?.session_id === "string" ? l.session_id.trim() : ""
    if (s) vus.add(s)
  }
  return vus.size
}

/** Le libellé, avec la fenêtre — un chiffre sans période ne veut rien dire. */
export function libelleVisiteursUniques(fenetreJours: number = FENETRE_VISITEURS_JOURS): string {
  return `Visiteurs (${fenetreJours} j)`
}

/** Et l'infobulle qui dit d'où vient le chiffre. */
export function infobulleVisiteursUniques(fenetreJours: number = FENETRE_VISITEURS_JOURS): string {
  return `Personnes distinctes ayant ouvert vos pages sur ${fenetreJours} jours, hors robots.`
}

/**
 * Le nombre de pages d'un compte : celui qu'on a sous la main, jamais
 * `profiles.total_pages` — que rien n'incrémente depuis le premier schéma.
 */
export function nombreDePages(pages: unknown[] | null | undefined, total?: number | null): number {
  if (typeof total === "number" && Number.isFinite(total) && total >= 0) return Math.floor(total)
  return (pages ?? []).length
}
