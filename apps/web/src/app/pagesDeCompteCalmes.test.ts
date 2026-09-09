import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// 9 septembre — les pages « autour du compte » (offres, connexion, inscription,
// mot de passe) suivent la coquille : aplat --bg sans particules ni halo, cartes
// sur --surface + filet, un seul accent (l'or) — le bouton d'abonnement garde
// sa séquence de scan mais sa face au repos est plate.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")

describe("/upgrade", () => {
  const src = lire("upgrade/page.tsx")
  it("aplat --bg, sans particules ni halo radial", () => {
    expect(src).not.toContain("Particles")
    expect(src).not.toContain("radial-gradient")
    expect(src).toContain('background: "var(--bg)"')
  })
  it("en-tête calme (kicker + titre ≤ 32 px, sans Fraunces) et cartes plates", () => {
    expect(src).toContain(">\n            Votre abonnement\n          </div>")
    expect(src).not.toContain("Fraunces")
    expect(src).not.toMatch(/transform: plan\.highlight \? "scale\(1\.04\)"/)
    expect(src).toContain('background: "var(--surface)", border: "1px solid " + (plan.highlight ? "color-mix(in srgb, var(--accent) 60%, transparent)"')
  })
  it("un seul accent : le bouton d'abonnement est or, pas de la couleur du plan", () => {
    expect(src).toContain('accent="#D4AF45"')
    expect(src).not.toContain("accent={pc}")
    expect(src).not.toContain("linear-gradient(90deg,var(--action),#818CF8)")
  })
})

describe("SubscribeButton", () => {
  const src = readFileSync(join(__dirname, "../components/SubscribeButton.tsx"), "utf8")
  it("face au repos à plat : aplat d'accent, sans halo ni relief ; la séquence de scan reste", () => {
    expect(src).toContain("background: accent,")
    expect(src).toContain('boxShadow: "none",')
    expect(src).not.toContain("0 20px 42px")
    expect(src).toContain("scan")
    expect(src).toContain('accent = "#D4AF45"')
  })
})

describe("pages d'authentification", () => {
  for (const f of ["auth/login/page.tsx", "auth/signup/page.tsx", "auth/forgot-password/page.tsx", "auth/reset-password/page.tsx"]) {
    it(`${f} : sans particules ni halo, carte sur jetons`, () => {
      const s = lire(f)
      expect(s).not.toContain("Particles")
      expect(s).not.toContain("radial-gradient(ellipse 60% 50%")
      expect(s).toContain("background: 'var(--bg)'")
      expect(s).toContain("background: 'var(--surface)', border: '1px solid var(--line-strong)'")
    })
  }
})
