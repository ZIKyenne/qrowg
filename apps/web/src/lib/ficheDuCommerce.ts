// ficheDuCommerce.ts — ce que la page dit de l'établissement, pour Google (vague 2,
// revue du 23 nov.).
//
// Le JSON-LD d'une page de restaurant déclarait un `LocalBusiness` réduit à son
// nom, son adresse web… et l'AVATAR DU COMPTE comme image. Tout ce qu'un moteur
// local cherche — adresse, téléphone, horaires, carte — était pourtant sur la
// page, saisi par le commerçant dans ses blocs.
//
// Ce module le lit dans les blocs affichés, et seulement là :
//  · rien d'inventé ni de déduit : un fait absent est un champ absent (pas de
//    `priceRange`, pas de `servesCuisine`, pas de note) ;
//  · une valeur encore identique à un modèle (« 12 rue des Peupliers ») n'est
//    pas un fait du commerce : elle n'est pas publiée (valeursDExemple) ;
//  · l'image est celle de LA PAGE (profil, bannière), jamais l'avatar du compte,
//    et seulement une adresse web (une image embarquée n'a rien à faire ici) ;
//  · « Restaurant » seulement si la page a une carte ou un geste de resto.
// Module PUR.

import { BLOCS_DE_CARTE } from "@/app/dashboard/builder/shared-renderer/models/epuises"
import { menuSectionViewModel } from "@/app/dashboard/builder/shared-renderer/models/menuSection"
import { menuTabsViewModel } from "@/app/dashboard/builder/shared-renderer/models/menuTabs"
import { rubriquesDesAutresCartes } from "@/app/dashboard/builder/shared-renderer/models/autresCartes"
import { exemplesRestants } from "@/app/dashboard/builder/valeursDExemple"
import { parseHourRanges, dayField } from "@/app/dashboard/builder/types"

type Bloc = { type: string; content?: Record<string, any> | null }

const RESTO = new Set<string>([...BLOCS_DE_CARTE, "plat_du_jour", "happy_hour", "table_booking", "appel_serveur", "commande_retrait"])
/** La page est-elle celle d'un restaurant ? Ses blocs le disent. */
export function estUnRestaurant(blocs: readonly Bloc[]): boolean {
  return blocs.some(b => RESTO.has(b.type))
}

const txt = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "")
/** La valeur d'un champ de fait, si elle n'est pas un reste de modèle. */
function fait(c: Record<string, any>, cle: string): string {
  const v = txt(c[cle])
  if (!v) return ""
  return exemplesRestants({ [cle]: v }).length ? "" : v
}
function premier(blocs: readonly Bloc[], types: string[], cle: string): string {
  for (const t of types) for (const b of blocs) if (b.type === t) { const v = fait(b.content ?? {}, cle); if (v) return v }
  return ""
}

/** L'adresse saisie (plan, itinéraire, contact rapide, carte de visite…). */
export function adresseDuCommerce(blocs: readonly Bloc[]): string {
  return premier(blocs, ["google_maps", "google_maps_embed", "directions_button", "quick_contact", "vcard", "legal_info"], "address")
}
/** Le téléphone saisi, s'il ressemble à un numéro (au moins 6 chiffres). */
export function telephoneDuCommerce(blocs: readonly Bloc[]): string {
  const v = premier(blocs, ["call_button", "quick_contact", "vcard", "reservation_form", "whatsapp_button"], "phone")
  return (v.match(/\d/g) ?? []).length >= 6 ? v : ""
}

/** L'image de la page (http/https) : photo du profil, puis bannière. Jamais l'avatar du compte. */
export function imageDeLaPage(blocs: readonly Bloc[]): string {
  const web = (v: unknown) => { const s = txt(v); return /^https?:\/\/\S+$/i.test(s) && s.length <= 2000 ? s : "" }
  for (const [type, cle] of [["profile", "avatar"], ["cover_banner", "src"], ["hero_banner", "bg_image"]] as const)
    for (const b of blocs) if (b.type === type) { const v = web((b.content ?? {})[cle]); if (v) return v }
  return ""
}

