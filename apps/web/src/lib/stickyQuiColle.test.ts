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

describe("…mais jamais dans une miniature de la galerie", () => {
  it("la barre de la Carte illustrée ne colle pas dans une miniature (`mini_…`)", () => {
    const src = readFileSync(join(__dirname, "..", "app", "dashboard", "builder", "shared-renderer", "blocks", "carte_illustree", "PublicCarteIllustree.tsx"), "utf8")
    expect(src).toContain('publicMode && !blockId.startsWith("mini_") ? "sticky" : "relative"')
    const mini = readFileSync(join(__dirname, "..", "app", "dashboard", "templates", "MiniApercu.tsx"), "utf8")
    expect(mini, "les miniatures nomment leurs blocs `mini_…`").toContain("id: `mini_${cle}_${i}`")
  })
})
