import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { USAGE_DU_CAS } from "./UseCases"
import { creerUrl } from "../creer/entry"

// Audit du 14 novembre 2026 (D1) : « Composer ma page restaurant » ouvrait la galerie entière.
describe("chaque cas d'usage de l'accueil ouvre son secteur", () => {
  it("restaurant → secteur Restaurant", () => {
    const u = new URL(creerUrl(USAGE_DU_CAS.restaurant), "https://x")
    expect(u.searchParams.get("metier")).toBe("Restaurant")
  })
  it("aucun cas d'usage ne retombe sur la galerie entière", () => {
    const src = readFileSync(join(__dirname, "UseCases.tsx"), "utf8")
    const ids = [...src.matchAll(/^\s+id: "([a-z]+)",/gm)].map(m => m[1])
    expect(ids.length).toBeGreaterThan(3)
    for (const id of ids) expect(creerUrl(USAGE_DU_CAS[id]), id).not.toBe("/creer")
    expect(src).not.toContain('<ButtonLink href="/creer"')
  })
})

// Audit D4 : l'accueil associait page + QR imprimable + « sans créer de compte ».
// La composition se fait sans compte ; la mise en ligne et le QR de page en demandent un.
describe("la promesse « sans compte » dit où elle s'arrête", () => {
  it("l'accroche du héros nomme le compte gratuit pour publier", () => {
    const src = readFileSync(join(__dirname, "../HomeClient.tsx"), "utf8")
    expect(src).not.toContain("Prêt en cinq minutes, sans créer de compte.")
    expect(src).toContain("un compte gratuit suffit pour la mettre en ligne avec son QR")
  })
})
