// Audit du 14 novembre 2026, lot B : un clic sur un numéro n'est pas un appel,
// un clic vers Calendly n'est pas une réservation confirmée.
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const src = readFileSync(join(__dirname, "GoalsDashboard.tsx"), "utf8")

describe("les objectifs nomment ce qu'ils mesurent", () => {
  it("aucun objectif mesuré par clic ne se nomme comme un résultat confirmé", () => {
    for (const faux of ['label: "Réservation"', 'label: "Achat produit"', 'label: "Appel téléphone"', 'label: "Conversions totales"'])
      expect(src).not.toContain(faux)
    expect(src).toContain('label: "Clic vers la réservation"')
    expect(src).toContain('label: "Clic sur le numéro"')
  })
  it("les objectifs déjà nommés à l'ancienne restent reconnus", () => {
    expect(src).toContain('const ANCIENS_LIBELLES = ["Réservation", "Appel téléphone", "Achat produit", "Formulaire contact"]')
  })
})
