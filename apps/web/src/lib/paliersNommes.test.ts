// Audit du 14 novembre 2026 (E) : Domaines, Export et Rapports disaient « Pro &
// Business » / « Passer au Pro » et testaient une liste écrite à la main.
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { minPlanFor, canDynStats, canDynDomaine } from "./plans"

const lire = (p: string) => readFileSync(join(__dirname, "..", p), "utf8")
const ECRANS = ["app/dashboard/domains/DomainsPage.tsx", "app/dashboard/analytics/ExportPanel.tsx", "app/dashboard/analytics/ReportSubscriptionPanel.tsx"]

describe("les écrans payants nomment le vrai palier", () => {
  it("plus de grille retirée ni de liste écrite à la main", () => {
    for (const f of ECRANS) {
      const s = lire(f)
      expect(s, f).not.toMatch(/Pro & Business|Pro et Business|Passer au Pro<|PAID_PLANS/)
      expect(s, f).toContain("urlDOffre(")
    }
  })
  it("le palier d'accès est Établissement, et Starter n'y a pas droit", () => {
    expect(minPlanFor("dynDomaineMarque")).toBe("pro")
    expect(minPlanFor("dynStatsDetaillees")).toBe("pro")
    expect(canDynDomaine("starter")).toBe(false)
    expect(canDynStats("starter")).toBe(false)
  })
  it("l'abonnement aux rapports est vérifié côté serveur, le désabonnement reste libre", () => {
    const r = lire("app/api/reports/subscribe/route.ts")
    expect(r).toContain('if (enabled && !canDynStats((profile as any)?.plan))')
    expect(r).toContain("status: 403")
  })
})
