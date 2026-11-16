import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Audit du 14 novembre 2026 (C) : « Abonnement en fin de période → Choisir les
// éléments conservés. » L'accueil le dit, et ne le dit que dans ces états-là.
const avis = readFileSync(join(__dirname, "AvisAbonnement.tsx"), "utf8")

describe("l'avis d'abonnement de l'accueil", () => {
  it("ne parle que d'une fin programmée ou d'un paiement refusé", () => {
    expect(avis).toContain('etat.statut !== "fin_programmee" && etat.statut !== "impaye"')
    expect(avis).toContain("return null")
  })
  it("mène au choix de ce qui reste actif, et à la facturation", () => {
    expect(avis).toContain('href="/dashboard/qr-codes"')
    expect(avis).toContain("Choisir ce qui reste actif")
    expect(avis).toContain('href="/dashboard/settings"')
  })
  it("lit l'état au même endroit que Paramètres", () => {
    expect(avis).toContain("etatFacturation(")
    expect(readFileSync(join(__dirname, "../app/dashboard/DashboardClient.tsx"), "utf8")).toContain("<AvisAbonnement />")
  })
})
