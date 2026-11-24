import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { MODELES_DE_GALERIE, modeleDeGalerie } from "./registreDesModeles"
import { PAGE_TEMPLATES } from "../builder/page-templates"
import { normalizePageTheme } from "../builder/types"

// Vague 4, point 5, lot 1 — un registre unique des modèles de la galerie.
// Voir l'en-tête de registreDesModeles.ts pour ce qu'il a corrigé.

const COULEUR = /^#[0-9a-fA-F]{3,8}$|^(rgb|hsl)a?\([0-9.,%\s/-]+\)$/i
const lire = (f: string) => readFileSync(join(__dirname, f), "utf8")

describe("un modèle porte ensemble ce qu'il annonce, son thème et ses blocs", () => {
  it("les 14 historiques et les modèles partagés, chacun une fois", () => {
    const ids = MODELES_DE_GALERIE.map(m => m.id)
    expect(new Set(ids).size, "identifiants en double").toBe(ids.length)
    expect(MODELES_DE_GALERIE.filter(m => m.origine === "historique")).toHaveLength(14)
    expect(MODELES_DE_GALERIE.filter(m => m.origine === "partage")).toHaveLength(PAGE_TEMPLATES.length)
  })
  it("aucun modèle sans thème ni sans blocs — plus de repli sur « freelance »", () => {
    for (const m of MODELES_DE_GALERIE) {
      expect(m.theme, `${m.id} : thème`).toBeTruthy()
      expect(m.blocs.length, `${m.id} : blocs`).toBeGreaterThan(0)
    }
    expect(modeleDeGalerie("modele_qui_n_existe_pas"), "pas de modèle par défaut").toBeUndefined()
  })
  it("les couleurs de la carte SONT celles du thème", () => {
    for (const m of MODELES_DE_GALERIE)
      expect([m.color, m.accent, m.bg, m.surface], m.id).toEqual([m.theme.primary, m.theme.accent, m.theme.bg, m.theme.surface])
  })
})

describe("un thème de page porte de vraies couleurs", () => {
  it("aucune variable CSS du site dans un thème de modèle", () => {
    // `var(--accent)` suit le profil de celui qui regarde, et les blocs composent
    // `${couleur}18` : « freelance » et « immobilier » donnaient `var(--accent)18`.
    const fautes: string[] = []
    for (const m of MODELES_DE_GALERIE)
      for (const cle of ["bg", "surface", "primary", "accent", "text", "muted", "glow_color"] as const) {
        const v = (m.theme as unknown as Record<string, unknown>)[cle]
        if (v !== undefined && !COULEUR.test(String(v))) fautes.push(`${m.id}.${cle} = ${v}`)
      }
    expect(fautes).toEqual([])
  })
  it("la création reçoit ces couleurs telles quelles (normalizePageTheme ne les remplace pas)", () => {
    for (const m of MODELES_DE_GALERIE) {
      const n = normalizePageTheme(m.theme)
      expect([n.primary, n.accent, n.bg], m.id).toEqual([m.theme.primary, m.theme.accent, m.theme.bg])
    }
  })
  it("les valeurs figées sont celles que le site donnait à ces variables", () => {
    expect(modeleDeGalerie("freelance")!.theme.primary).toBe("#D4AF45")
    expect(modeleDeGalerie("freelance")!.theme.accent).toBe("#39FF8F")
    expect(modeleDeGalerie("immobilier")!.theme.accent).toBe("#D4AF45")
  })
})

describe("la galerie et l'aperçu lisent le registre, et rien d'autre", () => {
  it("page.tsx n'assemble plus de modèle", () => {
    const page = lire("page.tsx")
    for (const ancien of ["TEMPLATE_THEMES", "TEMPLATE_BLOCKS", "SHARED_META", "SHARED_THEMES", "SHARED_BLOCKS", '["freelance"]', "MODELES_HISTORIQUES"])
      expect(page, ancien).not.toContain(ancien)
    expect(page).toContain("const TEMPLATES = MODELES_DE_GALERIE")
  })
  it("l'aperçu en grand reçoit le thème du modèle au lieu de le reconstruire", () => {
    const apercu = lire("TemplatePreviewModal.tsx")
    expect(apercu).toContain("const theme: PageTheme = themeDuModele")
    expect(apercu, "la reconstruction depuis la carte").not.toContain("primary: template.color")
    expect(lire("page.tsx")).toContain("theme={previewTemplate.theme}")
    expect(apercu, "la palette lisait un texte crème écrit en dur").not.toContain(`{ c: "#F5F0E8", label: "Texte" }`)
    expect(apercu).toContain(`{ c: theme.text, label: "Texte" }`)
  })
  it("un modèle clair est vu clair : « Coach » n'est plus prévisualisé sur fond sombre", () => {
    const coach = modeleDeGalerie("coach")!
    expect(coach.theme.bg).toBe("#F5FFF5")
    expect(coach.bg, "la carte aussi").toBe("#F5FFF5")
  })
})
