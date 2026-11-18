// =============================================================================
// qrRender.ts — Moteur de rendu QR base sur qr-code-styling
// Genere les QR cote client (plus de dependance a api.qrserver.com).
// Applique reellement : dotStyle, eyeColor, cornerColor, gradient, logo, marge.
// Export PNG / WEBP / SVG (natif lib) + PDF (via jsPDF).
// =============================================================================

import QRCodeStyling from "qr-code-styling"
import { margePourCharge, MODULES_SILENCE, type Ecc } from "./margeQr"
import type {
  DotType, CornerSquareType, CornerDotType, GradientType,
} from "qr-code-styling"

export type QRStyleConfig = {
  fg2?:          string
  cornerColor?:  string
  eyeColor?:     string
  transparent?:  boolean
  gradient?:     "none" | "linear" | "radial" | "diagonal"
  gradientBg?:   string
  dotStyle?:     "square" | "rounded" | "dot" | "softSquare" | "pixel" | "minimal" | "neon" | "luxury"
  cornerStyle?:  "square" | "rounded" | "circle" | "diamond" | "luxury" | "minimal"
  margin?:       number
  /** Zone silencieuse, en MODULES (norme : 4). Remplace `margin`, qui était en pixels. */
  silence?:      number
  density?:      "low" | "medium" | "high"
  logoUrl?:      string
  logoSize?:     number
  logoShape?:    "square" | "rounded" | "circle"
  logoBg?:       "transparent" | "white" | "black" | "custom"
  logoBgColor?:  string
  logoPadding?:  number
}

export type QROptions = {
  data:   string
  fg:     string
  bg:     string
  ecc:    "L" | "M" | "Q" | "H"
  style:  QRStyleConfig
  size?:  number
}

export function mapDotType(s?: string): DotType {
  switch (s) {
    case "dot":        return "dots"
    case "rounded":    return "rounded"
    case "softSquare": return "classy-rounded"
    case "pixel":      return "square"
    case "minimal":    return "dots"
    case "neon":       return "extra-rounded"
    case "luxury":     return "classy"
    default:           return "square"
  }
}

export function mapCornerSquareType(s?: string): CornerSquareType {
  switch (s) {
    case "rounded":  return "extra-rounded"
    case "circle":   return "dot"
    case "luxury":   return "extra-rounded"
    case "diamond":  return "square"
    case "minimal":  return "dot"
    default:         return "square"
  }
}

export function mapCornerDotType(s?: string): CornerDotType {
  switch (s) {
    case "circle":
    case "luxury":
    case "minimal":  return "dot"
    default:         return "square"
  }
}

