import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// 9 septembre — Statistiques, QR de pages et l'Atelier d'impression suivent la
// coquille : cartes plates sur --surface avec un filet, plus de halos radiaux ni
// de dégradés violet/vert, une palette de graphiques calme (or + gris), des
// segmenteurs sans or plein, un seul bouton or par colonne.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")

describe("Statistiques", () => {
  const src = lire("analytics/AnalyticsClient.tsx")
  it("le fond est un aplat --bg, sans halo radial", () => {
    expect(src).toContain('className="analytics-root" style={{ minHeight: "100dvh", background: "var(--bg)"')
    expect(src).not.toMatch(/radial-gradient\(circle/)
  })
  it("plus de cartes violettes ni vertes : surfaces + filets", () => {
    expect(src).not.toContain("#7B61FF")
    expect(src).not.toContain("rgba(123,97,255")
    expect(src).not.toContain("rgba(57,255,143,0.3)")
    expect(src).not.toContain("#100F0A")
    expect(src).not.toContain("#F8F4EC")
    expect(src).not.toContain("Fraunces")
  })
  it("la palette des graphiques est calme : l'or d'abord, puis des teintes désaturées", () => {
    expect(src).toContain('const COLORS = [GOLD, "#A7A69F"')
    expect(src).not.toContain('"#FFE66D"')
  })
  it("la période est un segmenteur plat (surface + filet d'accent), pas un bouton or", () => {
    expect(src).toContain('boxShadow: period === d ? "inset 0 -2px 0 var(--accent)" : "none"')
    expect(src).not.toContain('color: period === d ? "#1a1408"')
  })
  it("la courbe des vues est grise, l'or reste aux scans", () => {
    const ov = lire("analytics/OverviewCards.tsx")
    expect(ov).toContain('const GREEN = "#A7A69F"')
    expect(ov).toContain('const CARD_BG = "var(--surface)", CARD_BC = "var(--line-strong)"')
  })
  it("les panneaux (cartes sur --surface) n'ont plus de contour doré", () => {
    for (const f of ["TopLinksPanel", "GeoPanel", "DevicePanel", "BlockPerformancePanel", "GoalsDashboard", "OverviewCards", "AnalyticsClient"]) {
      expect(lire(`analytics/${f}.tsx`), f).not.toMatch(/background: "var\(--surface\)", border: "1px solid color-mix\(in srgb, var\(--accent\) (1[0-9]|2[0-9]|30)%, transparent\)"/)
    }
  })
})

describe("QR de pages", () => {
  it("un seul bouton or sous l'aperçu : Télécharger ; Enregistrer le style passe en contour", () => {
    const src = lire("qr-codes/QRStudio.tsx")
    expect(src).toContain('className="qb-ghost qb-save"')
    expect(src).not.toContain('className="qb-gold qb-save"')
  })
  it("le segmenteur Simple / Intermédiaire / Expert n'a plus de halo ni de reflet", () => {
    const src = lire("qr-codes/SegmentedControl.tsx")
    expect(src).not.toContain("sc-halo")
    expect(src).not.toContain("sc-sheen")
    expect(src).not.toContain("linear-gradient")
    expect(src).toContain('boxShadow: "inset 0 -2px 0 var(--accent)"')
    expect(src).toContain('role="tablist"')
  })
})

describe("Atelier d'impression", () => {
  it("son en-tête a la même forme que les autres écrans (kicker · titre 22 px)", () => {
    const src = lire("print-studio/PrintStudioClient.tsx")
    expect(src).toContain(">Imprimer · Atelier d'impression</span>")
    expect(src).toMatch(/<h1 style=\{\{ fontSize: 22, fontWeight: 600[^}]*\}\}>Choisissez un support<\/h1>/)
    expect(src).not.toContain('fontFamily: "Fraunces, Georgia, serif", fontSize: "clamp(26px,4vw,34px)"')
  })
})

describe("bancs d'essai (captures et tests, 404 en production)", () => {
  for (const d of ["qr-studio", "statistiques"]) {
    it(`e2e-harness/${d} est gaté et enveloppé des fournisseurs de la coquille`, () => {
      const src = readFileSync(join(__dirname, "../e2e-harness", d, "page.tsx"), "utf8")
      expect(src).toContain("if (!harnessAutorise()) notFound()")
      expect(src).toContain("<ToastProvider><ConfirmProvider>")
      expect(src).toMatch(/démo/)
    })
  }
})
