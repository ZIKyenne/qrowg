import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// 8 septembre : douze écrans, douze en-têtes (titres de 22 à 44 px, centrés ou
// non, pastilles à paillettes, icônes dans des tuiles dégradées). Un seul
// composant désormais : PageHeader (kicker · titre 22 px · sous-titre · actions
// à droite). Ce test empêche un écran de refaire son en-tête à sa façon.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")

const ECRANS = [
  "DashboardClient.tsx", "templates/page.tsx", "qr-link/page.tsx", "qr-codes/page.tsx",
  "analytics/AnalyticsClient.tsx", "leads/LeadsClient.tsx", "assets/page.tsx", "team/page.tsx",
  "domains/DomainsPage.tsx", "redirects/RedirectsPanel.tsx", "settings/page.tsx",
]

describe("en-têtes de page", () => {
  for (const p of ECRANS) {
    it(`${p} passe par PageHeader et n'écrit plus son propre <h1>`, () => {
      const src = lire(p)
      expect(src).toContain('from "@/components/ui/PageHeader"')
      expect(src).toContain("<PageHeader")
      expect(src).not.toMatch(/<h1[\s>]/)
    })
  }

  it("le profil garde son h1 (à côté de l'avatar) mais à la même taille que les autres", () => {
    const src = lire("profile/page.tsx")
    const h1 = src.match(/<h1 style=\{\{[^}]*\}\}/)?.[0] ?? ""
    expect(h1).toContain("fontSize: 22")
    expect(h1).not.toContain("Fraunces")
  })

  it("PageHeader : kicker discret, titre 22 px aligné à gauche, sous-titre en une phrase", () => {
    const src = readFileSync(join(__dirname, "../../components/ui/PageHeader.tsx"), "utf8")
    // Le surtitre est passé de 10,5 à 11,5 px sur --muted (règle « rien sous 11 px »).
    // Cette garde citait « fontSize: 11.5 ». Le lot v194 a aligné les tailles
    // sur une échelle ; épingler la valeur exacte interdisait l'alignement.
    // Recalée sur ce qui fait un kicker, et sur le plancher de 11 px.
    const k = src.match(/fontSize: (\d+(?:\.\d+)?), letterSpacing: "\.18em", textTransform: "uppercase", color: "var\(--muted\)"/)
    expect(k, "le surtitre n'a plus sa forme de kicker").not.toBeNull()
    const kpx = Number(k![1])
    expect(kpx, `surtitre à ${kpx}px`).toBeGreaterThanOrEqual(11)
    expect(kpx, `surtitre à ${kpx}px : ce n'est plus un surtitre`).toBeLessThanOrEqual(13)
    expect(src).toMatch(/<h1 style=\{\{[^}]*fontSize: 22/)
    expect(src).not.toContain("textAlign")
    expect(src).not.toContain("Fraunces")
  })

  it("plus de titre centré ni de pastille à paillettes sur Modèles", () => {
    const src = lire("templates/page.tsx")
    expect(src).not.toMatch(/textAlign: "center", maxWidth: 960/)
    expect(src).not.toMatch(/<Sparkles size=\{13\} color=\{G\} \/>\s*<span[^>]*>Modèles<\/span>/)
  })

  it("Statistiques s'appelle Statistiques (le nom du rail), pas Analytics", () => {
    expect(lire("analytics/AnalyticsClient.tsx")).not.toMatch(/>\s*Analytics\s*</)
  })
})
