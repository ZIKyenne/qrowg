// ardoiseDuJour.ts — écrire l'ardoise du jour depuis « Ma carte », sans l'éditeur.
//
// Vague 1 (revue du 23 nov.) : « l'ardoise du jour en moins de 30 secondes ».
// Jusqu'ici il fallait ouvrir l'éditeur, retrouver le bloc, taper, et la date
// de l'ardoise n'était remise à jour que par lui. Ici : on lit l'ardoise de la
// page, on la réécrit d'un geste, elle porte la date du jour du commerce et
// part en ligne aussitôt. Une ardoise d'hier se reprend d'un toucher.
//
// La règle d'affichage reste celle de platDuJour.ts (une ardoise datée ne se
// montre que CE jour-là) : ce module n'écrit que ce qu'elle lit. Module PUR.

import { platsDuJour, etatArdoise, jourDuCommerce, jourLisible, TYPE_ARDOISE, VALIDITE_PERMANENTE, type EtatArdoise } from "./platDuJour"
import { plafondDesLignes } from "./plafondDesLignes"
import { refusDuPrix, PHRASES_REFUS } from "./prixDeLaCarte"
import { limite } from "@/lib/limitesDeSaisie"

export const PLATS_MAX = plafondDesLignes(TYPE_ARDOISE)

export type PlatSaisi = { nom: string; prix: string; desc: string }

export type ArdoiseVue = {
  blocId: string
  titre: string
  etat: EtatArdoise
  plats: PlatSaisi[]
  /** « mardi 18 novembre » : le jour qu'elle porte, quand elle n'est pas d'aujourd'hui. */
  ecriteLe: string | null
  permanente: boolean
}

type BlocLu = { id: string; type: string; content: Record<string, any> | null; visible?: boolean | null; position?: number | null }

/** L'ardoise de la page : le premier bloc « Plat du jour » en ligne. null s'il n'y en a pas. */
export function ardoiseDeLaPage(blocs: readonly BlocLu[], now: Date): ArdoiseVue | null {
  const b = [...blocs].filter(x => x.type === TYPE_ARDOISE && x.visible !== false)
    .sort((a, z) => (a.position ?? 0) - (z.position ?? 0))[0]
  if (!b) return null
  const c = b.content ?? {}
  const etat = etatArdoise(c, now)
  return {
    blocId: b.id,
    titre: String(c.title || "").trim() || "L'ardoise du jour",
    etat,
    plats: platsDuJour(c).map(p => ({ nom: p.nom, prix: p.prix, desc: p.description })),
    ecriteLe: etat === "perimee" && c.date ? jourLisible(String(c.date)) : null,
    permanente: String(c.validite || "") === VALIDITE_PERMANENTE,
  }
}

/** La phrase qui dit, au comptoir, ce que voient les clients en ce moment. */
export function phraseArdoise(a: ArdoiseVue | null): string {
  if (!a || a.etat === "vide") return "Pas d'ardoise en ligne aujourd'hui."
  const n = a.plats.length === 1 ? "1 plat" : `${a.plats.length} plats`
  if (a.etat === "permanente") return `En ligne jusqu'à nouvel ordre · ${n}`
  if (a.etat === "a_jour") return `En ligne aujourd'hui · ${n}`
  return `Invisible en ligne : c'est l'ardoise du ${a.ecriteLe ?? "jour passé"}.`
}

export type Ecriture = { ok: true; content: Record<string, any>; plats: PlatSaisi[] } | { ok: false; phrase: string }

/**
 * Le contenu du bloc avec ces plats, datés d'aujourd'hui (jour du commerce).
 * Les lignes entièrement vides sont ignorées ; les autres sont vérifiées ici,
 * l'écran n'étant pas une garde. Titre, validité, note et fuseau sont gardés.
 */
export function ardoiseEcrite(content: Record<string, any> | null | undefined, saisis: readonly PlatSaisi[], now: Date): Ecriture {
  if (!Array.isArray(saisis)) return { ok: false, phrase: "Écrivez au moins un plat." }
  const propres: PlatSaisi[] = []
  for (const s of saisis) {
    if (!s || typeof s.nom !== "string" || typeof s.prix !== "string" || typeof s.desc !== "string") return { ok: false, phrase: "Ce plat n'a pas pu être lu." }
    const p = { nom: s.nom.trim().replace(/\s+/g, " "), prix: s.prix.trim().replace(/\s+/g, " "), desc: s.desc.trim().replace(/\s+/g, " ") }
    if (!p.nom && !p.prix && !p.desc) continue
    if (!p.nom) return { ok: false, phrase: "Chaque plat a besoin d'un nom." }
    if (p.nom.length > limite("nomDeProduit")) return { ok: false, phrase: `Un nom de plat tient en ${limite("nomDeProduit")} caractères au plus.` }
    if (p.desc.length > limite("descriptionDeProduit")) return { ok: false, phrase: `Une description tient en ${limite("descriptionDeProduit")} caractères au plus.` }
    const refus = refusDuPrix(p.prix)
    if (refus) return { ok: false, phrase: PHRASES_REFUS[refus] }
    propres.push(p)
  }
  if (!propres.length) return { ok: false, phrase: "Écrivez au moins un plat." }
  if (propres.length > PLATS_MAX) return { ok: false, phrase: `L'ardoise affiche ${PLATS_MAX} plats au plus.` }

  const c: Record<string, any> = { ...(content ?? {}) }
  for (let i = 1; i <= PLATS_MAX; i++) { delete c[`d${i}_name`]; delete c[`d${i}_price`]; delete c[`d${i}_desc`] }
  propres.forEach((p, k) => {
    c[`d${k + 1}_name`] = p.nom
    if (p.prix) c[`d${k + 1}_price`] = p.prix
    if (p.desc) c[`d${k + 1}_desc`] = p.desc
  })
  c.date = jourDuCommerce(now, c)
  return { ok: true, content: c, plats: propres }
}

/** Le contenu d'une ardoise neuve, quand la page n'en a pas encore. */
export function ardoiseNeuve(saisis: readonly PlatSaisi[], now: Date, fuseau?: string | null): Ecriture {
  const base: Record<string, any> = { title: "L'ardoise du jour", validite: "Aujourd'hui seulement" }
  if (fuseau) base.fuseau = fuseau
  return ardoiseEcrite(base, saisis, now)
}

/**
 * Où poser une ardoise neuve : juste AVANT la première carte de la page — c'est
 * le plat d'aujourd'hui, on le lit avant la carte de toujours. Sans carte :
 * après l'en-tête (profil), sinon en tête. Les blocs qui suivent descendent.
 */
const CARTES = new Set(["menu_section", "menu_tabs", "carte_illustree", "carte_boissons"])
export function placeDeLArdoise(blocs: readonly { id: string; type: string; position: number }[]): { position: number; decaler: { id: string; position: number }[] } {
  const tries = [...blocs].sort((a, b) => a.position - b.position)
  const carte = tries.find(b => CARTES.has(b.type))
  const profil = tries.find(b => b.type === "profile")
  const position = carte ? carte.position : profil ? profil.position + 1 : (tries[0]?.position ?? 0)
  return { position, decaler: tries.filter(b => b.position >= position).map(b => ({ id: b.id, position: b.position + 1 })) }
}
