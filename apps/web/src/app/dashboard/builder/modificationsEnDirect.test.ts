import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PHRASE_EN_DIRECT, LIBELLE_ENREGISTRER_EN_LIGNE } from "./builderUx"

// Décision D1-A (audit UX v2, 22 nov.). Une page publiée n'a pas de copie
// publique distincte : ce qui est enregistré est en ligne aussitôt. L'éditeur
// disait pourtant « Mettre à jour la page », comme s'il restait une étape —
// un gérant pouvait croire ses changements à moitié faits encore invisibles.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")
// L'éditeur de bureau = BuilderV4 + sa fenêtre « Publier », sortie dans son fichier.
const editeur = lire("BuilderV4.tsx") + lire("FenetrePublier.tsx")
const coqueMobile = lire("MobileBuilderShell.tsx")

describe("modifier une page déjà en ligne", () => {
  it("la prémisse tient : on enregistre dans les blocs que lit la page publique", () => {
    // Si un jour une copie publiée séparée existe (option D1-B), cette garde
    // tombe — et la phrase « visibles dès qu'elles sont enregistrées » devient
    // fausse : il faudra la changer en même temps.
    expect(lire("savePage.ts")).toMatch(/from\("blocks"\)/)
    expect(lire("../../[slug]/lecturePublique.ts")).toContain("blocks(*)")
  })

  it("l'éditeur le dit, et ne propose plus de « mettre à jour » ce qui l'est déjà", () => {
    expect(PHRASE_EN_DIRECT).toMatch(/dès qu'elles sont enregistrées/)
    for (const src of [editeur, coqueMobile]) {
      expect(src).toContain("PHRASE_EN_DIRECT")
      expect(src).toContain("LIBELLE_ENREGISTRER_EN_LIGNE")
      expect(src).not.toContain("Mettre à jour la page")
    }
    expect(LIBELLE_ENREGISTRER_EN_LIGNE).toBe("Enregistrer maintenant")
  })
})
