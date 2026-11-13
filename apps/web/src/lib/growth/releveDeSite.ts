// Relever un profil sur le site PUBLIC d'un établissement.
//
// Module PUR : il reçoit du HTML déjà obtenu et l'URL d'où il vient. Aucun
// appel réseau n'est fait ici — le fetch, avec sa garde anti-SSRF
// (`lib/safeUrl.isPublicHttpUrl`), vit ailleurs et reste à brancher.
//
// ── La règle de ce fichier ────────────────────────────────────────────────
//
// **On lit ce qui est DÉCLARÉ, jamais ce qui est interprété.**
//
// Un site de restaurant contient deux sortes d'informations. Celles qu'il
// publie dans un format fait pour être lu par une machine — le JSON-LD de
// schema.org, un lien `tel:`, un lien vers Instagram — et celles qui ne vivent
// que dans sa mise en page : « ouvert du mardi au samedi, sauf jours fériés »,
// une carte en image, un prix dans une colonne.
//
// Les premières se relèvent sans risque de se tromper. Les secondes demandent
// d'interpréter, et c'est exactement là que naissent les pages qui affirment
// des choses fausses au nom de quelqu'un d'autre. Ce module ne lit que les
// premières. Ce qu'il ne trouve pas reste `null`, et le bandeau de l'aperçu
// l'annoncera comme « à compléter » — ce qui est toujours mieux qu'une
// affirmation inventée.
//
// ── Ce qu'il ne fait pas, et pourquoi ────────────────────────────────────
//
// · **Pas d'horaires en texte libre.** Le lot v213 a produit « Lundi — Fermé »
//   sur une page de restaurant, à partir d'une absence d'information. Une
//   fermeture affirmée à tort fait perdre un service. Les horaires ne viennent
//   donc que de `openingHoursSpecification`, et les jours non déclarés restent
//   inconnus — jamais « fermé ».
//
// · **Pas de plats devinés dans la page.** Aucun moyen non ambigu de distinguer
//   un plat d'un titre de section ou d'un slogan. Seul un menu STRUCTURÉ en
//   JSON-LD (`hasMenu` → `hasMenuSection` → `hasMenuItem`) est relevé.
//
// · **Pas d'accroche rédigée par nous.** La phrase de présentation est reprise
//   telle quelle de la `description` déclarée, ou absente.

import {
  sourcer, profilVide,
  type ProfilRestaurant, type Provenance, type Horaire, type JourSemaine, type PlatReleve,
} from "./profilEtablissement"

/* ────────────────────────────── lecture du JSON-LD ────────────────────── */

/** Les blocs `application/ld+json` d'une page, analysés ; les illisibles sont ignorés. */
export function blocsJsonLd(html: string): unknown[] {
  const out: unknown[] = []
  const re = /<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  for (const m of html.matchAll(re)) {
    try {
      // Un bloc cassé n'est pas une panne : beaucoup de sites en ont un.
      out.push(JSON.parse(m[1].trim()))
    } catch { /* illisible : on passe */ }
  }
  return out
}

/** Aplatit tableaux et `@graph` : un même document peut contenir plusieurs entités. */
function entites(valeur: unknown, vus = new Set<unknown>()): Record<string, unknown>[] {
  if (!valeur || typeof valeur !== "object" || vus.has(valeur)) return []
  vus.add(valeur)
  if (Array.isArray(valeur)) return valeur.flatMap(v => entites(v, vus))
  const o = valeur as Record<string, unknown>
  const sortie = [o]
  if (o["@graph"]) sortie.push(...entites(o["@graph"], vus))
  return sortie
}

/** Les types schema.org qui désignent un établissement qui reçoit du public. */
const TYPES_ETABLISSEMENT = new Set([
  "restaurant", "foodestablishment", "cafeorcoffeeshop", "barorpub",
  "bakery", "icecreamshop", "fastfoodrestaurant", "localbusiness",
])

function estUnEtablissement(o: Record<string, unknown>): boolean {
  const t = o["@type"]
  const liste = Array.isArray(t) ? t : [t]
  return liste.some(x => typeof x === "string" && TYPES_ETABLISSEMENT.has(x.toLowerCase()))
}

/**
 * L'entité qui décrit l'établissement, s'il y en a une.
 *
 * Le type le plus spécifique gagne : une page déclare souvent à la fois un
 * `LocalBusiness` générique et un `Restaurant`. Prendre le premier venu
 * donnerait le moins informatif des deux.
 */
export function etablissementDeclare(html: string): Record<string, unknown> | null {
  const toutes = blocsJsonLd(html).flatMap(b => entites(b)).filter(estUnEtablissement)
  if (toutes.length === 0) return null
  const specifique = toutes.find(o => {
    const t = o["@type"]
    const liste = Array.isArray(t) ? t : [t]
    return liste.some(x => typeof x === "string" && x.toLowerCase() !== "localbusiness")
  })
  return specifique ?? toutes[0]
}

/* ──────────────────────────────── petits outils ───────────────────────── */

