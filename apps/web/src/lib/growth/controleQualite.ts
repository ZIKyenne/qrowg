// Le contrôle qualité d'une proposition — un verrou, pas un rapport.
//
// ── Pourquoi un verrou ─────────────────────────────────────────────────────
//
// Le document de mission est explicite : « Un score QA bloque si mauvaise
// lisibilité, faux prix, lien cassé, CTA absent, XSS, contenu interdit ou
// échec du rendu. » Un contrôle qui se contente de signaler finit par être lu
// une fois, puis plus jamais. Celui-ci rend un verdict, et une proposition
// rejetée ne s'affiche pas.
//
// ── Pourquoi il revérifie ce que le générateur garantit déjà ──────────────
//
// Plusieurs règles ci-dessous font double emploi avec le générateur : lui aussi
// refuse un profil trop pauvre, lui aussi retire les blocs muets. C'est
// volontaire. Le générateur garantit par CONSTRUCTION ; le contrôle vérifie le
// RÉSULTAT. Le jour où quelqu'un ajoute un chemin de fabrication — un import
// CSV, une correction manuelle depuis le QG, une variante de modèle —, cette
// garantie-là sautera, et celle-ci tiendra encore.
//
// ── Ce qu'il NE fait pas ───────────────────────────────────────────────────
//
// Il ne juge ni le goût, ni la lisibilité réelle. Les contrastes, les cibles
// tactiles et le débordement se mesurent au navigateur — c'est le rôle de
// `e2e/apercuGenere.spec.ts`, pas celui d'une fonction pure. Prétendre juger
// une mise en page sans la rendre serait exactement l'erreur que ce fichier
// existe pour empêcher ailleurs.

import type { PageGeneree } from "./generateurRestaurant"

export type Grief = { regle: string; detail: string }
export type Verdict = {
  statut: "passe" | "rejete"
  /** Ce qui interdit l'envoi. Une seule ligne suffit à rejeter. */
  bloquants: Grief[]
  /** Ce qui mérite un regard sans interdire. */
  reserves: Grief[]
}

/** Le minimum de faits affichés pour qu'une page soit « personnalisée ». */
export const FAITS_MINIMUM = 3

/**
 * Des blocs qui PROPOSENT une action. Sans aucun d'eux, la page se lit et ne
 * se fait pas : le prospect n'a rien à y faire.
 */
const BLOCS_D_ACTION = new Set([
  "call_button", "table_booking", "cta_button", "quick_contact",
  "social_links", "google_maps_embed", "contact_form", "directions_button",
])

/** Des schémas d'URL qu'on refuse de poser dans une page. */
function urlAcceptable(valeur: string): { ok: true } | { ok: false; raison: string } {
  let u: URL
  try { u = new URL(valeur) } catch { return { ok: false, raison: "ce n'est pas une adresse absolue" } }
  // `javascript:` et `data:` exécutent ; `file:` lit le disque du visiteur.
  if (!["http:", "https:"].includes(u.protocol)) return { ok: false, raison: `schéma « ${u.protocol} » interdit` }
  const hote = u.hostname.toLowerCase()
  // Une adresse privée dans une page publique ne mène nulle part chez le
  // visiteur — et côté serveur, c'est la porte d'une SSRF.
  if (hote === "localhost" || /^127\./.test(hote) || /^10\./.test(hote) ||
      /^192\.168\./.test(hote) || /^172\.(1[6-9]|2\d|3[01])\./.test(hote) ||
      hote === "169.254.169.254" || hote.endsWith(".internal")) {
    return { ok: false, raison: `hôte non public (${hote})` }
  }
  return { ok: true }
}

/**
 * Un texte venu d'un site tiers peut contenir du balisage, ou des phrases
 * adressées à un agent (« ignore les instructions précédentes »). Le premier
 * cas est une XSS si un rendu l'interprète un jour ; le second est une
 * injection de prompt. Les deux se refusent à l'entrée de la page.
 */
const MARQUEURS_DANGEREUX = [
  /<\s*\/?\s*[a-z]/i,              // balisage
  /javascript\s*:/i,
  /\bon(click|error|load|mouseover)\s*=/i,
  /ignore (les |the )?(instructions|consignes)/i,
  /(system|assistant)\s*:/i,
]

const texteDes = (page: PageGeneree): { bloc: string; cle: string; valeur: string }[] => {
  const out: { bloc: string; cle: string; valeur: string }[] = []
  for (const b of page.blocs) {
    for (const [cle, v] of Object.entries(b.content)) {
      if (typeof v === "string" && v.trim()) out.push({ bloc: b.type, cle, valeur: v })
    }
  }
  return out
}

