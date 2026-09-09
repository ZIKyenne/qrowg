import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { BLOCK_CATEGORIES, PRESET_CATEGORIES } from "./types"

// Revue interne du 9 septembre (P1, éditeur) : « Business » / « Event » dans la
// bibliothèque, 55 cibles < 32 px sur PC (barre d'outils de bloc 24 px, étoiles
// 22 px), textes de bibliothèque à 10,5 px, et trois niveaux d'onglets empilés
// (Éditer · Thème au-dessus de Contenu · Style · Effets).
// Mesuré après ce lot : 0 cible < 32 px sur PC, un seul niveau d'onglets.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")
const b = lire("BuilderV4.tsx")

describe("français partout dans les catégories", () => {
  it("blocs : Entreprise et Événement, clés techniques inchangées", () => {
    const parId = Object.fromEntries(BLOCK_CATEGORIES.map(c => [c.id, c.label]))
    expect(parId.business).toBe("Entreprise")
    expect(parId.event).toBe("Événement")
    for (const c of BLOCK_CATEGORIES) expect(c.label, c.id).not.toMatch(/^(Business|Event)$/)
  })
  it("thèmes : chaque catégorie a un libellé lu, l'id reste la clé des presets", () => {
    for (const c of PRESET_CATEGORIES) expect(c.label, c.id).not.toMatch(/^(Business|Luxury|Creator|Event|Music|Fitness)$/)
    expect(PRESET_CATEGORIES.find(c => c.id === "Business")?.label).toBe("Entreprise")
    expect(lire("builderPanels.tsx")).toContain("<span style={{ marginLeft: 3 }}>{cat.label}</span>")
  })
  it("vouvoiement dans la bibliothèque", () => {
    expect(b).not.toContain("parcours les catégories")
    expect(b).toContain("parcourez les catégories pour tout voir")
  })
})

describe("un seul niveau d'onglets à droite", () => {
  it("Contenu · Style · Effets · Page, et plus de bandeau « Éditer · Thème »", () => {
    expect(b).toContain('<div role="tablist" aria-label="Réglages"')
    expect(b).toContain('onClick={() => setRightTab("theme")}')
    expect(b).toMatch(/whiteSpace: "nowrap" as const \}\}>Page<\/button>/)
    expect(b).not.toContain('{tab==="edit" ? "Éditer" : "Thème"}')
    // les onglets internes du bloc ne servent plus qu'en mode focus (deux colonnes)
    expect(b).toContain('{focusMode && <div role="tablist" style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--line)", margin: "0 0 14px" }}>')
    // sans bloc sélectionné, les trois onglets de bloc sont inertes mais visibles
    expect(b).toContain("aria-disabled={!selectedBlock || undefined}")
  })
  it("panneau réduit : deux icônes nommées, pour le bloc et pour la page", () => {
    expect(b).toContain('aria-label={tab==="edit" ? "Ouvrir les réglages du bloc" : "Ouvrir le thème de la page"}')
    expect(b).toContain('aria-label="Réduire le panneau"')
  })
})

describe("cibles à 32 px minimum sur PC", () => {
  it("barre d'outils de bloc, favoris, catégories, replier, retour", () => {
    expect((b.match(/width: isMobile\?40:32, height: isMobile\?40:32,/g) ?? []).length).toBe(4)
    expect(b).not.toContain("width: isMobile?40:24")
    expect(b).toContain('width: 32, height: 32, margin: "-5px -5px -5px 0"')
    expect(b).toContain('minHeight: isMobile ? undefined : 32, color: activeCategory===cat.id')
    expect(b).toContain('aria-label="Replier la bibliothèque de blocs" style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", width: 32, height: 32')
    expect(b).toContain('whiteSpace: "nowrap", minHeight: 32, ...(isMobile ? { width: 44, height: 44, fontSize: 19 } : {}) }}>')
  })
  it("segments, badges suggérés, puces de thème, « Changer d'image… »", () => {
    const p = lire("builderPanels.tsx")
    expect(p).toContain('minWidth: 0, minHeight: 32, padding: "6px 9px"')
    expect(p).toContain('style={{ minHeight: 32, padding: "4px 10px", borderRadius: 999')
    expect(p).toContain("borderRadius: 20, minHeight: 32, color: activeCat===cat.id")
    expect(lire("ImageUpload.tsx")).toContain("marginTop: 2, minHeight: 32, background: \"none\"")
  })
  it("textes de la bibliothèque à 12 px", () => {
    expect(b).not.toContain("fontSize: 10.5, color: MUTED, overflow: \"hidden\", textOverflow: \"ellipsis\", whiteSpace: \"nowrap\" }}>{def.description}")
    expect((b.match(/fontSize: 12, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" \}\}>\{def\.description\}/g) ?? []).length).toBeGreaterThanOrEqual(4)
  })
})
