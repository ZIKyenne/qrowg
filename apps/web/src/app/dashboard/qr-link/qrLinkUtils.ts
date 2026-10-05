import type { TypeQr } from "@/lib/stylesQr"
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

// ── Le retour après identification (Q08) ───────────────────────────────────
//
// Constat du 29 septembre : sans compte, « Télécharger PNG » était proposé, puis
// menait à la connexion. Rien ne prévenait avant le clic, la destination de
// retour n'apparaissait nulle part, et la composition — type de QR, contenu,
// couleurs, style — était perdue en route.
//
// Le contrat est écrit ici, hors de l'écran, pour qu'il se vérifie :
//  • on ne part vers la connexion qu'en ayant d'abord rangé la composition ;
//  • on lui donne où revenir, et cette adresse est INTERNE (l'application la
//    revalide de son côté : voir `destinationInterne`) ;
//  • au retour, la page se reconnaît à un paramètre et se recompose.

/** Le paramètre qui, au retour, dit à l'écran de reprendre ce qui était composé. */
export const REPRISE_PARAM = "reprise"

/** Où l'identification doit ramener. Chemin interne, sans hôte ni protocole. */
export const RETOUR_QR_LINK = `/dashboard/qr-link?${REPRISE_PARAM}=1`

/**
 * L'adresse de connexion qui sait revenir. `retour` est refusé s'il n'est pas un
 * chemin interne : une destination venue d'ailleurs renverrait le visiteur —
 * et son identification — hors du site.
 */
export function lienDeConnexionPourTelecharger(retour: string = RETOUR_QR_LINK): string {
  const r = (retour || "").trim()
  const sur = r.startsWith("/") && !r.startsWith("//") ? r : RETOUR_QR_LINK
  return `/auth/login?redirect=${encodeURIComponent(sur)}`
}

/** Revient-on d'une identification demandée par le téléchargement ? */
export function reprendApresConnexion(search: string | null | undefined): boolean {
  try {
    return new URLSearchParams((search || "").replace(/^\?/, "")).get(REPRISE_PARAM) === "1"
  } catch { return false }
}

// ── Comment se nomme un QR (Q08) ───────────────────────────────────────────
//
// Cette formule était écrite DEUX FOIS dans l'écran : une pour l'aperçu du QR en
// cours, une pour les vignettes de l'historique — et les deux ne se comportaient
// pas pareil sur une valeur vide. Une seule, ici, testable.

export type WifiEnc = "WPA" | "WEP" | "nopass"
export type EmailFields = { to?: string; subject?: string; body?: string }
export type SmsFields = { to?: string; body?: string }

export type QrSource = {
  type: TypeQr; url: string; ssid: string; wifiPass: string; wifiEnc: WifiEnc; text: string
  vc: VCardFields; phone: string; em: EmailFields; sms?: SmsFields
}

/** Le nom affiché d'une fiche contact, ou "" si elle n'en porte pas. */
export const nomDeLaFiche = (v: VCardFields = {}) =>
  [v.firstName, v.lastName].filter(Boolean).join(" ").trim()

/** Charge utile encodée dans le QR selon le type. */
export function payload(s: QrSource): string {
  if (s.type === "wifi") return buildWifi(s.ssid, s.wifiPass, s.wifiEnc)
  if (s.type === "text") return s.text.trim()
  if (s.type === "contact") return buildVCard(s.vc)
  if (s.type === "phone") return buildTel(s.phone)
  if (s.type === "email") return buildEmail(s.em.to ?? "", s.em.subject, s.em.body)
  if (s.type === "sms") return buildSms(s.sms?.to ?? "", s.sms?.body)
  return normalizeUrl(s.url)
}

/**
 * L'étiquette lisible d'un QR. Rend "" quand il n'y a rien à nommer — un QR sans
 * contenu ne doit pas s'afficher « 📶 » ou « 👤 » tout seul.
 */
export function etiquetteDuQr(s: Partial<QrSource>): string {
  const t = s.type ?? "link"
  const orne = (icone: string, valeur?: string) => {
    const v = (valeur || "").trim()
    return v ? `${icone} ${v}` : ""
  }
  if (t === "wifi") return orne("📶", s.ssid)
  if (t === "text") return (s.text || "").trim()
  if (t === "contact") return orne("👤", nomDeLaFiche(s.vc))
  if (t === "phone") return orne("📞", s.phone)
  if (t === "email") return orne("✉️", s.em?.to)
  if (t === "sms") return orne("💬", s.sms?.to)
  return normalizeUrl(s.url || "").replace(/^https?:\/\//, "")
}
