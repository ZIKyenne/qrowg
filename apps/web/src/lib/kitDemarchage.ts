// kitDemarchage.ts — les deux liens de la fiche à laisser au comptoir.
//
// Kit de démarchage (16 novembre) : une fiche A5 avec deux QR.
//  · « Voir une carte d'exemple » : de préférence une VRAIE page de votre
//    compte qui porte une carte, par SON QR (/q/<code>) — le scan est compté,
//    et la démonstration se fait en direct : vous épuisez un cocktail dans
//    « Ma carte », le gérant le voit barré sur son téléphone. À défaut, la carte
//    d'exemple publique.
//  · « Créer ma carte » : la page Bars & restaurants, avec VOTRE code de
//    parrainage — l'inscription vous est rattachée, Pilotage la compte.
// Module PUR.

export const EXEMPLE_PUBLIC = "/examples/resto_bar"

export type PageDeDemo = { id: string; title: string | null; slug: string; qr: string | null }

export function liensDuKit(appUrl: string, refCode: string | null, demo: PageDeDemo | null): { exemple: string; inscription: string } {
  const base = (appUrl || "https://qrowg.com").replace(/\/+$/, "")
  const exemple = demo
    ? (demo.qr ? `${base}/q/${encodeURIComponent(demo.qr)}` : `${base}/${encodeURIComponent(demo.slug)}`)
    : `${base}${EXEMPLE_PUBLIC}`
  const code = (refCode ?? "").trim().toLowerCase()
  const inscription = /^[a-z0-9_-]{3,40}$/.test(code)
    ? `${base}/bars-et-restaurants?ref=${encodeURIComponent(code)}`
    : `${base}/bars-et-restaurants`
  return { exemple, inscription }
}
