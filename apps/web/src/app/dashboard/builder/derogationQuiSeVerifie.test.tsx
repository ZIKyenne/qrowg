// Une dérogation qui ne se vérifie pas finit par mentir — garde de classe.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// `blockContracts.ts` énumère les défauts ASSUMÉS du produit : divergences
// éditeur/page, champs orphelins, contrats des familles critiques. Son en-tête
// dit sa raison d'être : « filet de sécurité […] toute NOUVELLE divergence non
// déclarée ici doit faire échouer un test ».
//
// Un tel registre a une faiblesse propre : **il est écrit à la main, et rien ne
// le relit.** `KNOWN_ORPHAN_FIELDS` annonçait :
//
//     reservation_form.phone — « show_phone existe mais le champ téléphone
//                               n'est pas rendu publiquement »
//
// C'était vrai le jour où la ligne a été écrite. Depuis,
// `reservationFormFields` demande `name, phone, date, people` — sans condition
// — et `lib/leadForms` explique même pourquoi : « c'est par le téléphone qu'un
// restaurant rappelle ». Le défaut avait été réparé ; le registre le déclarait
// toujours ouvert.
//
// C'est pire qu'une liste vide : un lecteur y voit un défaut qui n'existe plus,
// et en déduit que le reste de la liste est à jour.
//
// ── Ce que cette garde fait ────────────────────────────────────────────────
//
// Chaque entrée du registre est ÉPROUVÉE. Une dérogation dont le défaut a
// disparu fait échouer la suite : elle doit alors être retirée, pas conservée
// « au cas où ». C'est la même correction que les lots v163 et v170 — une
// population écrite à la main finit par ne plus dire la vérité — appliquée
// cette fois à une liste d'exceptions.

import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement, type ComponentType } from "react"
import fs from "node:fs"
import path from "node:path"
import {
  KNOWN_PUBLIC_NULL_BLOCKS, KNOWN_DIVERGENCES, KNOWN_ORPHAN_FIELDS, CRITICAL_CONTRACTS,
} from "./blockContracts"
import { BLOCK_DEFS, BLOCS_MASQUES } from "./blockDefs"
import { CHAMPS_FORMULAIRE } from "@/lib/leadForms"
import { hasPublishableContent, EMPTY_STATE_BLOCK_TYPES } from "./blockEmptyState"
import { plafondDesLignes } from "./shared-renderer/models/plafondDesLignes"
import { RenduLegacy } from "../../[slug]/renduLegacy"

