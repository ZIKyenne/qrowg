import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { etoilesDeLAvis } from "./dashboard/builder/shared-renderer/models/testimonials"
import { PublicTestimonials } from "./dashboard/builder/shared-renderer/blocks/testimonials/PublicTestimonials"
import { BLOCK_DEFS, BLOCS_MASQUES, blocsProposables } from "./dashboard/builder/blockDefs"
import { sansCommentaires } from "@/lib/codeSeul"

// U8 (revue du 23 nov., décision du propriétaire : « retire »).
//  · Le bloc « Avis clients » faisait saisir une note moyenne et un nombre d'avis
//    à la main : invérifiables, affichés comme une preuve. Il n'est plus proposé.
//  · Un avis recopié sans note recevait cinq étoiles. Il n'en reçoit plus aucune.

const ctx = { G: "#C9A84C", TEXT: "#111111", MUTED: "#555555", FONT_B: "sans-serif" } as never
const publie = (content: Record<string, string>) =>
  renderToStaticMarkup(<PublicTestimonials content={content} ctx={ctx} {...({} as never)} />)
const etoiles = (html: string) => (html.match(/★/g) || []).length

describe("une note qu'on n'a pas saisie ne s'affiche pas", () => {
  it("sans note : aucune étoile, ni cinq ni zéro dessinée", () => {
    for (const v of [undefined, null, "", "  ", "abc"]) expect(etoilesDeLAvis(v), String(v)).toBe(0)
    expect(etoiles(publie({ name1: "Marie", text1: "Très bon accueil" }))).toBe(0)
  })
  it("la note saisie est rendue telle quelle, bornée à cinq", () => {
    expect(etoilesDeLAvis("4")).toBe(4)
    expect(etoilesDeLAvis("1")).toBe(1)
    expect(etoilesDeLAvis("9")).toBe(5)
    expect(etoiles(publie({ name1: "Marie", text1: "Bien", stars1: "3" }))).toBe(3)
  })
  it("le panneau propose toutes les notes, pas seulement les bonnes", () => {
    const champs = BLOCK_DEFS.testimonials.fields.filter(f => /^stars\d$/.test(f.key))
    expect(champs.length).toBeGreaterThan(0)
    for (const f of champs) expect((f as { options?: string[] }).options).toEqual(["5", "4", "3", "2", "1"])
  })
  it("aucun rendu d'avis ne retombe sur cinq étoiles par défaut", () => {
    const lire = (p: string) => sansCommentaires(readFileSync(join(__dirname, p), "utf8"))
    const rendus = [
      "dashboard/builder/shared-renderer/blocks/testimonials/PublicTestimonials.tsx",
      "dashboard/builder/shared-renderer/blocks/testimonials/EditorTestimonials.tsx",
      "dashboard/builder/builderPreview.tsx",
      "dashboard/templates/TemplatePreviewModal.tsx",
      "[slug]/renduLegacy.tsx",
    ]
    for (const p of rendus) {
      const s = lire(p)
      expect(s, p).not.toMatch(/starRow\(stars \|\| 5\)/)
      expect(s, p).not.toMatch(/combien\((r\.)?stars, 5, 5\)/)
    }
  })
})

describe("le bloc « Avis clients » est retiré", () => {
  it("il n'est plus proposé à l'ajout", () => {
    expect(BLOCS_MASQUES.has("google_reviews_block")).toBe(true)
    expect(blocsProposables().some(([t]) => t === "google_reviews_block")).toBe(false)
  })
  it("ni la bibliothèque, ni un modèle, ni l'onboarding ne le pose", () => {
    const lire = (p: string) => sansCommentaires(readFileSync(join(__dirname, p), "utf8"))
    for (const p of [
      "dashboard/builder/BuilderV4.tsx",
      "dashboard/builder/page-templates.ts",
      "dashboard/builder/editorPresets.ts",
      "dashboard/builder/templateStructures.extra.ts",
      "dashboard/templates/modelesHistoriques.ts",
      "dashboard/onboarding/objectives.ts",
      "dashboard/builder/ai-generate.ts",
    ]) expect(lire(p), p).not.toContain('"google_reviews_block"')
  })
})
