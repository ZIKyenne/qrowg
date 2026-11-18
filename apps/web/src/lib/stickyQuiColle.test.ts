import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// 18 nov. : `overflow-x: hidden` sur html ET body faisait de <body> une zone de
// défilement immobile — aucun `position: sticky` du site public ne collait.
// Mesuré au navigateur (Carte illustrée : barre partie à -716 px). La mesure
// vivante est e2e/carteIllustree.spec.ts ; ceci empêche le retour de la règle.
describe("les éléments collants du site collent", () => {
  it("html et body coupent le débordement par `clip`, pas seulement `hidden`", () => {
    const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8")
    expect(css).toContain("html, body { overflow-x: hidden; overflow-x: clip; }")
    expect(css, "la règle d'origine, seule, est revenue").not.toMatch(/html,\s*body\s*\{\s*overflow-x:\s*hidden;\s*\}/)
  })
})
