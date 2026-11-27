import { lienEmail, lienTelephone, lienWhatsApp } from "@/lib/lienDeContact"
import { adresseEmailValide } from "@/lib/lienDeContact"
// Logique pure de la destination d'un QR dynamique (construction de l'URL
// stockee + validation). Extraite du handler pour etre testable. Doit rester
// coherente avec la resolution au scan (q/[code]/qrResolve.ts).

export type DestType = "page" | "url" | "file" | "email" | "phone" | "whatsapp"

// Construit l'URL finale stockee dans dest_override.url selon le type.
export function buildDestUrl(type: DestType, value: string): string {
  switch (type) {
    case "email":    return value.startsWith("mailto:") ? value : (lienEmail(value) ?? "")
    case "phone":    return value.startsWith("tel:") ? value : lienTelephone(value)
    case "whatsapp": return lienWhatsApp(value)
    default: return value
  }
}

// Valide une destination. Renvoie un message d'erreur, ou null si valide.
export function validateDest(type: DestType, value: string): string | null {
  if (!value.trim()) return "La valeur est requise"
  switch (type) {
    case "url":
    case "file": {
      // La MÊME règle qu'au scan (q/[code]/qrResolve.ts) : un schéma autre que
      // http(s):// y est refusé. Avant v399, `startsWith("http")` acceptait
      // « httpjavascript:… » (enregistré « ok », puis mort au scan) et refusait
      // un vrai domaine comme « httpbin.org ».
      const v = value.trim()
      const http = /^https?:\/\//i.test(v)
      if (!http && /^[a-z][a-z0-9+.-]*:/i.test(v)) return "URL invalide"
      try { new URL(http ? v : `https://${v}`) }
      catch { return "URL invalide" }
      return null
    }
    case "email":
      return adresseEmailValide(value.replace("mailto:", "")) ? null : "Email invalide"
    case "phone":
      return /^[\d\s\+\-\(\)]{6,20}$/.test(value.replace("tel:", "")) ? null : "Numéro invalide"
    case "whatsapp":
      return /^[\d\s\+\-]{7,20}$/.test(value) ? null : "Numéro WhatsApp invalide"
    case "page":
      return /^[0-9a-f-]{36}$/.test(value) ? null : "ID de page invalide"
    default:
      // Type non reconnu (entree non fiable) : rejeter au lieu de laisser passer.
      return "Type de destination invalide"
  }
}
