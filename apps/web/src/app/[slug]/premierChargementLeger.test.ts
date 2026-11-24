import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { sansCommentaires } from "@/lib/codeSeul"

// Relevé du 24 nov. : v352 importait `traductionDesCartes` dans le premier
// chargement de la page publique. Ce module lit les modèles de toutes les cartes
// (et, par l'happy hour, le fichier de types du builder) : 188 → 202 Ko gzip, au-
// delà du budget (197). Sept déploiements de production ont échoué (v352 → v359).
// Le premier chargement n'a besoin que des LANGUES : ./langueDesCartes.

const lire = (p: string) => sansCommentaires(readFileSync(join(__dirname, p), "utf8"))
const LOURD = /from ["'][^"']*models\/traductionDesCartes["']/

describe("le premier chargement de la page publique reste léger", () => {
  it("la page et la barre de langues n'importent que la partie légère", () => {
    for (const p of ["PublicPageClient.tsx", "../dashboard/builder/shared-renderer/primitives/langueDeLaPage.tsx"]) {
      const s = lire(p)
      expect(s, p).not.toMatch(LOURD)
    }
    expect(lire("PublicPageClient.tsx")).toMatch(/from ["']\.\.\/dashboard\/builder\/shared-renderer\/models\/langueDesCartes["']/)
  })
  it("le module léger ne lit aucun modèle de carte", () => {
    const s = lire("../dashboard/builder/shared-renderer/models/langueDesCartes.ts")
    const imports = [...s.matchAll(/from ["']([^"']+)["']/g)].map(m => m[1])
    expect(imports.sort()).toEqual(["./repeaterExtract", "./traductionCarte"])
  })
})