const texte = (v: unknown): string | null => {
  if (typeof v !== "string") return null
  const s = v.replace(/\s+/g, " ").trim()
  return s.length ? s : null
}

/** Les jours de schema.org, quelle que soit leur écriture (nom seul ou URL). */
const JOURS: Record<string, JourSemaine> = {
  monday: "mon", tuesday: "tue", wednesday: "wed", thursday: "thu",
  friday: "fri", saturday: "sat", sunday: "sun",
}

function jourDeSchema(v: unknown): JourSemaine | null {
  const s = texte(v)?.toLowerCase().replace(/^https?:\/\/schema\.org\//, "")
  return s ? (JOURS[s] ?? null) : null
}

/** « 12:00 » → « 12h » ; « 14:30 » → « 14h30 ». Format déjà employé par le produit. */
function heureFr(v: unknown): string | null {
  const m = texte(v)?.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const h = Number(m[1]), min = m[2]
  if (h > 23) return null
  return min === "00" ? `${h}h` : `${h}h${min}`
}

/* ─────────────────────────────── les relevés ──────────────────────────── */

/**
 * Les horaires DÉCLARÉS, jour par jour.
 *
 * Les jours absents de la déclaration restent absents du relevé. Schema.org
 * laisse entendre qu'un jour non déclaré est fermé ; on ne le suit pas, parce
 * qu'une fermeture affirmée à tort coûte un service au commerçant, et qu'une
 * déclaration incomplète est plus fréquente qu'une fermeture.
 */
export function horairesDeclares(o: Record<string, unknown>): Horaire[] {
  const specs = Array.isArray(o.openingHoursSpecification)
    ? o.openingHoursSpecification
    : o.openingHoursSpecification ? [o.openingHoursSpecification] : []

  const parJour = new Map<JourSemaine, string[]>()
  for (const brut of specs) {
    if (!brut || typeof brut !== "object") continue
    const s = brut as Record<string, unknown>
    const ouvre = heureFr(s.opens), ferme = heureFr(s.closes)
    if (!ouvre || !ferme) continue
    const jours = Array.isArray(s.dayOfWeek) ? s.dayOfWeek : [s.dayOfWeek]
    for (const j of jours) {
      const jour = jourDeSchema(j)
      if (!jour) continue
      const creneaux = parJour.get(jour) ?? []
      const creneau = `${ouvre}–${ferme}`
      // Un même créneau déclaré deux fois ne s'affiche pas deux fois.
      if (!creneaux.includes(creneau)) creneaux.push(creneau)
      parJour.set(jour, creneaux)
    }
  }

  const ordre: JourSemaine[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
  return ordre.filter(j => parJour.has(j)).map(j => ({ jour: j, heures: parJour.get(j)!.join(" / ") }))
}

/** Les plats d'un menu STRUCTURÉ. Un menu en image ou en texte libre ne donne rien. */
export function platsDeclares(o: Record<string, unknown>, max = 12): PlatReleve[] {
  const out: PlatReleve[] = []
  const parcourir = (v: unknown, prof = 0) => {
    if (!v || typeof v !== "object" || prof > 4 || out.length >= max) return
    if (Array.isArray(v)) { for (const x of v) parcourir(x, prof); return }
    const n = v as Record<string, unknown>
    const type = (Array.isArray(n["@type"]) ? n["@type"][0] : n["@type"]) as string | undefined
    if (typeof type === "string" && type.toLowerCase() === "menuitem") {
      const nom = texte(n.name)
      if (nom && out.length < max) {
        // Le prix n'est repris que s'il est déclaré ; un prix inventé est pire
        // qu'un prix absent (garde `fideliteDesFaits`).
        const offre = (n.offers && typeof n.offers === "object" ? n.offers : {}) as Record<string, unknown>
        const brut = offre.price ?? n.price
        const prix = typeof brut === "number" ? `${brut} €` : texte(brut)
        out.push({ nom, prix: prix ?? null, description: texte(n.description) })
      }
    }
    for (const cle of ["hasMenu", "hasMenuSection", "hasMenuItem", "menu"]) {
      if (n[cle]) parcourir(n[cle], prof + 1)
    }
  }
  parcourir(o)
  return out
}

/** Les plateformes de réservation reconnues. Un lien vers l'une d'elles ne s'interprète pas. */
const PLATEFORMES = ["thefork.", "lafourchette.", "zenchef.", "opentable.", "resy.", "guestonline.", "sevenrooms."]

/** Les liens `href` d'une page, dédoublonnés, dans leur ordre d'apparition. */
export function liens(html: string): string[] {
  const out: string[] = []
  for (const m of html.matchAll(/<a\b[^>]*?href\s*=\s*["']([^"']+)["']/gi)) {
    const h = m[1].trim()
    if (h && !out.includes(h)) out.push(h)
  }
  return out
}

/** Le premier lien dont l'hôte contient l'un des fragments donnés. */
function premierLienVers(hrefs: string[], fragments: string[], base: string): string | null {
  for (const h of hrefs) {
    let abs: URL
    try { abs = new URL(h, base) } catch { continue }
    if (abs.protocol !== "http:" && abs.protocol !== "https:") continue
    const hote = abs.hostname.toLowerCase()
    if (fragments.some(f => hote.includes(f.replace(/\.$/, "")))) return abs.toString()
  }
  return null
}

/** Le numéro d'un lien `tel:` — la seule forme non ambiguë d'un téléphone. */
export function telephoneDeclare(html: string): string | null {
  const m = html.match(/href\s*=\s*["']tel:([^"']+)["']/i)
  if (!m) return null
  // `\s` couvre déjà l'espace insécable : l'écrire en clair dans la classe
  // ajoutait un caractère invisible à la lecture, sans rien couvrir de plus.
  // C'est la garde `typographieFr` qui l'a vu.
  const brut = decodeURIComponent(m[1]).replace(/[\s.-]+/g, " ").trim()
  return /\d{6,}/.test(brut.replace(/\D/g, "")) ? brut : null
}

/** Le `<title>`, débarrassé des suffixes de navigation courants. */
export function titreDeLaPage(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const brut = texte(m?.[1])
  if (!brut) return null
  // « Chez Mariette - Accueil | Restaurant à Reims » → « Chez Mariette »
  const coupe = brut.split(/\s+[|–—·]\s+|\s+-\s+/)[0]
  return texte(coupe) ?? brut
}

/* ──────────────────────────── le relevé complet ───────────────────────── */

/**
 * Construit un profil à partir du HTML d'une page et de son URL.
 *
 * Chaque champ porte sa provenance :
 *   · `confirme`   — déclaré pour être lu par une machine (JSON-LD, lien
 *                    `tel:`, lien vers une plateforme connue) ;
 *   · `probable`   — déduit d'un `<title>`, qui mélange souvent le nom de
 *                    l'établissement et des mots de navigation ;
 *   · rien         — tout le reste. L'absence est un résultat valide.
 */
export function releverLeSite(
  html: string,
  urlDeLaPage: string,
  observeLe: string,
): ProfilRestaurant {
  const profil = profilVide(urlDeLaPage)
  if (typeof html !== "string" || html.length === 0) return profil

  const source = `site de l'établissement (${urlDeLaPage})`
  const p = (certitude: Provenance["certitude"]): Provenance => ({ source, observeLe, certitude })

  const decl = etablissementDeclare(html)
  const hrefs = liens(html)

  // ── Le nom ───────────────────────────────────────────────────────────
  const nomDeclare = decl ? texte(decl.name) : null
  if (nomDeclare) profil.nom = sourcer(nomDeclare, p("confirme"))
  else {
    const titre = titreDeLaPage(html)
    if (titre) profil.nom = sourcer(titre, p("probable"))
  }

  // ── L'accroche : reprise telle quelle, jamais rédigée ────────────────
  const description = decl ? texte(decl.description) : null
  if (description && description.length <= 180) profil.accroche = sourcer(description, p("confirme"))

  // ── L'adresse et la ville ────────────────────────────────────────────
  const adr = (decl?.address && typeof decl.address === "object" ? decl.address : null) as Record<string, unknown> | null
  if (adr) {
    const rue = texte(adr.streetAddress)
    const cp = texte(adr.postalCode)
    const ville = texte(adr.addressLocality)
    const complete = [rue, [cp, ville].filter(Boolean).join(" ")].filter(Boolean).join(", ")
    if (complete) profil.adresse = sourcer(complete, p("confirme"))
    if (ville) profil.ville = sourcer(ville, p("confirme"))
  }

  // ── Le téléphone : d'abord déclaré, sinon un lien `tel:` ─────────────
  const telDeclare = decl ? texte(decl.telephone) : null
  const telLien = telephoneDeclare(html)
  const tel = telDeclare ?? telLien
  if (tel) profil.telephone = sourcer(tel, p("confirme"))

  // ── Les horaires : uniquement déclarés ───────────────────────────────
  if (decl) {
    const h = horairesDeclares(decl)
    if (h.length) profil.horaires = sourcer(h, p("confirme"))
  }

  // ── Les plats : uniquement un menu structuré ─────────────────────────
  if (decl) {
    const plats = platsDeclares(decl)
    if (plats.length) profil.plats = sourcer(plats, p("confirme"))
  }

  // ── Les liens ────────────────────────────────────────────────────────
  const reservation = texte(decl?.acceptsReservations) ?? premierLienVers(hrefs, PLATEFORMES, urlDeLaPage)
  if (reservation && /^https?:/i.test(reservation)) profil.reservation = sourcer(reservation, p("confirme"))

  const insta = premierLienVers(hrefs, ["instagram.com"], urlDeLaPage)
  if (insta) profil.instagram = sourcer(insta, p("confirme"))

  const fb = premierLienVers(hrefs, ["facebook.com"], urlDeLaPage)
  if (fb) profil.facebook = sourcer(fb, p("confirme"))

  const google = premierLienVers(hrefs, ["google.com/maps", "g.page", "maps.app.goo.gl"], urlDeLaPage)
  if (google) profil.ficheGoogle = sourcer(google, p("confirme"))

  return profil
}