// Exporte pour les tests : mapping pur QROptions -> options qr-code-styling
// (ne construit aucune instance, aucun canvas requis).
export function buildOptions(o: QROptions): any {
  const size   = o.size ?? 400
  // La marge ne se compte pas en pixels : la norme la demande en MODULES, et le
  // testeur public de QRowg la vérifie ainsi. En pixels, l'export par défaut
  // donnait 0,66 à 0,97 module — et se dégradait en agrandissant l'image
  // (relevé du 13 septembre, voir margeQr.ts).
  const silence = Math.max(MODULES_SILENCE, o.style.silence ?? MODULES_SILENCE)
  const margin = margePourCharge(size, o.data || "https://qrowg.com", (o.ecc as Ecc) ?? "M", silence)

  const hasGrad  = !!(o.style.gradient && o.style.gradient !== "none" && o.style.fg2)
  const gradType: GradientType = o.style.gradient === "radial" ? "radial" : "linear"
  const gradRotation =
    o.style.gradient === "diagonal" ? Math.PI / 4 :
    o.style.gradient === "linear"   ? Math.PI / 2 : 0

  const dotsGradient = hasGrad
    ? { type: gradType, rotation: gradRotation,
        colorStops: [ { offset: 0, color: o.fg }, { offset: 1, color: o.style.fg2! } ] }
    : undefined

  const bgHasGrad = !o.style.transparent && !!(o.style.gradient && o.style.gradient !== "none" && o.style.gradientBg)
  const bgGradient = bgHasGrad
    ? { type: gradType, rotation: gradRotation,
        colorStops: [ { offset: 0, color: o.bg }, { offset: 1, color: o.style.gradientBg! } ] }
    : undefined

  const opts: any = {
    width:  size,
    height: size,
    type:   "canvas",
    data:   o.data || "https://qrowg.com",
    margin,
    qrOptions: { errorCorrectionLevel: o.ecc },
    dotsOptions: {
      type: mapDotType(o.style.dotStyle),
      ...(dotsGradient ? { gradient: dotsGradient } : { color: o.fg }),
    },
    backgroundOptions: o.style.transparent
      ? { color: "rgba(0,0,0,0)" }
      : (bgGradient ? { gradient: bgGradient } : { color: o.bg }),
    cornersSquareOptions: {
      type:  mapCornerSquareType(o.style.cornerStyle),
      color: o.style.cornerColor || o.fg,
    },
    cornersDotOptions: {
      type:  mapCornerDotType(o.style.cornerStyle),
      color: o.style.eyeColor || o.style.cornerColor || o.fg,
    },
  }

  if (o.style.logoUrl) {
    const sizePct = Math.min((o.style.logoSize ?? 18) / 100, 0.30)
    opts.image = o.style.logoUrl
    opts.imageOptions = {
      hideBackgroundDots: true,
      imageSize: sizePct,
      margin: o.style.logoPadding ?? 4,
      crossOrigin: "anonymous",
      // Relevé en production le 18 nov. : avec un logo, l'aperçu restait VIDE et
      // le téléchargement ne partait jamais. qr-code-styling (1.9) a `saveAsBlob`
      // vrai par défaut : il relit le logo par XMLHttpRequest pour le convertir.
      // Notre CSP (`connect-src`) refuse cette requête vers une URL `data:` — et
      // la bibliothèque n'écoute pas l'échec : la promesse ne se résout jamais,
      // le dessin s'arrête avant le QR. Nos logos SONT déjà des data URL
      // (FileReader, composeLogo) : la conversion ne sert à rien.
      saveAsBlob: false,
    }
  }

  return opts
}

export function createQR(o: QROptions): QRCodeStyling {
  return new QRCodeStyling(buildOptions(o))
}

// Variante SVG (vectorielle) — pour un rendu net à l'impression (PDF prêt imprimeur).
export function createQRSvg(o: QROptions): QRCodeStyling {
  return new QRCodeStyling({ ...buildOptions(o), type: "svg" })
}

export function updateQR(qr: QRCodeStyling, o: QROptions): void {
  qr.update(buildOptions(o))
}

/**
 * Délai au-delà duquel un export est déclaré raté. La bibliothèque n'écoute pas
 * l'échec de chargement d'un logo (image cassée, hôte injoignable) : sans borne,
 * le bouton « Télécharger » attendait pour toujours, sans un mot.
 */
export const DELAI_EXPORT_MS = 15000

export async function getQRBlob(o: QROptions, ext: "png" | "webp" | "svg", delaiMs = DELAI_EXPORT_MS): Promise<Blob | null> {
  const type = ext === "svg" ? "svg" : "canvas"
  const inst = new QRCodeStyling({ ...buildOptions(o), type })
  let minuteur: ReturnType<typeof setTimeout> | undefined
  const expire = new Promise<null>(res => { minuteur = setTimeout(() => res(null), delaiMs) })
  try {
    const data = await Promise.race([inst.getRawData(ext as any), expire])
    return (data as Blob) ?? null
  } finally {
    clearTimeout(minuteur)
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

export async function buildAndDownloadPdf(
  pngBlob: Blob,
  filename: string,
  opts: { title?: string; url?: string }
): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const dataUrl = await blobToDataUrl(pngBlob)
  const pdf = new jsPDF({ unit: "pt", format: "a4" })
  const PW = pdf.internal.pageSize.getWidth()
  const PH = pdf.internal.pageSize.getHeight()
  const imgSize = PW * 0.6
  const x = (PW - imgSize) / 2
  const y = (PH - imgSize) / 2
  pdf.setFillColor(255, 255, 255)
  pdf.rect(0, 0, PW, PH, "F")
  pdf.addImage(dataUrl, "PNG", x, y, imgSize, imgSize)
  if (opts.title) {
    pdf.setFontSize(18); pdf.setTextColor(26, 26, 26)
    pdf.text(opts.title, PW / 2, y - 18, { align: "center" })
  }
  if (opts.url) {
    pdf.setFontSize(11); pdf.setTextColor(150, 130, 60)
    pdf.text(opts.url, PW / 2, y + imgSize + 28, { align: "center" })
  }
  pdf.save(filename)
}
