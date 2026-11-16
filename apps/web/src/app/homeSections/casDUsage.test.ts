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

// Audit D2 : la démo Restaurant annonçait « Avis Google » et « Événements » ; le
// parcours n'ouvrait aucun modèle précis, et Bistrot français n'avait ni l'un ni l'autre.
describe("la démo Restaurant ouvre le modèle qui tient ses promesses", () => {
  it("ouvre Bistrot français, et chaque bloc annoncé y existe", async () => {
    const { MODELE_DU_CAS, BLOC_DE_LA_DEMO } = await import("./UseCases")
    const { PAGE_TEMPLATES } = await import("../dashboard/builder/page-templates")
    const { creerUrlModele } = await import("../creer/entry")
    const modele = PAGE_TEMPLATES.find(t => t.key === MODELE_DU_CAS.restaurant)!
    expect(modele).toBeTruthy()
    expect(new URL(creerUrlModele(modele.key, "Restaurant"), "https://x").searchParams.get("modele")).toBe("resto_bistrot")
    const src = readFileSync(join(__dirname, "UseCases.tsx"), "utf8")
    const resto = src.slice(src.indexOf('id: "restaurant"'), src.indexOf('id: "freelance"'))
    const annonces = [...resto.matchAll(/label:"([^"]+)"/g)].map(m => m[1])
    expect(annonces.length).toBe(6)
    const types = modele.blocks.map(b => b.type)
    for (const a of annonces) {
      expect(BLOC_DE_LA_DEMO[a], `« ${a} » sans bloc correspondant`).toBeTruthy()
      expect(types, `« ${a} » annoncé mais absent du modèle`).toContain(BLOC_DE_LA_DEMO[a])
    }
  })
  it("collecte d'avis et avis affichés sont deux choses distinctes", async () => {
    const { BLOC_DE_LA_DEMO } = await import("./UseCases")
    expect(BLOC_DE_LA_DEMO["Avis Google"]).toBe("google_review")
    expect(BLOC_DE_LA_DEMO["Avis affichés"]).toBe("testimonials")
  })
})
