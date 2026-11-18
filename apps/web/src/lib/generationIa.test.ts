import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { etatGenerationIa } from "./generationIa"
import { canAI, getPlan, minPlanFor, PLANS } from "./plans"

describe("le panneau IA dit la formule AVANT qu'on écrive", () => {
  it("rien tant que la session ou la formule ne sont pas connues", () => {
    expect(etatGenerationIa("unknown", null)).toBeNull()
    expect(etatGenerationIa("user", null)).toBeNull()
  })

  it("ouvert pour une formule qui l'inclut, fermé sinon — la règle de plans.ts", () => {
    for (const id of Object.keys(PLANS)) {
      const e = etatGenerationIa("user", id)
      expect(e?.etat, id).toBe(canAI(id) ? "ouverte" : "fermee")
    }
  })

  it("la phrase nomme la formule qui l'ouvre, lue dans plans.ts", () => {
    const e = etatGenerationIa("user", "free")
    expect(e).toEqual({ etat: "fermee", phrase: `Incluse dès la formule ${getPlan(minPlanFor("ai")).label}.` })
  })

  it("un visiteur sans compte voit la même phrase, pas un champ qui finirait en refus", () => {
    expect(etatGenerationIa("guest", null)?.etat).toBe("fermee")
  })

  it("l'éditeur s'en sert, et n'affiche le champ que si c'est ouvert", () => {
    const src = readFileSync(join(__dirname, "../app/dashboard/builder/PanneauGenerationIa.tsx"), "utf8")
    expect(src).toContain("const iaPanneau = etatGenerationIa(session, plan)")
    // Fermé : la phrase et le lien vers les offres, AUCUN champ à remplir.
    const ferme = src.slice(src.indexOf('iaPanneau.etat === "fermee" ? ('), src.indexOf(") : <>"))
    expect(ferme).toContain("{iaPanneau.phrase}")
    expect(ferme).toContain('href="/upgrade?reason=ia"')
    expect(ferme).not.toContain("<textarea")
    // Et la formule réellement lue, pas « null » faute de défaut.
    expect(readFileSync(join(__dirname, "../app/dashboard/builder/BuilderV4.tsx"), "utf8")).toContain('setUserPlan((p as any)?.plan ?? "free")')
  })
})
