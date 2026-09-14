import { construireVCard } from "@/lib/vcard"
import { lienTelephone, lienSms, lienEmail } from "@/lib/lienDeContact"

// Helpers purs de la page "QR d'un lien" — isoles ici pour rester testables
// sans dependre du gros builder/types (garde le bundle de la page leger).

// Le contraste vit dans lib/contrasteQr : il était réécrit ici pour la cinquième
// fois, avec un traitement des couleurs invalides qui lui était propre.

// Ajoute https:// si aucun schema reconnu (site tape sans protocole).
export function normalizeUrl(v: string): string {
  const s = v.trim()
  if (!s) return ""
  if (/^(https?:\/\/|mailto:|tel:|sms:|geo:|WIFI:)/i.test(s)) return s
  return "https://" + s
}

// Echappe les caracteres speciaux du format WIFI (\ ; , : ").
export function escapeWifi(s: string): string {
  return s.replace(/([\\;,":])/g, "\\$1")
}

// Construit la charge utile d'un QR Wi-Fi standard (scan -> propose de rejoindre le reseau).
export function buildWifi(ssid: string, password: string, enc: "WPA" | "WEP" | "nopass"): string {
  const s = ssid.trim()
  if (!s) return ""
  const p = enc === "nopass" ? "" : password
  return `WIFI:T:${enc};S:${escapeWifi(s)};P:${escapeWifi(p)};;`
}

// Construit un QR d'appel telephonique (scan -> propose d'appeler).
// Ne garde que les chiffres et le prefixe international +.
export function buildTel(phone: string): string {
  return lienTelephone(phone)
}

// Construit un QR SMS (scan -> ouvre l'app SMS avec destinataire + message pre-remplis).
// Format SMSTO: (standard de fait des lecteurs QR, large compatibilite iOS/Android).
// Ne garde que les chiffres et le prefixe international + pour le numero.
export function buildSms(phone: string, message?: string): string {
  return lienSms(phone, message)
}

// Construit un QR email mailto: (scan -> ouvre un brouillon pre-rempli, RFC 6068).
export function buildEmail(to: string, subject?: string, body?: string): string {
  // Une adresse qui porte déjà « ?bcc=… » n'est pas une adresse : le QR
  // fabriquerait un brouillon en copie cachée (lot v114).
  return lienEmail(to, { sujet: subject, corps: body }) ?? ""
}

export type VCardFields = {
  firstName?: string; lastName?: string; phone?: string
  email?: string; org?: string; title?: string; url?: string
}

// La fiche contact vit dans lib/vcard : elle était écrite deux fois, et CETTE
// version-ci joignait ses lignes en LF simple là où la norme impose CRLF — or
// c'est elle qui fabrique les QR de contact réellement imprimés.
export function buildVCard(v: VCardFields): string {
  return construireVCard({
    prenom: v.firstName, nom: v.lastName, telephone: v.phone,
    email: v.email, organisation: v.org, fonction: v.title,
    siteWeb: v.url ? normalizeUrl(v.url) : undefined,
  })
}
