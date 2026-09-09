import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Relevé du 4 septembre : /examples, /creer et la galerie sautaient de h1 à h3 ;
// l'éditeur n'avait aucun h1. L'ordre dans le fichier suit l'ordre du DOM d'assez
// près pour tenir lieu de garde-fou.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")

function niveaux(src: string): number[] {
  return [...src.matchAll(/<h([1-6])[\s>]/g)].map(m => Number(m[1]))
}

const PAGES = ["examples/page.tsx", "dashboard/templates/page.tsx", "HomeClient.tsx", "features/page.tsx", "contact/page.tsx", "upgrade/page.tsx", "privacy/page.tsx", "terms/page.tsx", "security/page.tsx"]

describe("hiérarchie des titres", () => {
  it("PageHeader porte exactement un h1", () => {
    // le commentaire d'en-tête dessine aussi un <h1> : on ne lit que le JSX
    const src = readFileSync(join(__dirname, "../components/ui/PageHeader.tsx"), "utf8")
    expect(niveaux(src.slice(src.indexOf("export function PageHeader")))).toEqual([1])
  })

  for (const p of PAGES) {
    it(`${p} : un seul h1, jamais de niveau sauté`, () => {
      const src = lire(p)
      // Les pages légales reçoivent leur h1 de LegalLayout ; les écrans du
      // tableau de bord, de PageHeader (un seul h1 dedans, cf. components/ui).
      const n = src.includes("<LegalLayout") || src.includes("<PageHeader") ? [1, ...niveaux(src)] : niveaux(src)
      expect(n.filter(x => x === 1).length, "h1").toBe(1)
      let max = 1
      for (const x of n) {
        expect(x, `niveau ${x} après h${max}`).toBeLessThanOrEqual(max + 1)
        max = Math.max(max, x)
      }
    })
  }

  it("l'éditeur a un h1 (le nom de la page, discret)", () => {
    const src = lire("dashboard/builder/BuilderV4.tsx")
    expect(src).toContain("{pageName || \"Page sans titre\"} — éditeur</h1>")
  })
})
