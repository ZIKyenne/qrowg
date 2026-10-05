import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PLANS, PLAN_LIST, PLAN_COMPARISON, MODELES_GRATUITS, MODELES_TOTAL, canPrintStudio } from "./plans"
import { PAGE_TEMPLATES } from "../app/dashboard/builder/page-templates"

const read = (p: string) => readFileSync(join(__dirname, p), "utf8")
const ligne = (nom: string) => PLAN_COMPARISON.find(l => l.feature === nom)

// ═══════════════════════════════════════════════════════════════════════════════
// Q07 — UNE CAPACITÉ, UN SENS.
//
// Relevé du 29 septembre : « La carte gratuite inclut l'atelier d'impression,
// tandis que les tableaux comparatifs le donnent indisponible. »
//
// Le tableau comparatif était écrit à la main, à côté des capacités qu'il décrit.
// Quatre autres écarts sont apparus en les comparant une à une : du JPG vendu
// qu'aucun plan n'exporte, vingt-sept modèles gratuits là où il y en a quarante,
// une « marque blanche » réservée à un plan dont la preuve vaut pour deux, et un
// « support prioritaire » qui n'existe nulle part dans le produit.
//
// La règle tenue ici : **le tableau se déduit des plans.** Il ne les commente pas.
// ═══════════════════════════════════════════════════════════════════════════════

describe("Q07 — l'atelier d'impression dit la même chose partout", () => {
  it("le plan gratuit l'a vraiment : la capacité, la carte et le produit sont d'accord", () => {
    expect(PLANS.free.caps.printStudio).toBe(true)
    expect(canPrintStudio("free")).toBe(true)
    expect(PLANS.free.perks.some(k => k.text.includes("Atelier d'impression") && k.included)).toBe(true)
  })

  it("le tableau ne le barre donc plus pour le plan gratuit", () => {
    expect(ligne("Atelier d'impression")?.free).not.toBe("—")
  })

  it("et il le barrerait si la capacité tombait — il la LIT", () => {
    const l = PLAN_COMPARISON.find(x => x.feature === "Atelier d'impression")!
    for (const p of PLAN_LIST) {
      const cellule = l[p.id as "free" | "pro" | "business"]
      expect(p.caps.printStudio, `${p.id} : « ${cellule} » ne correspond pas à la capacité`).toBe(cellule !== "—")
    }
  })
})

describe("Q07 — chaque ligne du tableau se déduit d'un champ", () => {
  it("les quantités sont celles des limites, sans recopie", () => {
    expect(ligne("Pages")?.free).toBe(String(PLANS.free.limits.pages))
    expect(ligne("Pages")?.business).toBe("Illimitées")
    expect(ligne("QR autonomes")?.pro).toBe(String(PLANS.pro.limits.qr))
    expect(ligne("…dont modifiables après impression")?.pro).toBe(String(PLANS.pro.limits.dyn))
    // `toLocaleString("fr-FR")` sépare les milliers par une espace fine insécable
    // (U+202F), pas par l'espace ordinaire que la table écrivait à la main.
    // C'est la bonne typographie française : on la normalise pour comparer.
    const sansFine = (v?: string) => (v ?? "").replace(/[  ]/g, " ")
    expect(sansFine(ligne("API")?.pro)).toBe("1 000 / mois")
    expect(sansFine(ligne("API")?.business)).toBe("10 000 / mois")
    expect(ligne("API")?.free).toBe("—")
  })

  it("les formats d'export sont ceux que l'atelier propose vraiment", () => {
    // Le tableau vendait « PNG + JPG + PDF HD + SVG ». Aucun plan n'a jamais eu
    // « jpg » dans `exportFormats` ; le PNG transparent et le WEBP y étaient, eux,
    // et n'étaient annoncés nulle part.
    const l = ligne("Formats d'export")!
    expect(l.free).toBe("PNG")
    expect(l.pro).not.toContain("JPG")
    expect(l.pro).toContain("PNG transparent")
    expect(l.pro).toContain("WEBP")
    expect(l.pro).toContain("SVG")
    expect(l.pro).toContain("PDF HD")
    for (const p of PLAN_LIST) {
      const cellule = l[p.id as "free" | "pro" | "business"]
      expect(cellule.split(" + ").length, `${p.id} : autant de noms que de formats`).toBe(p.caps.exportFormats.length)
    }
  })

  it("aucune cellule ne promet une capacité que le plan n'a pas", () => {
    const BOOLEENS: [string, (p: typeof PLANS.free) => boolean][] = [
      ["Mot de passe · expiration d'un lien", p => p.caps.dynSecuriteLien],
      ["Import CSV en masse", p => p.caps.dynEnMasse],
      ["IA", p => p.caps.ai],
      ["Domaine perso", p => p.caps.dynDomaineMarque],
      ["Marque blanche", p => p.caps.removeBranding],
    ]
    for (const [nom, lire] of BOOLEENS) {
      const l = ligne(nom)
      expect(l, `ligne « ${nom} » introuvable`).toBeTruthy()
      for (const p of PLAN_LIST) {
        const cellule = l![p.id as "free" | "pro" | "business"]
        expect(lire(p), `${nom} / ${p.id} : « ${cellule} »`).toBe(cellule === "✓")
      }
    }
  })

  it("« IA illimité » a disparu : rien ne compte les générations", () => {
    expect(ligne("IA")?.business).toBe("✓")
    expect(JSON.stringify(PLAN_COMPARISON)).not.toContain("illimité")
  })

  it("« Support prioritaire » n'est plus vendu — il n'existait pas", () => {
    // Le constat du 11 septembre avait nettoyé les perks ; le tableau, lui, le
    // vendait encore sur les deux plans payants.
    const l = ligne("Support")!
    expect([l.free, l.pro, l.business]).toEqual(["Par e-mail", "Par e-mail", "Par e-mail"])
    expect(JSON.stringify(PLAN_COMPARISON)).not.toContain("Prioritaire")
  })
})

