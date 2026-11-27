// La destination d'un QR MODIFIABLE autonome (`instant_qrs.dest_url`), selon son
// type — la même règle à la création (POST) et à la modification (PATCH), alignée
// sur ce que le scan suit (app/q/[code]/route.ts) :
//   lien → http(s) · appel → tel: · e-mail → mailto: · texte → le texte lui-même.
//
// Avant v408, la modification passait TOUT type par la règle du lien : un QR
// « appel » ou « e-mail » ne se modifiait pas (« Lien invalide (http/https
// requis) »), et le texte « Bonjour » d'un QR « texte » devenait
// « https://bonjour/ » — que le scan affichait ensuite à la place du texte.

import { lienTelephone, lienEmail, adresseEmailValide } from "./lienDeContact"

export const TYPES_MODIFIABLES = ["link", "text", "phone", "call", "email"] as const
const LONGUEUR_MAX = 4000

/** http(s) seulement ; sans schéma, https:// est ajouté. */
export function lienWebSur(brut: string): string | null {
  const v = (brut || "").trim()
  if (!v) return null
  const avecSchema = /^https?:\/\//i.test(v) ? v : `https://${v}`
  try {
    const u = new URL(avecSchema)
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null
  } catch { return null }
}

export type Destination = { ok: true; dest: string } | { ok: false; erreur: string }

export function destinationPourLeType(kind: string, brut: unknown): Destination {
  const v = typeof brut === "string" ? brut.trim() : ""
  if (!v) return { ok: false, erreur: "La destination est requise." }
  if (v.length > LONGUEUR_MAX) return { ok: false, erreur: "Destination trop longue." }
  switch (kind) {
    case "link": {
      const d = lienWebSur(v)
      return d ? { ok: true, dest: d } : { ok: false, erreur: "Lien invalide (http/https requis)." }
    }
    case "phone":
    case "call": {
      const tel = lienTelephone(v.replace(/^tel:/i, ""))
      return tel.length > 4 ? { ok: true, dest: tel } : { ok: false, erreur: "Numéro de téléphone invalide." }
    }
    case "email": {
      if (/^mailto:/i.test(v)) {
        let adresse = ""
        try { adresse = decodeURIComponent(v.slice(7).split("?")[0] || "") } catch { /* encodage cassé : invalide */ }
        return adresseEmailValide(adresse) ? { ok: true, dest: v } : { ok: false, erreur: "Adresse e-mail invalide." }
      }
      const m = lienEmail(v)
      return m ? { ok: true, dest: m } : { ok: false, erreur: "Adresse e-mail invalide." }
    }
    case "text":
      return { ok: true, dest: v }
    default:
      return { ok: false, erreur: "Ce QR n'est pas modifiable : son contenu est imprimé dans le code." }
  }
}
