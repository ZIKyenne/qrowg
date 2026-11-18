// styleQr.ts — le vocabulaire du style d'un QR, partagé par les écrans.
// Sorti de QRStudio.tsx (le 18 nov.) pour que le Studio compact, les moteurs et
// le banc d'essai n'aient plus à importer l'ancien studio, appelé à disparaître.
import type { QRStyleConfig } from "./qrRender"
export type { QRStyleConfig } from "./qrRender"

export type QRCode = {
  id:               string
  page_id:          string
  short_code:       string
  /** Le nom du support (« Table 4 », « Vitrine ») — nommé depuis les statistiques. */
  label?:           string | null
  foreground_color: string
  background_color: string
  corner_style:     "square" | "rounded" | "dot"
  error_correction: "L" | "M" | "Q" | "H"
  style_config:     Record<string, any>
  logo_url:         string | null
  dest_override:    Record<string, any> | null
  dest_history:     Array<Record<string, any>>
  status:           "active"|"draft"|"paused"|"archived"|"expired"
  pause_message:    string | null
  expires_at:       string | null
  total_scans:      number
  last_scan_at:     string | null
  created_at:       string
  pages: {
    id:          string
    title:       string
    slug:        string
    status:      string
    total_views: number
    updated_at:  string
  } | null
}

export const DOT_STYLES: { id: QRStyleConfig["dotStyle"]; label: string; emoji: string }[] = [
  { id:"square",     label:"Classique",    emoji:"⬛" },
  { id:"rounded",    label:"Arrondi",      emoji:"🔵" },
  { id:"dot",        label:"Dots",         emoji:"⚫" },
  { id:"softSquare", label:"Carrés doux",  emoji:"🟦" },
  { id:"pixel",      label:"Pixel",        emoji:"🟧" },
  { id:"minimal",    label:"Minimal",      emoji:"▫️" },
  { id:"neon",       label:"Neon",         emoji:"💜" },
  { id:"luxury",     label:"Luxury",       emoji:"💎" },
]

export const CORNER_STYLE_LIST: { id: QRStyleConfig["cornerStyle"]; label: string }[] = [
  { id:"square",   label:"Carré"   },
  { id:"rounded",  label:"Arrondi" },
  { id:"circle",   label:"Cercle"  },
  { id:"diamond",  label:"Diamond" },
  { id:"luxury",   label:"Luxury"  },
  { id:"minimal",  label:"Minimal" },
]
export const GRADIENT_OPTS: { id: QRStyleConfig["gradient"]; label: string }[] = [
  { id:"none",     label:"Aucun"    },
  { id:"linear",   label:"Lineaire" },
  { id:"radial",   label:"Radial"   },
  { id:"diagonal", label:"Diagonal" },
]

export const DEFAULT_STYLE: QRStyleConfig = {
  fg2: "", cornerColor: "", eyeColor: "", transparent: false,
  gradient: "none", gradientBg: "", dotStyle: "square",
  cornerStyle: "square", silence: 4, density: "medium",
  logoUrl: "", logoSize: 18, logoShape: "rounded",
  logoBg: "white", logoBgColor: "#FFFFFF", logoPadding: 4,
}