describe("Q07 — le nombre de modèles gratuits est vérifié, pas annoncé", () => {
  /** Les 14 modèles « signature » vivent dans le JSX de la galerie : on les y recompte. */
  function plansDesModelesSignature(): string[] {
    const src = read("../app/dashboard/templates/page.tsx")
    const bloc = src.split("const TEMPLATES: any[] = [")[1].split("...SHARED_META")[0]
    return [...bloc.matchAll(/plan: "([a-z]+)"/g)].map(m => m[1])
  }

  it("le catalogue en compte bien 48", () => {
    const signature = plansDesModelesSignature()
    expect(signature.length).toBe(14)
    expect(PAGE_TEMPLATES.length).toBe(34)
    expect(signature.length + PAGE_TEMPLATES.length).toBe(MODELES_TOTAL)
  })

  it("quarante sont ouverts sans payer — le tableau en annonçait vingt-sept", () => {
    const signature = plansDesModelesSignature()
    const gratuitsSignature = signature.filter(p => p === "free").length
    // Les 34 modèles partagés sont tous gratuits (SHARED_META : `plan: "free"`).
    expect(read("../app/dashboard/templates/page.tsx")).toContain('id: t.key, name: t.label, category: t.group, plan: "free"')
    expect(gratuitsSignature + PAGE_TEMPLATES.length).toBe(MODELES_GRATUITS)
  })

  it("et le tableau écrit ce compte-là", () => {
    expect(ligne("Modèles")?.free).toBe(`${MODELES_GRATUITS} sur ${MODELES_TOTAL}`)
    expect(JSON.stringify(PLAN_COMPARISON)).not.toContain("27 gratuits")
  })
})

describe("Q07 — plus aucune ligne écrite à la main", () => {
  const src = read("./plans.ts")

  it("le tableau est calculé depuis les plans", () => {
    expect(src).toContain("LIGNES_COMPARATIF.map(l => ({")
    expect(src).toContain("free: l.lire(PLANS.free), pro: l.lire(PLANS.pro), business: l.lire(PLANS.business),")
  })

  it("aucune cellule n'est saisie en dur dans la table", () => {
    const bloc = src.slice(src.indexOf("const LIGNES_COMPARATIF"), src.indexOf("export const PLAN_COMPARISON"))
    expect(bloc, "une ligne recopie encore ses trois cellules").not.toMatch(/free:\s*"/)
    expect(bloc).not.toMatch(/business:\s*"/)
  })

  it("le tableau garde toutes ses lignes : on n'a rien supprimé pour simplifier", () => {
    expect(PLAN_COMPARISON.length).toBe(19)
  })
})
