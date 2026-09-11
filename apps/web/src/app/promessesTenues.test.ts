import { describe, it, expect } from "vitest"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { PLANS, PLAN_ORDER } from "@/lib/plans"
import { preuveResolue, promessesSansPreuve, perksAffichables } from "./promessesTenues"
import { LANDING_BENEFITS } from "./homeSections/Pricing"
import { readFileSync } from "node:fs"

describe("aucune promesse tarifaire n'est en l'air", () => {
  for (const id of PLAN_ORDER) {
    it(`${id} : chaque ligne cochée porte une preuve qui se résout`, () => {
      const sans = promessesSansPreuve(id).map(p => p.text)
      expect(sans, `${id} — ${sans.join(" · ")}`).toEqual([])
    })
  }
  it("une preuve « produit: » désigne un fichier qui existe vraiment", () => {
    const racine = join(__dirname, "..")
    for (const id of PLAN_ORDER) {
      for (const p of PLANS[id].perks) {
        if (!p.preuve?.startsWith("produit:")) continue
        const chemin = p.preuve.slice("produit:".length)
        expect(existsSync(join(racine, chemin)), `${id} · ${p.text} → ${chemin}`).toBe(true)
      }
    }
  })
  it("une preuve qui ne mène nulle part est refusée", () => {
    const pro = PLANS.pro
    expect(preuveResolue(pro, undefined)).toBe(false)
    expect(preuveResolue(pro, "caps.inventee" as any)).toBe(false)
    expect(preuveResolue(pro, "limits.inventee" as any)).toBe(false)
    // et une capacité que CE plan n'a pas ne prouve rien
    expect(preuveResolue(PLANS.free, "caps.printStudio")).toBe(false)
    expect(preuveResolue(PLANS.pro, "caps.printStudio")).toBe(true)
  })
})

describe("« Support prioritaire » : la ligne relevée le 11 septembre", () => {
  it("elle a disparu des deux plans payants — rien ne l'implémentait", () => {
    for (const id of PLAN_ORDER) {
      expect(PLANS[id].perks.map(p => p.text), id).not.toContain("Support prioritaire")
    }
  })
})

describe("la génération IA n'est vendue que quand elle tourne", () => {
  it("sans clé serveur, la ligne disparaît de la grille au lieu d'être vendue", () => {
    const avec = perksAffichables("pro", { iaActive: true }).map(p => p.text)
    const sans = perksAffichables("pro", { iaActive: false }).map(p => p.text)
    expect(avec).toContain("Génération IA + rapports")
    expect(sans).not.toContain("Génération IA + rapports")
    expect(sans.length).toBe(avec.length - 1)
  })
  it("les autres lignes ne bougent pas", () => {
    const sans = perksAffichables("business", { iaActive: false }).map(p => p.text)
    expect(sans).toContain("5 membres d'équipe")
    expect(sans).toContain("Création en masse par import CSV")
    expect(sans.join(" · ")).not.toMatch(/Génération IA/)
  })
  it("la grille consulte vraiment le drapeau, comme l'éditeur", () => {
    const up = readFileSync(join(__dirname, "upgrade/page.tsx"), "utf8")
    expect(up).toContain("perks: perksAffichables(p.id, { iaActive: GENERATION_IA_ACTIVE })")
    expect(up).not.toContain("  perks: p.perks,")
    // l'éditeur le respectait déjà : c'est la grille qui l'ignorait
    expect(readFileSync(join(__dirname, "dashboard/builder/BuilderV4.tsx"), "utf8")).toContain("{GENERATION_IA_ACTIVE && <div")
  })
  it("le plan gratuit ne montre plus « Génération IA » barrée quand elle n'existe pas", () => {
    // La montrer barrée ferait croire qu'elle existe ailleurs. Sans clé : rien.
    const sans = perksAffichables("free", { iaActive: false }).map(p => p.text)
    expect(sans).not.toContain("Génération IA")
  })
})

describe("l'accueil et la grille détaillée affirment la même chose", () => {
  // Les promesses vivaient dans deux listes écrites à la main, et elles avaient
  // déjà divergé. La prose reste libre — l'accueil ne parle pas comme une fiche
  // technique — mais chaque ligne porte la même preuve, résolue sur son plan.
  for (const id of PLAN_ORDER) {
    it(`${id} : chaque bénéfice annoncé sur l'accueil se résout sur ce plan`, () => {
      const sans = (LANDING_BENEFITS[id] ?? [])
        .filter(b => b.ok && !preuveResolue(PLANS[id], b.preuve as any))
        .map(b => b.text)
      expect(sans, `${id} — ${sans.join(" · ")}`).toEqual([])
    })
  }
  it("aucune ligne cochée de l'accueil n'est sans preuve du tout", () => {
    for (const id of PLAN_ORDER)
      for (const b of LANDING_BENEFITS[id] ?? [])
        if (b.ok) expect(b.preuve, `${id} · ${b.text}`).toBeTruthy()
  })
})

