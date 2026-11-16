// formatImpression.ts — les dimensions physiques de la sortie d'impression.
//
// Audit du 14 novembre 2026 (C6) : « vérifier la sortie Chevalet, annoncée à
// 106 × 76 mm avec fond perdu et traits de coupe pour un format nominal de
// 100 × 70 mm ». Vérifié : le calcul était juste, l'ANNONCE ne l'était pas. La
// page PDF produite fait 114 × 84 mm (planche 106 × 76 + 4 mm de marge blanche
// pour loger les traits de coupe) ; l'écran n'en disait que 106 × 76. Extrait
// tel quel du client (même calcul), exporté pour être testé et pour que la
// phrase dise les TROIS formats. Module PUR.
import type { Item } from "./catalog"

/* Largeur physique du support (trim), en mm — sert d'échelle mm→px pour le QR. */
export function trimWidthMm(item: Item) { return item.shape === "round" ? item.hMm : item.hMm * item.ratio }
/* Dimensions physiques de la PLANCHE (trim + fond perdu), en mm. */
export function pageDims(item: Item) {
  const trimW = trimWidthMm(item)
  return { pageWmm: +(trimW + 2 * item.bleed).toFixed(1), pageHmm: +(item.hMm + 2 * item.bleed).toFixed(1) }
}
/* Marge blanche prépresse pour loger les traits de coupe (coupe droite uniquement ;
   les supports ronds sont découpés à la forme -> pas de repères rectangulaires). */
export const CROP_MARGIN_MM = 4, CROP_LEN_MM = 3, CROP_STROKE_MM = 0.25
export function marksMargin(item: Item) { return item.shape === "round" ? 0 : CROP_MARGIN_MM }
/* Dimensions du SUPPORT physique imprimé (planche + marge des traits de coupe) = format @page réel. */
export function mediaDims(item: Item) {
  const { pageWmm, pageHmm } = pageDims(item)
  const m = marksMargin(item)
  return { mediaWmm: +(pageWmm + 2 * m).toFixed(1), mediaHmm: +(pageHmm + 2 * m).toFixed(1) }
}

/** Ce que l'écran annonce avant « Enregistrer en PDF » : les trois formats, dans l'ordre où l'imprimeur les lit. */
export function phraseFormatPdf(item: Item): string {
  const t = `${fmt(trimWidthMm(item))} × ${fmt(item.hMm)} mm`
  const { pageWmm, pageHmm } = pageDims(item)
  if (item.shape === "round") return `PDF de ${fmt(pageWmm)} × ${fmt(pageHmm)} mm : support ${t} découpé à la forme, fond perdu de ${fmt(item.bleed)} mm inclus`
  const { mediaWmm, mediaHmm } = mediaDims(item)
  return `PDF de ${fmt(mediaWmm)} × ${fmt(mediaHmm)} mm : support fini ${t}, fond perdu de ${fmt(item.bleed)} mm (${fmt(pageWmm)} × ${fmt(pageHmm)} mm) et traits de coupe dans la marge blanche`
}
const fmt = (n: number) => String(+n.toFixed(1)).replace(".", ",")

/**
 * La feuille d'impression d'une planche de `wmm` × `hmm`.
 *
 * Mesuré le 16 novembre sur le PDF produit par Chromium : la planche du chevalet
 * sortait sur SEPT pages. Le reste de l'écran était `visibility: hidden` — caché,
 * mais gardant sa hauteur — et la planche `position: fixed` se répétait page
 * après page. La planche est désormais rendue sous <body> (portail) et tout le
 * reste est RETIRÉ de la mise en page : une page, à la taille annoncée.
 */
export function cssDImpression(wmm: number, hmm: number): string {
  return `@media screen{.ps-print-root{display:none!important}}`
    + `@media print{html,body{margin:0!important;padding:0!important;width:${wmm}mm!important;height:${hmm}mm!important;min-height:0!important;overflow:hidden!important;background:#fff!important}`
    + `body>*:not(.ps-print-root){display:none!important}`
    + `.ps-print-root{display:block!important;position:static!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}`
    + `.ps-print-root *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}`
    + `@page{size:${wmm}mm ${hmm}mm;margin:0}}`
}
