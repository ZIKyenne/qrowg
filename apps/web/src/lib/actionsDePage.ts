// actionsDePage.ts — ce qu'on peut faire d'une page, selon son état.
//
// Audit du 14 novembre 2026 (C1/C2) : le menu « Pages » menait à la galerie de
// modèles, et « Mes pages → Tout voir » au studio de QR. Aucun écran ne listait
// les projets existants. L'écran /dashboard/pages le fait ; ce module dit, pour
// chaque ligne, quelles actions ont un sens. Module PUR.
//
// Règle : une action n'est proposée que si elle aboutit. Un brouillon n'a pas
// d'adresse publique : « Ouvrir » ou « Partager » y mèneraient à une 404.

import { lienQrDeLaPage } from "./qrDeLaPage"

export const LIEN_MES_PAGES = "/dashboard/pages"

export type PageListee = {
  id: string; slug: string; status: string | null
  /** short_code du QR de la page, s'il existe. */ qr?: string | null
  /** La page porte une carte (bloc Menu) : « Ma carte » y règle les produits épuisés. */ carte?: boolean
}

export type ActionDePage =
  | { cle: "modifier"; libelle: string; href: string }
  | { cle: "ouvrir"; libelle: string; href: string; externe: true }
  | { cle: "partager"; libelle: string }
  | { cle: "qr"; libelle: string; href: string }
  | { cle: "stats"; libelle: string; href: string }
  | { cle: "imprimer"; libelle: string; href: string }
  | { cle: "carte"; libelle: string; href: string }

export const estEnLigne = (p: Pick<PageListee, "status">) => p.status === "published"

export const lienMaCarte = (pageId: string) => `/dashboard/pages/${encodeURIComponent(pageId)}/carte`

export const lienStatsDeLaPage = (pageId: string) =>
  `/dashboard/analytics?page=${encodeURIComponent(pageId)}`

export function actionsDePage(p: PageListee): ActionDePage[] {
  const modifier = `/dashboard/builder/${encodeURIComponent(p.id)}`
  if (!estEnLigne(p)) {
    // Brouillon : on le reprend. Rien d'autre n'aboutit tant qu'il n'est pas publié.
    return [{ cle: "modifier", libelle: "Reprendre", href: modifier }]
  }
  return [
    { cle: "modifier", libelle: "Modifier", href: modifier },
    // Le geste du soir, juste après Modifier : « plus de menthe » en un toucher.
    ...(p.carte ? [{ cle: "carte" as const, libelle: "Ma carte", href: lienMaCarte(p.id) }] : []),
    { cle: "ouvrir", libelle: "Ouvrir", href: `/${p.slug}`, externe: true },
    { cle: "partager", libelle: "Partager" },
    { cle: "qr", libelle: "QR", href: lienQrDeLaPage(p.id) },
    { cle: "stats", libelle: "Stats", href: lienStatsDeLaPage(p.id) },
    // Ma page → son QR → son support : l'atelier s'ouvre sur CE QR (audit C).
    ...(p.qr ? [{ cle: "imprimer" as const, libelle: "Imprimer", href: `/dashboard/print-studio?qr=${encodeURIComponent(p.qr)}` }] : []),
  ]
}

export type FiltrePages = "toutes" | "en_ligne" | "brouillons"

export function filtrerPages<T extends PageListee & { title?: string | null }>(pages: readonly T[], filtre: FiltrePages, recherche = ""): T[] {
  const q = recherche.trim().toLocaleLowerCase("fr")
  return pages.filter(p => {
    if (filtre === "en_ligne" && !estEnLigne(p)) return false
    if (filtre === "brouillons" && estEnLigne(p)) return false
    if (!q) return true
    return `${p.title ?? ""} ${p.slug}`.toLocaleLowerCase("fr").includes(q)
  })
}
