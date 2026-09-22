// Une adresse réservée l'est parce qu'une route l'occupe — garde de classe.
//
// Relevé du 22 septembre. Le produit sert dix-huit segments de premier niveau.
// Quand un visiteur demande `/guides`, c'est la route du produit qui répond ;
// `/[slug]`, la page d'un commerçant, ne voit que ce qui reste.
//
// La liste des adresses réservées en comptait dix-neuf, écrite à la main, et
// **il en manquait huit** :
//
//     creer  generateur-qr-code  generateur-qr-code-wifi  guides
//     outils  q  qr-code  security
//
// Le chemin exact du défaut, vérifié dans le code : `api/templates/use` est la
// route où un commerçant choisit son adresse. Elle comparait à cette liste. Un
// commerçant pouvait donc prendre `guides` — l'interface répondait « disponible »
// (`api/slug/check`, la même liste, la même lacune), la création l'acceptait, et
// **sa page n'était jamais servie**. Il imprimait un QR code vers
// `qrowg.com/guides` ; le client scannait et tombait sur la page « Guides » de
// QRowg. Rien ne l'en avertissait.
//
// `q` est le pire des huit : c'est la route de redirection des QR codes.
//
// La liste existait en **deux copies mot pour mot**. Quatrième fois de cette
// série qu'une règle recopiée finit par ne plus dire la vérité (v159 à v161).
//
// ── Ce que cette garde fait, et qui est le cœur du lot ─────────────────────
//
// Elle ne relit pas la liste : elle **recalcule depuis le dossier `app/`** ce
// que le produit sert vraiment, et échoue si la liste et l'arborescence
// divergent. Ajouter une page au produit sans l'ajouter à la liste fait donc
// échouer la suite — au lieu de créer, en silence, une adresse qu'un commerçant
// peut prendre sans jamais être servi.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { SEGMENTS_SERVIS, RESERVES_A_LA_MAIN, ADRESSES_RESERVEES, adresseReservee } from "./adressesReservees"

const APP = path.join(__dirname, "..", "app")

/** Ce que Next sert réellement au premier niveau, lu dans l'arborescence. */
function segmentsDuProduit(): string[] {
  const out: string[] = []
  for (const n of fs.readdirSync(APP).sort()) {
    const p = path.join(APP, n)
    if (!fs.statSync(p).isDirectory()) continue
    // Ni groupe de routes `(x)`, ni segment dynamique `[x]`, ni privé `_x`,
    // ni le banc d'essai : aucun ne prend une adresse de premier niveau.
    if (/^[_([]/.test(n) || n === "e2e-harness") continue
    let sert = false
    const marcher = (d: string) => {
      // Triée : l'ordre du système de fichiers n'est pas garanti, et une garde
      // qui en dépend ne dit pas la même chose sur deux machines. (Règle du
      // produit, tenue par `testsDeterministes` — qui a attrapé cet écart-ci.)
      for (const f of fs.readdirSync(d).sort()) {
        const q = path.join(d, f)
        if (fs.statSync(q).isDirectory()) marcher(q)
        else if (f === "page.tsx" || f === "route.ts") sert = true
      }
    }
    marcher(p)
    if (sert) out.push(n)
  }
  return out
}

describe("garde de classe : la liste est le reflet du dossier `app/`", () => {
  it("aucune route servie ne manque à la liste, aucune adresse listée n'est inventée", () => {
    const reels = segmentsDuProduit()
    // Le plancher : sans lui, un balayage qui ne voit plus rien passerait vert.
    expect(reels.length, "des segments servis par le produit").toBeGreaterThan(12)
    expect(SEGMENTS_SERVIS, "ajouter une page au produit, c'est l'ajouter ici").toEqual(reels)
  })

  it("les huit qui manquaient sont réservées maintenant", () => {
    for (const oubliee of ["creer", "generateur-qr-code", "generateur-qr-code-wifi",
                           "guides", "outils", "q", "qr-code", "security"]) {
      expect(adresseReservee(oubliee), `${oubliee} était libre, et sa page n'aurait jamais été servie`).toBe(true)
      expect(fs.existsSync(path.join(APP, oubliee)), `${oubliee} est bien une route du produit`).toBe(true)
    }
  })

  it("les neuf réservées à la main ne sont pas des routes — elles ont leur raison", () => {
    const reels = new Set(segmentsDuProduit())
    for (const m of RESERVES_A_LA_MAIN)
      expect(reels.has(m), `${m} n'est pas un segment de premier niveau`).toBe(false)
    // Ce sont des écrans internes ou des mots qu'on ne veut pas voir servir de
    // vitrine à quelqu'un d'autre. Deux exemples vérifiables.
    expect(fs.existsSync(path.join(APP, "dashboard", "settings")), "settings vit sous le tableau de bord").toBe(true)
    expect(fs.existsSync(path.join(APP, "auth", "login")), "login vit sous l'authentification").toBe(true)
  })

  it("une seule liste : les deux routes la prennent, aucune ne la réécrit", () => {
    for (const rel of ["app/api/slug/check/route.ts", "app/api/templates/use/route.ts"]) {
      const src = fs.readFileSync(path.join(__dirname, "..", rel), "utf8")
      expect(src, `${rel} prend la liste partagée`).toContain('from "@/lib/adressesReservees"')
      expect(src, `${rel} ne la réécrit pas`).not.toMatch(/const RESERVED\s*=\s*\[/)
      expect(src, `${rel} l'interroge`).toMatch(/adresseReservee\(/)
    }
  })

  it("le détecteur sait dire non — sinon il ne dirait jamais oui", () => {
    expect(adresseReservee("guides"), "une route du produit").toBe(true)
    expect(adresseReservee("  GUIDES  "), "quelle que soit la casse et les espaces").toBe(true)
    expect(adresseReservee("chez-marcel"), "une vraie adresse de commerce").toBe(false)
    expect(adresseReservee("guides-bordeaux"), "…et une adresse qui COMMENCE comme une route").toBe(false)
    expect(adresseReservee("le-comptoir"), "une autre").toBe(false)
    // Ce qui n'est pas du texte est refusé : mieux vaut refuser que d'accepter
    // ce qu'on n'a pas su lire.
    expect(adresseReservee(null), "rien").toBe(true)
    expect(adresseReservee(42 as never), "un nombre").toBe(true)
    // Et la liste n'est ni vide ni doublonnée.
    expect(ADRESSES_RESERVEES.length).toBe(new Set(ADRESSES_RESERVEES).size)
    expect(ADRESSES_RESERVEES.length).toBe(SEGMENTS_SERVIS.length + RESERVES_A_LA_MAIN.length)
  })
})
