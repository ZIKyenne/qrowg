// perimetreDeMesure.ts — « Toutes les pages », sauf les vôtres.
//
// Relevé du 14 septembre, sur un compte Business (pages illimitées) à 26 pages.
// Le tableau de bord charge ses pages ainsi :
//
//     .select("id,title,slug,status,total_views,created_at")
//     .order("created_at", { ascending: false }).limit(20)
//
// — vingt, c'est la bonne taille pour une LISTE de cartes. Mais les mêmes vingt
// identifiants servent ensuite à charger les clics et les vues des objectifs de
// conversion (`.in("page_id", ids)`), et la carte d'objectif, elle, annonce
// « Toutes les pages ».
//
// Ce que l'écran affichait, et ce que valaient réellement les mêmes objectifs :
//
//     WhatsApp — vitrine   whatsapp · 90 j · Page
//          0 conv. | taux   —   |   0 % | en retard      (réel : 270 | 7,5 % | en bonne voie)
//     WhatsApp — partout   whatsapp · 90 j · Toutes les pages
//         90 conv. | taux  20 % |  90 % | en retard      (réel : 360 | 8,9 % | en bonne voie)
//
// Trois choses fausses, et une pire que les autres :
//
//  · l'objectif posé sur la première page du compte lit zéro — les pages qui
//    tombent hors des vingt sont les PLUS ANCIENNES, c'est-à-dire celles qui ont
//    de l'historique ; son nom s'affiche même « Page », faute de la trouver ;
//  · le total « Toutes les pages » vaut le quart du vrai ;
//  · le taux de conversion, lui, est GONFLÉ — 20 % au lieu de 8,9 % — parce que
//    la page manquante pesait plus en vues qu'en clics. Un chiffre faux dans le
//    sens flatteur est celui sur lequel on décide.
//
// La règle : un total ne nomme jamais un périmètre plus large que celui qu'on a
// lu. Soit on lit tout, soit on le dit. Module PUR.

/** Ce que la LISTE de cartes du tableau de bord affiche — inchangé. */
export const PAGES_LISTE = 20

/** Ce que la mesure des objectifs lit : toutes les pages, jusqu'à ce plafond. */
export const PAGES_MESUREES = 500

/** La fenêtre de données chargée pour les objectifs, en jours. */
export const FENETRE_OBJECTIFS_JOURS = 90

export type PageMesuree = { id: string; title?: string | null; slug?: string | null }

function entierPositif(n: unknown): number {
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

/**
 * Le périmètre réellement lu. `pagesTotal` vient d'un `count: "exact"` : quand on
 * ne le connaît pas, on ne suppose pas qu'il est complet — on ne dit rien.
 */
export function perimetreLu(pagesLues: number, pagesTotal?: number | null): { complet: boolean; manquantes: number } {
  const lues = entierPositif(pagesLues)
  if (pagesTotal === null || pagesTotal === undefined || !Number.isFinite(pagesTotal)) {
    return { complet: true, manquantes: 0 }
  }
  const total = entierPositif(pagesTotal)
  const manquantes = Math.max(0, total - lues)
  return { complet: manquantes === 0, manquantes }
}

/**
 * La phrase qui manquait sous les totaux. Elle ne s'affiche que si des pages
 * échappent vraiment à la mesure — sinon on n'encombre pas un écran juste.
 */
export function phrasePerimetreIncomplet(manquantes: number): string | null {
  const n = entierPositif(manquantes)
  if (n < 1) return null
  return n === 1
    ? "1 page n'entre pas dans ces chiffres : la mesure s'arrête aux pages les plus récentes."
    : `${n} pages n'entrent pas dans ces chiffres : la mesure s'arrête aux ${PAGES_MESUREES} pages les plus récentes.`
}

/**
 * La période réellement mesurable : celle de l'objectif, plafonnée par la
 * fenêtre de données chargée. Une carte qui annonce « 180 j » alors que
 * l'écran n'a lu que 90 jours affiche un total de 90 jours sous une étiquette
 * de 180.
 */
export function periodeMesuree(periodeJours: number, fenetreJours: number = FENETRE_OBJECTIFS_JOURS): number {
  const p = entierPositif(periodeJours)
  const f = entierPositif(fenetreJours) || FENETRE_OBJECTIFS_JOURS
  if (!p) return 0
  return Math.min(p, f)
}

/** Dit-on plus que ce qu'on a lu ? */
export function periodeTronquee(periodeJours: number, fenetreJours: number = FENETRE_OBJECTIFS_JOURS): boolean {
  return entierPositif(periodeJours) > periodeMesuree(periodeJours, fenetreJours)
}

/** Et si oui, on l'écrit sur la carte plutôt que de laisser croire. */
export function phrasePeriodeTronquee(periodeJours: number, fenetreJours: number = FENETRE_OBJECTIFS_JOURS): string | null {
  if (!periodeTronquee(periodeJours, fenetreJours)) return null
  const mesuree = periodeMesuree(periodeJours, fenetreJours)
  return `Mesuré sur ${mesuree} jours — les données au-delà ne sont pas chargées.`
}

/**
 * Le nom de la page d'un objectif. Trois cas, trois phrases honnêtes : toutes
 * les pages, celle-ci, ou une page qui n'existe plus — et dans ce dernier cas
 * les zéros affichés s'expliquent enfin.
 */
export function nomDePageObjectif(pageId: string | null | undefined, pages: PageMesuree[] | null | undefined): string {
  if (!pageId) return "Toutes les pages"
  const p = (pages ?? []).find(x => x?.id === pageId)
  const titre = typeof p?.title === "string" ? p.title.trim() : ""
  if (titre) return titre
  const slug = typeof p?.slug === "string" ? p.slug.trim() : ""
  if (slug) return slug
  return p ? "Page sans titre" : "Page supprimée"
}

/** L'objectif porte-t-il sur une page absente de la mesure ? */
export function objectifSansPage(pageId: string | null | undefined, pages: PageMesuree[] | null | undefined): boolean {
  if (!pageId) return false
  return !(pages ?? []).some(x => x?.id === pageId)
}
