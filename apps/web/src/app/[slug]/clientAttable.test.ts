import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Passage « client attablé » (22 nov., audit UX v2, PUB-002/PUB-007) : ce que
// voit la personne qui scanne ne doit porter que ce qui la sert. Relevé sur une
// vraie page (390 px) : un badge « PRINCIPAL » sur la carte du réseau mis en
// avant — vocabulaire d'éditeur, sans information pour le client.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")
const RENDUS = [
  "../dashboard/builder/shared-renderer/blocks/social_feature/index.tsx",
  "../dashboard/builder/builderPreview.tsx",
]

describe("la page vue par le client qui scanne", () => {
  it("le réseau mis en avant ne porte plus de badge « PRINCIPAL »", () => {
    for (const f of RENDUS) expect(lire(f), f).not.toMatch(/>\s*PRINCIPAL\s*</)
  })
})
