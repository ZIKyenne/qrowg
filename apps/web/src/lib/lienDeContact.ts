// lienDeContact — un lien pour joindre quelqu'un se fabrique, il ne se concatène pas.
//
// Relevé du 14 septembre. Quarante-trois endroits fabriquent un lien de contact.
// Le téléphone et WhatsApp passent presque partout par les aides du produit —
// `telLink` normalise, `waLink` retire le « + » et les espaces que `wa.me`
// refuse. **L'adresse e-mail, elle, est toujours concaténée à la main :**
//
//   models/contactEtAction.ts:65    `mailto:${mail}`
//   models/equipeEtContacts.ts:24   `mailto:${mail}`
//   models/emailButton.ts:8         `mailto:${email}${c.subject ? …}`
//   renduLegacy.tsx:728, 1804       `mailto:${c.email}`
//   builderPreview, TemplatePreviewModal, LeadsClient, qrLinkUtils, contact/page
//
// Onze fois, sans jamais vérifier l'adresse — alors que le produit sait
// exactement pourquoi il faudrait. `lib/destinataireLead.ts` porte depuis le
// 6 septembre une expression qui refuse les virgules, les chevrons et les
// retours à la ligne, avec sa raison écrite : « un en-tête d'e-mail se coupe à
// la ligne, et une adresse qui en contient permettrait d'ajouter des
// destinataires ou des en-têtes ». Elle ne servait qu'au destinataire d'un
// formulaire — jamais aux boutons « Écrire » des pages publiques.
//
// Ce que ça donne pour le commerçant :
//
//   email = "contact@resto.fr?bcc=quelquun@ailleurs.fr"
//     Le bouton « Écrire » de sa page ouvre un brouillon avec une copie
//     cachée. Chaque client qui lui écrit écrit aussi à un tiers, et ni lui ni
//     le client ne le voient. L'adresse vient de son propre champ — d'un
//     modèle partagé, d'une génération, d'un copier-coller.
//
//   email = "contact@resto.fr?subject=Bonjour"
//     Le sujet que le bloc avait posé est écrasé sans bruit.
//
//   email = "contact@resto.fr, direction@resto.fr"
//     Deux adresses dans un champ qui en attend une : le brouillon s'ouvre
//     avec un destinataire que le logiciel de messagerie refuse. Le bouton a
//     l'air vivant, il ne mène nulle part. C'est le cas le plus fréquent, et
//     le plus bête.
//
// La classe : **un lien de contact se fabrique, il ne se concatène pas.**
//
// Les quatre façons de joindre quelqu'un vivent donc ici, et une seule règle
// décide de ce qu'est une adresse. `telLink`, `waLink` et les constructeurs de
// charge QR gardent leur nom et délèguent : aucun appelant ne bouge.

/**
 * Une seule adresse, format simple, bornée.
 *
 * Surtout : aucun retour à la ligne ni virgule — un en-tête d'e-mail se coupe à
 * la ligne, et une adresse qui en contient permettrait d'ajouter des
 * destinataires ou des en-têtes. Le `?` et le `&` sont exclus par construction
 * (ils ne sont pas dans les caractères admis), ce qui ferme la porte aux
 * paramètres glissés dans le champ.
 */
const ADRESSE = /^[^\s@,;<>"'\\]{1,64}@[^\s@,;<>"'\\]{1,190}\.[a-z]{2,24}$/i

export function adresseEmailValide(v: unknown): string | null {
  if (typeof v !== "string") return null
  const s = v.trim()
  if (!s || s.length > 254) return null
  if (/[\r\n\t]/.test(s)) return null
  if (/[?&#]/.test(s)) return null   // « a@b.fr?bcc=… » : des paramètres, pas une adresse
  return ADRESSE.test(s) ? s : null
}

/** Ce qui reste d'un numéro : les chiffres, et le « + » international s'il était là. */
export function chiffresDuNumero(brut?: string | null, indicatif?: string): string {
  const raw = (brut || "").trim()
  const plus = raw.startsWith("+")
  const digits = raw.replace(/\D/g, "")
  if (!digits) return ""
  if (plus) return digits
  const cc = (indicatif || "").replace(/\D/g, "")
  if (!cc) return digits
  if (digits.startsWith(cc)) return digits
  return cc + digits.replace(/^0+/, "")   // on retire le 0 national avant l'indicatif
}

/** `tel:` — chiffres seuls, le « + » conservé quand il a été saisi. `""` si rien d'appelable. */
export function lienTelephone(brut?: string | null): string {
  const raw = (brut || "").trim()
  const digits = raw.replace(/\D/g, "")
  if (!digits) return ""
  return `tel:${raw.startsWith("+") ? "+" : ""}${digits}`
}

/** `https://wa.me/…` — `wa.me` n'accepte ni « + » ni espace : les laisser casse le bouton. */
export function lienWhatsApp(brut?: string | null, message?: string, indicatif?: string): string {
  const d = chiffresDuNumero(brut, indicatif)
  if (!d) return ""
  return `https://wa.me/${d}${message ? `?text=${encodeURIComponent(message)}` : ""}`
}

/**
 * `mailto:` — et `null` quand l'adresse n'en est pas une.
 *
 * `null` plutôt qu'un lien mort : l'appelant peut alors ne pas dessiner le
 * bouton, plutôt que d'en dessiner un qui ne mène nulle part. Le sujet et le
 * corps sont encodés ici, une fois, et ne peuvent donc pas venir de l'adresse.
 */
export function lienEmail(adresse: unknown, options?: { sujet?: string; corps?: string }): string | null {
  const a = adresseEmailValide(adresse)
  if (!a) return null
  const params: string[] = []
  const sujet = (options?.sujet || "").trim()
  const corps = (options?.corps || "").trim()
  if (sujet) params.push(`subject=${encodeURIComponent(sujet)}`)
  if (corps) params.push(`body=${encodeURIComponent(corps)}`)
  return `mailto:${a}${params.length ? "?" + params.join("&") : ""}`
}

/** `SMSTO:` — la forme que lisent les appareils photo des téléphones. `""` si rien d'envoyable. */
export function lienSms(brut?: string | null, message?: string): string {
  const p = (brut || "").replace(/[^\d+]/g, "")
  if (!p) return ""
  const m = (message ?? "").trim()
  return m ? `SMSTO:${p}:${m}` : `SMSTO:${p}`
}

/**
 * Un lien de PARTAGE : pas de destinataire, seulement un brouillon pré-rempli
 * que la personne adressera elle-même. C'est la seule forme de `mailto:` qui
 * n'a pas d'adresse à vérifier, et elle a donc son propre nom — sans quoi
 * chaque appelant la refabrique à la main, et la règle se contourne d'elle-même.
 */
export function lienPartageEmail(sujet?: string, corps?: string): string {
  const params: string[] = []
  const s = (sujet || "").trim()
  const c = (corps || "").trim()
  if (s) params.push(`subject=${encodeURIComponent(s)}`)
  if (c) params.push(`body=${encodeURIComponent(c)}`)
  return `mailto:${params.length ? "?" + params.join("&") : ""}`
}

/** Le même partage, côté WhatsApp : pas de numéro, seulement un message à adresser. */
export function lienPartageWhatsApp(texte?: string): string {
  const t = (texte || "").trim()
  return `https://wa.me/${t ? `?text=${encodeURIComponent(t)}` : ""}`
}