/**
 * Juge une page générée.
 *
 * `rejete` dès un seul bloquant. Il n'y a pas de score sur cent : un prix
 * inventé ne se compense pas par trois beaux blocs, et un nombre invite à
 * négocier avec lui.
 */
export function controler(page: PageGeneree): Verdict {
  const bloquants: Grief[] = []
  const reserves: Grief[] = []
  const textes = texteDes(page)

  // ── 1. La page dit-elle de qui elle parle ? ──────────────────────────────
  const profil = page.blocs.find(b => b.type === "profile")
  const nom = typeof profil?.content.name === "string" ? profil.content.name.trim() : ""
  if (!nom) bloquants.push({ regle: "nom", detail: "aucun nom d'établissement : la page ne dit pas de qui elle parle" })

  // ── 2. Y a-t-il assez de faits pour parler de personnalisation ? ─────────
  if (page.faitsUtilises.length < FAITS_MINIMUM) {
    bloquants.push({
      regle: "faits",
      detail: `${page.faitsUtilises.length} fait(s) vérifié(s) sur ${FAITS_MINIMUM} attendus — ce serait un modèle vierge portant une enseigne`,
    })
  }

  // ── 3. Rien d'exécutable, rien d'adressé à un agent ──────────────────────
  for (const t of textes) {
    const marqueur = MARQUEURS_DANGEREUX.find(r => r.test(t.valeur))
    if (marqueur) {
      bloquants.push({
        regle: "contenu dangereux",
        detail: `${t.bloc}.${t.cle} contient du balisage ou une instruction : « ${t.valeur.slice(0, 60)} »`,
      })
    }
  }

  // ── 4. Toute adresse est publique et inoffensive ─────────────────────────
  for (const t of textes) {
    // Un champ qui s'appelle « url » est validé QUOI QU'IL CONTIENNE.
    //
    // La première version exigeait « :// » avant de regarder, et laissait donc
    // passer `javascript:alert(1)`, qui n'a pas de barres obliques. Il était
    // bien rejeté, mais par la règle du contenu dangereux, au hasard d'un
    // autre motif. Une règle qui attrape par accident n'attrape pas.
    const champDAdresse = /url|href|lien|instagram|facebook|site/i.test(t.cle)
    if (!champDAdresse && !/^[a-z][a-z0-9+.-]*:/i.test(t.valeur)) continue
    const verdict = urlAcceptable(t.valeur)
    if (!verdict.ok) {
      bloquants.push({ regle: "adresse", detail: `${t.bloc}.${t.cle} : ${verdict.raison}` })
    }
  }

  // ── 5. Aucun bloc muet n'a survécu ───────────────────────────────────────
  // Défense en profondeur : le générateur les retire déjà. Si l'un réapparaît,
  // c'est qu'un autre chemin de fabrication existe, et il faut le savoir.
  for (const b of page.blocs) {
    const aDuTexte = Object.values(b.content).some(v => typeof v === "string" && v.trim())
    if (!aDuTexte && b.type !== "profile") {
      reserves.push({ regle: "bloc muet", detail: `${b.type} n'affiche rien` })
    }
  }

  // ── 6. La page propose-t-elle quelque chose à faire ? ────────────────────
  if (!page.blocs.some(b => BLOCS_D_ACTION.has(b.type))) {
    bloquants.push({ regle: "action", detail: "aucun moyen d'agir : ni appel, ni réservation, ni contact, ni itinéraire" })
  }

  // ── 7. Ce qui mérite un regard, sans interdire ───────────────────────────
  if (page.aCompleter.length >= 4) {
    reserves.push({ regle: "trop de manques", detail: `${page.aCompleter.length} éléments à compléter : la proposition risque de paraître vide` })
  }
  if (page.blocs.length < 3) {
    reserves.push({ regle: "page courte", detail: `${page.blocs.length} blocs seulement` })
  }

  return { statut: bloquants.length === 0 ? "passe" : "rejete", bloquants, reserves }
}

/** Résumé d'une ligne, pour un journal ou le QG. */
export function resumer(v: Verdict): string {
  if (v.statut === "passe") {
    return v.reserves.length === 0 ? "passé" : `passé, ${v.reserves.length} réserve(s)`
  }
  return `rejeté : ${v.bloquants.map(b => b.regle).join(", ")}`
}