const theme: any = { bg: "#080808", primary: "#C9A84C", muted: "#8A8478", text: "#F5F0E8", surface: "#111009", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F" }
const ctx: any = { theme, G: "#C9A84C", TEXT: "#F5F0E8", MUTED: "#A8A190", FONT_D: "f", FONT_B: "b", pageId: "p1", blockId: "b1", trackClick: () => {} }
const RACINE = path.join(__dirname, "shared-renderer")
const REG = fs.readFileSync(path.join(RACINE, "publicRegistry.tsx"), "utf8")
function adaptersPublics(): Record<string, [string, string]> {
  const parNom: Record<string, [string, string]> = {}
  for (const m of REG.matchAll(/const (Public\w+) = dynamic\(\(\) => import\("\.\/blocks\/([^"]+)"\)\.then\(m => m\.(\w+)\)\)/g))
    parNom[m[1]] = [m[2], m[3]]
  const out: Record<string, [string, string]> = {}
  for (const m of REG.matchAll(/^\s{2}([a-z0-9_]+): (Public\w+),/gm)) if (parNom[m[2]]) out[m[1]] = parNom[m[2]]
  return out
}
async function publie(type: string, contenu: Record<string, unknown>): Promise<string> {
  const a = adaptersPublics()[type]
  if (a) {
    const mod = (await import(/* @vite-ignore */ `./shared-renderer/blocks/${a[0]}`)) as Record<string, ComponentType<never>>
    const C = mod[a[1]]
    if (C) { try { return renderToStaticMarkup(createElement(C as never, { content: contenu, ctx } as never)).trim() } catch { return "" } }
  }
  try {
    return renderToStaticMarkup(createElement(RenduLegacy as never,
      { block: { id: "b1", type, content: contenu, visible: true }, theme, pageId: "p1" } as never)).trim()
  } catch { return "" }
}

describe("garde de classe : chaque dérogation déclarée existe encore", () => {
  it("un bloc déclaré « public = null » l'est vraiment, quoi qu'on y écrive", async () => {
    for (const type of KNOWN_PUBLIC_NULL_BLOCKS) {
      const champs = ((BLOCK_DEFS as Record<string, { fields?: { key: string }[] }>)[type]?.fields ?? [])
      const plein = Object.fromEntries(champs.map(f => [f.key, "Réel"]))
      expect(await publie(type, {}), `${type} à vide`).toBe("")
      expect(await publie(type, plein), `${type} rempli : sa page ne publie toujours rien`).toBe("")
    }
    expect(KNOWN_PUBLIC_NULL_BLOCKS.length, "la liste n'est pas vide, sinon elle n'aurait pas lieu d'être").toBeGreaterThan(0)
  })

  it("…et le commerçant ne peut plus en ajouter", () => {
    // Complément du lot v175 : un bloc qui ne publiera jamais rien n'a pas sa
    // place dans la bibliothèque. Les pages qui en portent déjà un marchent.
    for (const type of KNOWN_PUBLIC_NULL_BLOCKS)
      expect(BLOCS_MASQUES.has(type), `${type} est retiré du choix`).toBe(true)
  })

  it("un champ déclaré ORPHELIN l'est encore — sinon la ligne doit partir", () => {
    // La ligne `reservation_form.phone` a été retirée à ce lot : le formulaire
    // demande le numéro depuis longtemps. La garde empêche la prochaine ligne
    // périmée.
    for (const o of KNOWN_ORPHAN_FIELDS) {
      const champs = ((BLOCK_DEFS as Record<string, { fields?: { key: string }[] }>)[o.type]?.fields ?? []).map(f => f.key)
      expect(champs, `${o.type}.${o.field} : le champ est bien déclaré au panneau`).toContain(o.field)
      if (o.issue === "editable-non-rendu") {
        const rendus = (CHAMPS_FORMULAIRE as Record<string, (c: any) => { key: string }[]>)[o.type]
        if (rendus) expect(rendus({ [`show_${o.field}`]: "yes" }).map(f => f.key),
          `${o.type}.${o.field} : déclaré orphelin, et pourtant demandé`).not.toContain(o.field)
      }
      expect(o.note.length, `${o.type}.${o.field} : sa raison est écrite`).toBeGreaterThan(24)
    }
  })

  it("le formulaire de réservation demande bien le numéro — le défaut d'hier", () => {
    // Ce que la ligne retirée affirmait, éprouvé dans l'autre sens.
    const champs = (CHAMPS_FORMULAIRE as Record<string, (c: any) => { key: string }[]>).reservation_form({})
    expect(champs.map(f => f.key), "sans aucun réglage").toContain("phone")
    expect(champs.map(f => f.key), "…et l'ordre compte : c'est par là qu'on rappelle")
      .toEqual(["name", "phone", "date", "people"])
    expect(KNOWN_ORPHAN_FIELDS.some(o => o.type === "reservation_form" && o.field === "phone"),
      "la dérogation périmée est partie").toBe(false)
  })

  it("chaque divergence déclarée porte son type, sa raison et son statut", () => {
    for (const d of KNOWN_DIVERGENCES) {
      expect(BLOCK_DEFS[d.type], `${d.type} est un vrai bloc`).toBeTruthy()
      expect(d.detail.length, `${d.type} : la raison est écrite`).toBeGreaterThan(30)
      expect(["DIVERGENCE ACCEPTÉE", "DIVERGENCE À CORRIGER"]).toContain(d.status)
    }
    // Et la liste reste ÉTROITE : le produit a passé les lots v166 à v174 à
    // supprimer ses divergences, pas à en déclarer.
    expect(KNOWN_DIVERGENCES.length, "une liste d'exceptions qui grossit est une doctrine qui recule").toBeLessThanOrEqual(3)
  })
})

describe("les contrats des familles critiques disent le vrai", () => {
  it("`hidesWhenEmpty` est ce que le produit fait vraiment", async () => {
    // Ce champ était, lui aussi, écrit à la main. Depuis le lot v173, le produit
    // sait répondre pour les cent quarante-six blocs : on lui demande.
    const ecarts: string[] = []
    for (const c of CRITICAL_CONTRACTS) {
      const declare = c.hidesWhenEmpty
      const reel = (EMPTY_STATE_BLOCK_TYPES as readonly string[]).includes(c.type) && !hasPublishableContent(c.type, {})
      const publieAVide = (await publie(c.type, {})) !== ""
      if (declare !== reel) ecarts.push(`${c.type} : hidesWhenEmpty déclaré ${declare}, détecteur ${reel}`)
      if (declare === publieAVide) ecarts.push(`${c.type} : hidesWhenEmpty déclaré ${declare}, la page ${publieAVide ? "publie" : "ne publie rien"} à vide`)
    }
    expect(CRITICAL_CONTRACTS.length, "des contrats déclarés").toBeGreaterThan(5)
    expect(ecarts, "un contrat qui ne dit pas le vrai est pire qu'aucun contrat").toEqual([])
  }, 60_000)

  it("`maxItems` ne dépasse pas ce que le panneau propose", () => {
    // Le piège inverse du lot v151 : un contrat qui annoncerait plus de lignes
    // que le commerçant ne peut en saisir ferait croire à une capacité absente.
    for (const c of CRITICAL_CONTRACTS) {
      if (c.maxItems === undefined) continue
      const cles = new Set(((BLOCK_DEFS as Record<string, { fields?: { key: string }[] }>)[c.type]?.fields ?? []).map(f => f.key))
      const premier = c.criticalFields[0]
      const modele = premier.replace(/\d+/, "%")
      let declares = 0
      for (let i = 1; i <= 60; i++) if (cles.has(modele.replace("%", String(i)))) declares = i
      // Un bloc confié au répéteur n'énumère que ses premières lignes dans
      // `BLOCK_DEFS` : le panneau en ajoute jusqu'au plafond. La capacité
      // saisissable est donc le plus grand des deux.
      const saisissables = Math.max(declares, plafondDesLignes(c.type))
      if (declares > 0) expect(c.maxItems, `${c.type} : ${c.maxItems} annoncés, ${saisissables} saisissables`).toBeLessThanOrEqual(saisissables)
    }
  })

  it("chaque champ critique déclaré existe au panneau", () => {
    for (const c of CRITICAL_CONTRACTS) {
      const cles = ((BLOCK_DEFS as Record<string, { fields?: { key: string }[] }>)[c.type]?.fields ?? []).map(f => f.key)
      for (const champ of c.criticalFields)
        expect(cles, `${c.type}.${champ} : un champ critique qui n'existe pas ne protège rien`).toContain(champ)
    }
  })
})
