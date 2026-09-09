import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Revue interne du 9 septembre (P1, atelier sur téléphone) : la feuille de réglages
// fermée restait dans le DOM, glissée hors écran (translateY(112 %)) — 217 cibles et
// 152 textes comptés, jamais vus, du poids pour rien. Mesuré après : 0 / 0 fermée.

const s = readFileSync(join(__dirname, "PrintStudioClient.tsx"), "utf8")

describe("la feuille de réglages mobile n'est rendue qu'ouverte", () => {
  it("montée à l'ouverture, démontée 360 ms après la fermeture (le temps de glisser)", () => {
    expect(s).toContain("const [sheetMontee, setSheetMontee] = useState(false)")
    expect(s).toContain("if (sheetOpen) { setSheetMontee(true); return }")
    expect(s).toContain("const t = setTimeout(() => setSheetMontee(false), 360)")
    expect(s).toContain("{isMobile && sheetMontee && (")
  })
  it("l'entrée reste animée bien que l'élément soit monté déjà ouvert", () => {
    expect(s).toContain("@keyframes ps-sheet-in-y{from{transform:translateY(112%)}}")
    expect(s).toContain("@keyframes ps-sheet-in-x{from{transform:translateX(112%)}}")
    expect(s).toContain('animation: "ps-sheet-in-y var(--mo-sheet) var(--mo-ease-standard)"')
    expect(s).toContain('animation: "ps-sheet-in-x var(--mo-sheet) var(--mo-ease-standard)"')
  })
})
