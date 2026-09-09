import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Revue du 9 septembre, fin de chantier : parcours mobiles (aucun défilement
// horizontal, action principale à portée de pouce) et états (chargement, erreur,
// hors connexion) cohérents avec la couche « Calme ».

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")

describe("parcours mobile du générateur", () => {
  const g = lire("generateur-qr-code/GeneratorClient.tsx")
  it("sur téléphone : contenu → aperçu + PNG/SVG → réglages (l'action arrive juste après la saisie)", () => {
    expect(g).toContain("@media(max-width:899px){")
    expect(g).toContain(".gen-main{display:contents}")
    expect(g).toContain(".gen-haut{order:0} .gen-aside{order:1} .gen-reglages{order:2}")
    expect(g).toContain('<div className="gen-haut"')
    expect(g).toContain('<div className="gen-reglages"')
  })
  it("sur grand écran, la colonne de gauche garde son cadre défilant", () => {
    expect(g).toContain(".gen-main{display:flex;flex-direction:column;gap:14px;max-height:calc(100dvh - 32px);overflow-y:auto;")
  })
})

describe("états", () => {
  it("les écrans d'erreur sont sur jetons, sans dégradé ni Fraunces", () => {
    for (const f of ["error.tsx", "dashboard/error.tsx"]) {
      const s = lire(f)
      expect(s, f).not.toContain("linear-gradient")
      expect(s, f).not.toContain("Fraunces")
      expect(s, f).not.toMatch(/#(080808|100F0A|C9A84C|A8A190|6F6A60)/)
      expect(s, f).toContain('background: "var(--accent)"')
    }
  })
  it("le squelette de chargement et le garde-fou d'erreur du tableau de bord existent", () => {
    expect(lire("dashboard/loading.tsx")).toContain('className="skeleton"')
    expect(lire("dashboard/error.tsx")).toContain("export default function DashboardError")
  })
  it("hors connexion : la coquille le dit une fois, pour tous les écrans, sans rien promettre", () => {
    const b = lire("../components/BandeauHorsConnexion.tsx")
    expect(b).toContain('window.addEventListener("online", maj); window.addEventListener("offline", maj)')
    expect(b).toContain('role="status" aria-live="polite"')
    expect(b).toContain("Hors connexion — les modifications ne peuvent pas être enregistrées pour l&apos;instant.")
    expect(lire("dashboard/DashboardShell.tsx")).toContain("<BandeauHorsConnexion />")
  })
})
