// pdfVectoriel.ts — un PDF dont le QR est VECTORIEL (vague 3, revue du 23 nov.).
//
// Le PDF du QR Studio collait une IMAGE du QR (PNG 1024 px) dans une page A4 : à
// l'agrandissement d'un imprimeur, des escaliers. Ici, le SVG que produit le
// moteur de rendu (qr-codes/qrRender, le même que l'aperçu) est posé tel quel,
// en tracés, par svg2pdf.js (le compagnon de jsPDF, déjà au projet). Les textes
// restent du texte. Un logo importé reste ce qu'il est (une image) : on ne
// vectorise pas une photo.
//
// Deux mises en page :
//  · « a4 » : le QR centré sur une feuille A4, titre au-dessus, adresse dessous
//    (le PDF historique du QR Studio) ;
//  · « taille » : une page EXACTEMENT de la taille physique du QR, rien d'autre
//    — le fichier qu'un imprimeur pose sur son support.
//
// Navigateur uniquement. Les fonctions de mise en page sont pures et testées.

export type MiseEnPage = { format: "a4" } | { format: "taille"; mm: number }

/** La page et la place du QR, en millimètres (pur). */
export function placeDuQr(m: MiseEnPage): { page: [number, number]; x: number; y: number; cote: number } {
  if (m.format === "taille") {
    const mm = Math.min(Math.max(m.mm, 10), 1000)
    return { page: [mm, mm], x: 0, y: 0, cote: mm }
  }
  const [L, H] = [210, 297]
  const cote = Math.round(L * 0.6)
  return { page: [L, H], x: (L - cote) / 2, y: (H - cote) / 2, cote }
}

export async function pdfDuQrVectoriel(svgTexte: string, m: MiseEnPage, textes: { titre?: string; url?: string } = {}): Promise<Blob> {
  const [{ jsPDF }, { svg2pdf }] = await Promise.all([import("jspdf"), import("svg2pdf.js")])
  const p = placeDuQr(m)
  const pdf = new jsPDF({ unit: "mm", format: p.page, orientation: p.page[0] > p.page[1] ? "landscape" : "portrait" })
  const svg = new DOMParser().parseFromString(svgTexte, "image/svg+xml").documentElement
  if (svg.nodeName.toLowerCase() !== "svg") throw new Error("SVG illisible")
  // svg2pdf lit les styles calculés : le SVG doit être dans le document le temps du tracé.
  const hote = document.createElement("div")
  hote.style.cssText = "position:fixed;left:-10000px;top:0;width:0;height:0;overflow:hidden"
  hote.appendChild(svg)
  document.body.appendChild(hote)
  try {
    if (m.format === "a4") { pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, p.page[0], p.page[1], "F") }
    await svg2pdf(svg, pdf, { x: p.x, y: p.y, width: p.cote, height: p.cote })
  } finally { hote.remove() }
  if (m.format === "a4") {
    if (textes.titre) { pdf.setFontSize(18); pdf.setTextColor(26, 26, 26); pdf.text(textes.titre, p.page[0] / 2, p.y - 7, { align: "center" }) }
    if (textes.url) { pdf.setFontSize(11); pdf.setTextColor(150, 130, 60); pdf.text(textes.url, p.page[0] / 2, p.y + p.cote + 10, { align: "center" }) }
  }
  return pdf.output("blob")
}