const JOURS_SCHEMA = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const hhmm = (m: number) => `${String(Math.floor((m % 1440) / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
/**
 * Les horaires du bloc « Horaires », au format schema.org. Une plage qui passe
 * minuit (« 18h - 02h ») ferme à 02:00 : schema.org l'admet (fermeture avant
 * l'ouverture = le lendemain). Les jours identiques sont regroupés.
 */
export function horairesDuCommerce(blocs: readonly Bloc[]): Record<string, unknown>[] {
  const b = blocs.find(x => x.type === "opening_hours")
  if (!b) return []
  const c = b.content ?? {}
  const parPlage = new Map<string, string[]>()
  for (let j = 0; j < 7; j++) {
    for (const r of parseHourRanges(dayField(c, j))) {
      const k = `${hhmm(r.start)}-${hhmm(r.end)}`
      parPlage.set(k, [...(parPlage.get(k) ?? []), JOURS_SCHEMA[j]])
    }
  }
  return [...parPlage].map(([k, jours]) => {
    const [opens, closes] = k.split("-")
    return { "@type": "OpeningHoursSpecification", dayOfWeek: jours, opens, closes }
  })
}

const MONTANT = /^\s*(\d{1,4})(?:[.,](\d{1,2}))?\s*(?:€|eur|euros?)?\s*$/i
/** « 12,50 € » → « 12.50 » ; null si ce n'est pas un montant net (« Prix du marché »). */
export function prixSchema(v: unknown): string | null {
  const m = typeof v === "string" ? MONTANT.exec(v) : null
  return m ? `${Number(m[1])}.${(m[2] ?? "").padEnd(2, "0")}` : null
}

/** La carte, au format schema.org `Menu` : rubriques et produits, prix quand ils sont nets. Plafonnée. */
export function carteDuCommerce(blocs: readonly Bloc[], max = 150): Record<string, unknown> | null {
  const sections: Record<string, unknown>[] = []
  let n = 0
  const lire = (titre: string, items: { name: string; price?: string; desc?: string }[]) => {
    const produits: Record<string, unknown>[] = []
    for (const it of items) {
      if (n >= max) break
      const nom = txt(it.name)
      if (!nom || exemplesRestants({ item1_name: nom }).length) continue
      const prix = it.price && !exemplesRestants({ item1_price: it.price }).length ? prixSchema(it.price) : null
      produits.push({
        "@type": "MenuItem", name: nom,
        ...(txt(it.desc) ? { description: txt(it.desc) } : {}),
        ...(prix ? { offers: { "@type": "Offer", price: prix, priceCurrency: "EUR" } } : {}),
      })
      n++
    }
    if (produits.length) sections.push({ "@type": "MenuSection", ...(titre ? { name: titre } : {}), hasMenuItem: produits })
  }
  for (const b of blocs) {
    const c = b.content ?? {}
    if (b.type === "menu_section") { const m = menuSectionViewModel(c); lire(txt(m.category), m.items) }
    else if (b.type === "menu_tabs") { const m = menuTabsViewModel(c); for (const s of m.enLigne) lire(txt(s.title), s.items) }
    else if ((BLOCS_DE_CARTE as readonly string[]).includes(b.type)) for (const r of rubriquesDesAutresCartes(b.type, c)) lire(r.titre, r.plats)
  }
  return sections.length ? { "@type": "Menu", hasMenuSection: sections } : null
}

/** Les champs que les blocs de la page ajoutent à son entité (seulement les faits présents). */
export function ficheDuCommerce(blocs: readonly Bloc[]): Record<string, unknown> {
  const adresse = adresseDuCommerce(blocs)
  const tel = telephoneDuCommerce(blocs)
  const horaires = horairesDuCommerce(blocs)
  const carte = estUnRestaurant(blocs) ? carteDuCommerce(blocs) : null
  const image = imageDeLaPage(blocs)
  return {
    ...(adresse ? { address: adresse } : {}),
    ...(tel ? { telephone: tel } : {}),
    ...(horaires.length ? { openingHoursSpecification: horaires } : {}),
    ...(carte ? { hasMenu: carte } : {}),
    ...(image ? { image } : {}),
  }
}
